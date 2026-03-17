from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from quizzes.models import Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, QuizStatus, AttemptStatus
from quizzes.serializers.quiz_serializers import (
    QuizListSerializer,
    QuizDetailSerializer,
    CreateQuizSerializer,
    GenerateQuizSerializer,
    QuizAttemptSerializer,
    SubmitAttemptSerializer,
)


# ---------------------------------------------------------------------------
# Quiz CRUD
# ---------------------------------------------------------------------------

class QuizListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Quiz.objects.select_related("pairing__teacher", "pairing__student").prefetch_related("questions")
        if user.role == "teacher":
            return qs.filter(pairing__teacher=user)
        elif user.role == "student":
            return qs.filter(pairing__student=user, status=QuizStatus.PUBLISHED)
        return qs  # admin sees all

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateQuizSerializer
        return QuizListSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers and admins can create quizzes."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateQuizSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save()
        return Response(QuizDetailSerializer(quiz, context={"request": request}).data, status=status.HTTP_201_CREATED)


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Quiz.objects.select_related("pairing__teacher", "pairing__student").prefetch_related("questions__options")
        if user.role == "teacher":
            return qs.filter(pairing__teacher=user)
        elif user.role == "student":
            return qs.filter(pairing__student=user, status=QuizStatus.PUBLISHED)
        return qs

    def get_serializer_class(self):
        return QuizDetailSerializer

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers and admins can delete quizzes."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# AI Generation
# ---------------------------------------------------------------------------

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers can generate quizzes."}, status=status.HTTP_403_FORBIDDEN)

        serializer = GenerateQuizSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from pairings.models import TeacherStudentPairing
        pairing = TeacherStudentPairing.objects.get(id=data["pairing_id"])

        lesson = None
        if data.get("lesson_id"):
            from lessons.models import Lesson
            try:
                lesson = Lesson.objects.get(id=data["lesson_id"], pairing=pairing)
            except Lesson.DoesNotExist:
                pass

        title = data.get("title") or f"{data['topic']} Quiz"
        subject = data.get("subject") or pairing.subject

        # Call AI
        from quizzes.services.ai_generator import generate_quiz_questions
        try:
            questions_data = generate_quiz_questions(
                topic=data["topic"],
                subject=subject,
                num_questions=data["num_questions"],
                difficulty=data["difficulty"],
                question_types=data["question_types"],
            )
        except Exception as e:
            return Response({"detail": f"AI generation failed: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Create quiz + questions + options in DB
        quiz = Quiz.objects.create(
            pairing=pairing,
            lesson=lesson,
            title=title,
            subject=subject,
            generated_by_ai=True,
            created_by=request.user,
        )

        for i, q in enumerate(questions_data):
            question = QuizQuestion.objects.create(
                quiz=quiz,
                question_type=q["type"],
                question_text=q["question_text"],
                order=i + 1,
                explanation=q.get("explanation", ""),
            )
            for j, opt in enumerate(q.get("options", [])):
                QuizOption.objects.create(
                    question=question,
                    text=opt["text"],
                    is_correct=opt.get("is_correct", False),
                    order=j + 1,
                )

        return Response(
            QuizDetailSerializer(quiz, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------

class PublishQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers can publish quizzes."}, status=status.HTTP_403_FORBIDDEN)
        try:
            quiz = Quiz.objects.get(pk=pk, pairing__teacher=request.user) if request.user.role == "teacher" \
                else Quiz.objects.get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        quiz.status = QuizStatus.PUBLISHED
        quiz.save(update_fields=["status", "updated_at"])
        return Response(QuizDetailSerializer(quiz, context={"request": request}).data)


# ---------------------------------------------------------------------------
# Attempt (student)
# ---------------------------------------------------------------------------

class QuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_published_quiz(self, pk, user):
        try:
            return Quiz.objects.get(pk=pk, pairing__student=user, status=QuizStatus.PUBLISHED)
        except Quiz.DoesNotExist:
            return None

    def get(self, request, pk):
        quiz = self._get_published_quiz(pk, request.user)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            attempt = QuizAttempt.objects.prefetch_related("answers__question__options", "answers__selected_option").get(
                quiz=quiz, student=request.user
            )
            return Response(QuizAttemptSerializer(attempt).data)
        except QuizAttempt.DoesNotExist:
            return Response({"detail": "No attempt found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        quiz = self._get_published_quiz(pk, request.user)
        if not quiz:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        attempt, created = QuizAttempt.objects.get_or_create(quiz=quiz, student=request.user)
        if not created and attempt.status == AttemptStatus.SUBMITTED:
            return Response({"detail": "You have already submitted this quiz."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Submit attempt
# ---------------------------------------------------------------------------

class SubmitAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            attempt = QuizAttempt.objects.select_related("quiz").get(
                quiz_id=pk, student=request.user
            )
        except QuizAttempt.DoesNotExist:
            return Response({"detail": "Attempt not found. Start the quiz first."}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status == AttemptStatus.SUBMITTED:
            return Response({"detail": "This attempt has already been submitted."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data["answers"]

        questions = {str(q.id): q for q in attempt.quiz.questions.prefetch_related("options").all()}
        total_points = sum(q.points for q in questions.values())
        score = 0

        for ans in answers_data:
            q_id = str(ans["question_id"])
            opt_id = str(ans["selected_option_id"])

            if q_id not in questions:
                continue
            question = questions[q_id]

            try:
                option = question.options.get(id=opt_id)
            except QuizOption.DoesNotExist:
                continue

            correct = option.is_correct
            pts = question.points if correct else 0
            score += pts

            QuizAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "selected_option": option,
                    "is_correct": correct,
                    "points_earned": pts,
                },
            )

        attempt.score = score
        attempt.total_points = total_points
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=["score", "total_points", "status", "submitted_at", "updated_at"])

        return Response(
            QuizAttemptSerializer(
                QuizAttempt.objects.prefetch_related("answers__question__options", "answers__selected_option").get(pk=attempt.pk)
            ).data
        )


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

class QuizResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = request.user

        if user.role in ("teacher", "admin"):
            # Teacher sees all attempts for their quiz
            try:
                quiz = Quiz.objects.get(pk=pk, pairing__teacher=user) if user.role == "teacher" \
                    else Quiz.objects.get(pk=pk)
            except Quiz.DoesNotExist:
                return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
            attempts = QuizAttempt.objects.filter(quiz=quiz).select_related("student").prefetch_related(
                "answers__question", "answers__selected_option"
            )
            data = []
            for a in attempts:
                data.append({
                    "id": str(a.id),
                    "student_name": f"{a.student.first_name} {a.student.last_name}".strip(),
                    "student_email": a.student.email,
                    "status": a.status,
                    "score": a.score,
                    "total_points": a.total_points,
                    "submitted_at": a.submitted_at,
                    "percentage": round(a.score / a.total_points * 100, 1) if a.total_points else None,
                })
            return Response(data)

        elif user.role == "student":
            # Student sees own attempt with full breakdown
            try:
                attempt = QuizAttempt.objects.prefetch_related(
                    "answers__question__options", "answers__selected_option"
                ).get(quiz_id=pk, student=user)
            except QuizAttempt.DoesNotExist:
                return Response({"detail": "No attempt found."}, status=status.HTTP_404_NOT_FOUND)
            if attempt.status != AttemptStatus.SUBMITTED:
                return Response({"detail": "Submit the quiz first to see results."}, status=status.HTTP_400_BAD_REQUEST)
            return Response(QuizAttemptSerializer(attempt).data)

        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
