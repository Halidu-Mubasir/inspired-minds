from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services import quotas
from ai_services.attachments import AttachmentError, lesson_brief, resource_attachment
from ai_services.models import AIFeature, AIGeneration
from ai_services.prompts import SUMMARY_FORMATS, SUMMARY_LENGTHS, question_system, summary_system
from ai_services.providers import AIError, get_provider
from ai_services.schemas import QuestionSet
from ai_services.serializers import AIGenerationSerializer, QuestionRequestSerializer, SummaryRequestSerializer
from ai_services.views.common import error_response, quota_response, record_usage
from lessons.models import Lesson
from users.models import UserRole
from users.permissions import IsAdminOrTeacher

QUESTION_TYPES = {
    "mixed": "a mix of multiple choice, short answer and structured questions",
    "multiple_choice": "multiple choice questions",
    "short_answer": "short answer questions",
    "structured": "structured (multi-part, worked) questions",
}

REFUSED = "The AI declined this request. Try rewording the topic or instructions."


class _TeacherToolView(APIView):
    permission_classes = [IsAdminOrTeacher]
    request_serializer: type

    def _prepare(self, request):
        """Validate input, then check AI is available and the daily cap. Returns
        (data, provider, lesson, attachments) or a ready error Response."""
        serializer = self.request_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lesson = None
        if data.get("lesson_id"):
            lesson = (
                Lesson.objects.for_user(request.user)
                .select_related("pairing__subject")
                .prefetch_related("topics")
                .filter(pk=data["lesson_id"])
                .first()
            )
            if lesson is None:
                return Response({"lesson_id": ["Lesson not found."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            provider = get_provider()
        except AIError as error:
            return error_response(error)
        try:
            quotas.check_quota(request.user, quotas.TEACHER_TOOLS)
        except quotas.QuotaExceeded as exceeded:
            return quota_response(exceeded, "AI tool runs")

        attachments = ()
        if data.get("resource_id"):
            try:
                attachments = (resource_attachment(data["resource_id"]),)
            except AttachmentError as error:
                return Response({"resource_id": [str(error)]}, status=status.HTTP_400_BAD_REQUEST)
        return data, provider, lesson, attachments

    def _created(self, request, generation: AIGeneration) -> Response:
        payload = AIGenerationSerializer(generation).data
        payload["usage"] = quotas.quota_summary(request.user, quotas.TEACHER_TOOLS)
        return Response(payload, status=status.HTTP_201_CREATED)


class QuestionGeneratorView(_TeacherToolView):
    request_serializer = QuestionRequestSerializer

    def post(self, request):
        prepared = self._prepare(request)
        if isinstance(prepared, Response):
            return prepared
        data, provider, lesson, attachments = prepared

        lines = [
            f"Write {data['count']} practice questions: {QUESTION_TYPES[data['question_type']]}.",
            f"Subject: {data['subject'].name}",
            f"Topic: {data['topic']}",
            f"Level: {data['level']}",
            f"Difficulty: {data['difficulty']}",
        ]
        if data.get("instructions"):
            lines.append(f"Teacher's instructions: {data['instructions']}")
        if lesson:
            lines.append("\nBase the questions on this lesson:\n" + lesson_brief(lesson))
        if attachments:
            lines.append("\nBase the questions on the attached file.")

        try:
            result = provider.generate_structured(
                system=question_system(), prompt="\n".join(lines), attachments=attachments,
                # Medium effort: the answers and marking guides have to be right.
                schema=QuestionSet, effort="medium",
            )
        except AIError as error:
            return error_response(error)
        record_usage(request.user, AIFeature.QUESTIONS, result.usage, result.refused)

        if result.refused:
            return Response({"detail": REFUSED}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if result.parsed is None or not result.parsed.questions:
            return Response(
                {"detail": "The AI's answer came back incomplete. Try asking for fewer questions."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        generation = AIGeneration.objects.create(
            created_by=request.user,
            kind=AIFeature.QUESTIONS,
            title=result.parsed.title[:255],
            params={
                "subject": data["subject"].name, "topic": data["topic"], "level": data["level"],
                "count": data["count"], "question_type": data["question_type"],
                "difficulty": data["difficulty"], "instructions": data.get("instructions", ""),
            },
            output=result.parsed.model_dump(),
            lesson=lesson,
            resource=data.get("resource_id"),
        )
        return self._created(request, generation)


class SummaryView(_TeacherToolView):
    request_serializer = SummaryRequestSerializer

    def post(self, request):
        prepared = self._prepare(request)
        if isinstance(prepared, Response):
            return prepared
        data, provider, lesson, attachments = prepared
        resource = data.get("resource_id")

        sources = []
        if lesson:
            sources.append(lesson_brief(lesson))
        if data.get("text", "").strip():
            sources.append(f"<notes>\n{data['text'].strip()}\n</notes>")
        prompt = "\n\n".join([
            SUMMARY_FORMATS[data["format"]],
            SUMMARY_LENGTHS[data["length"]],
            *(["Summarise the attached file."] if attachments else []),
            *(["Material:\n" + "\n\n".join(sources)] if sources else []),
        ])

        try:
            result = provider.generate_text(
                system=summary_system(), prompt=prompt, attachments=attachments, effort="low"
            )
        except AIError as error:
            return error_response(error)
        record_usage(request.user, AIFeature.SUMMARY, result.usage, result.refused)

        if result.refused:
            return Response({"detail": REFUSED}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        if not result.text:
            return Response({"detail": "The AI didn't return a summary. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

        source_name = lesson.title if lesson else resource.title if resource else "pasted notes"
        label = "Revision sheet" if data["format"] == "revision_sheet" else "Teacher summary"
        generation = AIGeneration.objects.create(
            created_by=request.user,
            kind=AIFeature.SUMMARY,
            title=f"{label}: {source_name}"[:255],
            params={"format": data["format"], "length": data["length"]},
            output={"markdown": result.text},
            lesson=lesson,
            resource=resource,
        )
        return self._created(request, generation)


class GenerationListView(generics.ListAPIView):
    """The signed-in teacher's saved question sets and summaries (?kind=questions|summary)."""
    permission_classes = [IsAdminOrTeacher]
    serializer_class = AIGenerationSerializer
    filter_backends = []

    def get_queryset(self):
        qs = AIGeneration.objects.filter(created_by=self.request.user)
        kind = self.request.query_params.get("kind")
        return qs.filter(kind=kind) if kind else qs


class GenerationDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAdminOrTeacher]
    serializer_class = AIGenerationSerializer

    def get_queryset(self):
        return AIGeneration.objects.filter(created_by=self.request.user)


class AIUsageView(APIView):
    """Whether AI is set up, and today's usage against the caps that apply to this user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            get_provider()
            configured = True
        except AIError:
            configured = False
        group = quotas.TUTOR if request.user.role == UserRole.STUDENT else quotas.TEACHER_TOOLS
        return Response({"configured": configured, group: quotas.quota_summary(request.user, group)})
