from rest_framework import serializers
from quizzes.models import (
    Quiz, QuizQuestion, QuizOption, QuizStatus,
    QuizAttempt, QuizAnswer,
)


# ---------------------------------------------------------------------------
# Option
# ---------------------------------------------------------------------------

class QuizOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOption
        fields = ["id", "text", "is_correct", "order"]


class QuizOptionStudentSerializer(serializers.ModelSerializer):
    """Hides is_correct from students while the quiz is not yet submitted."""
    class Meta:
        model = QuizOption
        fields = ["id", "text", "order"]


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------

class QuizQuestionSerializer(serializers.ModelSerializer):
    options = QuizOptionSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ["id", "question_type", "question_text", "order", "points", "explanation", "options"]


class QuizQuestionStudentSerializer(serializers.ModelSerializer):
    """For students taking the quiz — hides explanation and is_correct."""
    options = QuizOptionStudentSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ["id", "question_type", "question_text", "order", "points", "options"]


class QuizQuestionResultSerializer(serializers.ModelSerializer):
    """After submission — exposes explanation and correct options."""
    options = QuizOptionSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ["id", "question_type", "question_text", "order", "points", "explanation", "options"]


# ---------------------------------------------------------------------------
# Quiz list / detail
# ---------------------------------------------------------------------------

class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "subject", "status", "question_count",
            "time_limit_minutes", "generated_by_ai", "created_at", "student_name",
        ]

    def get_student_name(self, obj):
        student = obj.pairing.student
        return f"{student.first_name} {student.last_name}".strip()


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    student_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "pairing", "lesson", "title", "subject", "description",
            "status", "time_limit_minutes", "generated_by_ai", "created_at",
            "question_count", "student_name", "teacher_name", "questions",
        ]

    def get_questions(self, obj):
        request = self.context.get("request")
        qs = obj.questions.prefetch_related("options").all()
        if request and request.user.role == "student":
            return QuizQuestionStudentSerializer(qs, many=True).data
        return QuizQuestionSerializer(qs, many=True).data

    def get_student_name(self, obj):
        s = obj.pairing.student
        return f"{s.first_name} {s.last_name}".strip()

    def get_teacher_name(self, obj):
        t = obj.pairing.teacher
        return f"{t.first_name} {t.last_name}".strip()


# ---------------------------------------------------------------------------
# Create / Generate
# ---------------------------------------------------------------------------

class CreateQuizSerializer(serializers.ModelSerializer):
    pairing_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Quiz
        fields = ["pairing_id", "title", "subject", "description", "time_limit_minutes"]

    def validate_pairing_id(self, value):
        from pairings.models import TeacherStudentPairing
        try:
            pairing = TeacherStudentPairing.objects.get(id=value)
        except TeacherStudentPairing.DoesNotExist:
            raise serializers.ValidationError("Pairing not found.")
        request = self.context.get("request")
        if request and request.user.role == "teacher" and pairing.teacher != request.user:
            raise serializers.ValidationError("You can only create quizzes for your own pairings.")
        return value

    def create(self, validated_data):
        from pairings.models import TeacherStudentPairing
        pairing_id = validated_data.pop("pairing_id")
        pairing = TeacherStudentPairing.objects.get(id=pairing_id)
        request = self.context.get("request")
        return Quiz.objects.create(
            pairing=pairing,
            created_by=request.user if request else None,
            **validated_data,
        )


class GenerateQuizSerializer(serializers.Serializer):
    pairing_id = serializers.UUIDField()
    topic = serializers.CharField(max_length=255)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    num_questions = serializers.IntegerField(min_value=5, max_value=30, default=10)
    difficulty = serializers.ChoiceField(
        choices=["easy", "medium", "hard"],
        default="medium",
    )
    question_types = serializers.ListField(
        child=serializers.ChoiceField(choices=["mcq", "true_false"]),
        default=["mcq", "true_false"],
    )
    lesson_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_pairing_id(self, value):
        from pairings.models import TeacherStudentPairing
        try:
            pairing = TeacherStudentPairing.objects.get(id=value)
        except TeacherStudentPairing.DoesNotExist:
            raise serializers.ValidationError("Pairing not found.")
        request = self.context.get("request")
        if request and request.user.role == "teacher" and pairing.teacher != request.user:
            raise serializers.ValidationError("You can only generate quizzes for your own pairings.")
        return value


# ---------------------------------------------------------------------------
# Attempt / Answer
# ---------------------------------------------------------------------------

class QuizAnswerSerializer(serializers.ModelSerializer):
    question = QuizQuestionResultSerializer(read_only=True)
    selected_option = QuizOptionSerializer(read_only=True)

    class Meta:
        model = QuizAnswer
        fields = ["id", "question", "selected_option", "is_correct", "points_earned"]


class QuizAttemptSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ["id", "quiz", "status", "score", "total_points", "submitted_at", "answers"]


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    selected_option_id = serializers.UUIDField()


class SubmitAttemptSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)
