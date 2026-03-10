from rest_framework import serializers
from resources.models import Resource

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

    class Meta:
        model = Resource
        fields = [
            "id", "title", "resource_type", "subject", "visibility",
            "file_name", "file_size", "mime_type", "uploaded_by",
            "pairing_id", "lesson_id", "created_at",
        ]


class ResourceDetailSerializer(serializers.ModelSerializer):
    uploaded_by = UploadedBySerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id", "title", "description", "resource_type", "subject",
            "visibility", "file_name", "file_size", "mime_type",
            "file_url", "uploaded_by", "pairing_id", "lesson_id",
            "created_at", "updated_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class UploadResourceSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
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
        visibility = attrs.get("visibility", "private")
        pairing_id = attrs.get("pairing_id")
        if visibility == "private" and not pairing_id:
            raise serializers.ValidationError({"pairing_id": "A pairing is required for private resources."})
        return attrs

    def create(self, validated_data):
        file = validated_data["file"]
        pairing_id = validated_data.pop("pairing_id", None)
        lesson_id = validated_data.pop("lesson_id", None)

        # Resolve FKs
        pairing = None
        lesson = None
        if pairing_id:
            from pairings.models import TeacherStudentPairing
            try:
                pairing = TeacherStudentPairing.objects.get(id=pairing_id)
            except TeacherStudentPairing.DoesNotExist:
                raise serializers.ValidationError({"pairing_id": "Pairing not found."})
        if lesson_id:
            from lessons.models import Lesson
            try:
                lesson = Lesson.objects.get(id=lesson_id)
            except Lesson.DoesNotExist:
                raise serializers.ValidationError({"lesson_id": "Lesson not found."})

        return Resource.objects.create(
            **validated_data,
            file_name=file.name,
            file_size=file.size,
            mime_type=getattr(file, "content_type", "application/octet-stream"),
            pairing=pairing,
            lesson=lesson,
        )


class LibraryUploadSerializer(UploadResourceSerializer):
    def validate(self, attrs):
        attrs["visibility"] = "library"
        attrs.pop("pairing_id", None)
        return attrs
