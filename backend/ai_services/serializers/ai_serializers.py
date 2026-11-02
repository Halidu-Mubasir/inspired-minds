from rest_framework import serializers

from ai_services.attachments import SUPPORTED_EXTENSIONS, is_supported
from ai_services.models import AIGeneration, SafeguardingFlag, TutorConversation, TutorMessage
from resources.models import Resource
from subjects.serializers import SubjectNameField
from users.models import UserRole

MAX_MESSAGE_CHARS = 4000
MAX_PASTED_TEXT_CHARS = 30_000


class PersonSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class AttachedResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ["id", "title", "file_name"]


def _resource_for(user, resource_id):
    """A resource the user may read whose file format the AI supports."""
    try:
        resource = Resource.objects.visible_to(user).get(id=resource_id)
    except Resource.DoesNotExist:
        raise serializers.ValidationError("File not found.")
    if not is_supported(resource):
        raise serializers.ValidationError(
            f"The AI can read these file types: {', '.join('.' + e for e in SUPPORTED_EXTENSIONS)}."
        )
    return resource


class TutorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorMessage
        fields = ["id", "role", "content", "refused", "created_at"]


class SafeguardingFlagSerializer(serializers.ModelSerializer):
    reviewed_by = PersonSerializer(read_only=True)

    class Meta:
        model = SafeguardingFlag
        fields = ["id", "reason", "severity", "message_id", "created_at", "reviewed_at", "reviewed_by"]


class TutorConversationSerializer(serializers.ModelSerializer):
    student = PersonSerializer(read_only=True)
    subject = SubjectNameField(read_only=True)
    resource = AttachedResourceSerializer(read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    open_flags = serializers.IntegerField(read_only=True)

    class Meta:
        model = TutorConversation
        fields = [
            "id", "title", "student", "subject", "resource",
            "message_count", "open_flags", "last_message_at", "created_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.user.role == UserRole.STUDENT:
            data.pop("open_flags", None)  # flags are for staff only
        return data


class TutorConversationDetailSerializer(TutorConversationSerializer):
    messages = TutorMessageSerializer(many=True, read_only=True)
    flags = SafeguardingFlagSerializer(many=True, read_only=True)

    class Meta(TutorConversationSerializer.Meta):
        fields = TutorConversationSerializer.Meta.fields + ["messages", "flags"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.user.role == UserRole.STUDENT:
            data.pop("flags", None)
        return data


class TutorConversationCreateSerializer(serializers.Serializer):
    subject = SubjectNameField(required=False, allow_null=True)
    resource_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_resource_id(self, value):
        return _resource_for(self.context["request"].user, value) if value else None


class TutorMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=MAX_MESSAGE_CHARS, trim_whitespace=True)


class QuestionRequestSerializer(serializers.Serializer):
    subject = SubjectNameField()
    topic = serializers.CharField(max_length=200)
    level = serializers.CharField(max_length=60, help_text='e.g. "JHS 2" or "SHS 3 (WASSCE)"')
    count = serializers.IntegerField(min_value=1, max_value=20, default=10)
    question_type = serializers.ChoiceField(
        choices=["mixed", "multiple_choice", "short_answer", "structured"], default="mixed"
    )
    difficulty = serializers.ChoiceField(choices=["mixed", "easy", "medium", "hard"], default="mixed")
    instructions = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    lesson_id = serializers.UUIDField(required=False, allow_null=True)
    resource_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_resource_id(self, value):
        return _resource_for(self.context["request"].user, value) if value else None


class SummaryRequestSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=["revision_sheet", "teacher_summary"], default="revision_sheet")
    length = serializers.ChoiceField(choices=["short", "medium", "detailed"], default="medium")
    lesson_id = serializers.UUIDField(required=False, allow_null=True)
    resource_id = serializers.UUIDField(required=False, allow_null=True)
    text = serializers.CharField(max_length=MAX_PASTED_TEXT_CHARS, required=False, allow_blank=True)

    def validate_resource_id(self, value):
        return _resource_for(self.context["request"].user, value) if value else None

    def validate(self, attrs):
        if not (attrs.get("lesson_id") or attrs.get("resource_id") or attrs.get("text", "").strip()):
            raise serializers.ValidationError("Choose a lesson or a file, or paste some notes to summarise.")
        return attrs


class AIGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIGeneration
        fields = ["id", "kind", "title", "params", "output", "lesson_id", "resource_id", "created_at"]
