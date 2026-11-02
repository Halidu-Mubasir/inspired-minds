from django.urls import reverse
from rest_framework import serializers
from resources.models import Resource, ResourceVisibility
from subjects.serializers import SubjectNameField

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
    "jpg", "jpeg", "png", "gif", "txt",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class UploadedBySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class ResourceListSerializer(serializers.ModelSerializer):
    uploaded_by = UploadedBySerializer(read_only=True)
    subject = SubjectNameField(read_only=True)

    class Meta:
        model = Resource
        fields = [
            "id", "title", "resource_type", "subject", "visibility",
            "file_name", "file_size", "mime_type", "uploaded_by",
            "pairing_id", "lesson_id", "created_at",
        ]


class ResourceDetailSerializer(serializers.ModelSerializer):
    uploaded_by = UploadedBySerializer(read_only=True)
    subject = SubjectNameField(required=False, allow_null=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id", "title", "description", "resource_type", "subject",
            "visibility", "file_name", "file_size", "mime_type",
            "file_url", "uploaded_by", "pairing_id", "lesson_id",
            "created_at", "updated_at",
        ]
        # Only descriptive metadata is editable after upload; who can see the file is fixed.
        read_only_fields = ["visibility", "file_name", "file_size", "mime_type"]

    def get_file_url(self, obj):
        """The access-checked download endpoint (requires an Authorization header)."""
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(reverse("resource-download", args=[obj.pk]))
        return None


class UploadResourceSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    subject = SubjectNameField(required=False, allow_null=True)
    pairing_id = serializers.UUIDField(required=False, allow_null=True)
    lesson_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Resource
        fields = [
            "title", "description", "resource_type", "subject",
            "visibility", "file", "pairing_id", "lesson_id",
        ]

    def validate_file(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '.{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File size must be under 50 MB.")
        return value

    def validate(self, attrs):
        """Resolve pairing/lesson to ones the uploader is allowed to attach files to."""
        from pairings.models import TeacherStudentPairing
        from lessons.models import Lesson

        user = self.context["request"].user
        pairing_id = attrs.pop("pairing_id", None)
        lesson_id = attrs.pop("lesson_id", None)

        pairing = None
        if pairing_id:
            try:
                pairing = TeacherStudentPairing.objects.for_user(user).get(id=pairing_id)
            except TeacherStudentPairing.DoesNotExist:
                raise serializers.ValidationError({"pairing_id": "Pairing not found."})

        lesson = None
        if lesson_id:
            try:
                lesson = Lesson.objects.for_user(user).get(id=lesson_id)
            except Lesson.DoesNotExist:
                raise serializers.ValidationError({"lesson_id": "Lesson not found."})
            if pairing and lesson.pairing_id != pairing.id:
                raise serializers.ValidationError({"lesson_id": "Lesson does not belong to this pairing."})

        if attrs.get("visibility", ResourceVisibility.PRIVATE) == ResourceVisibility.PRIVATE and not pairing:
            raise serializers.ValidationError({"pairing_id": "A pairing is required for private resources."})

        attrs["pairing"] = pairing
        attrs["lesson"] = lesson
        return attrs

    def create(self, validated_data):
        file = validated_data["file"]
        return Resource.objects.create(
            **validated_data,
            file_name=file.name,
            file_size=file.size,
            mime_type=getattr(file, "content_type", "application/octet-stream"),
        )


class LibraryUploadSerializer(UploadResourceSerializer):
    def validate(self, attrs):
        attrs["visibility"] = ResourceVisibility.LIBRARY
        attrs.pop("pairing_id", None)
        return super().validate(attrs)
