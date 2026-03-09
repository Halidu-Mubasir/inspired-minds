from rest_framework import serializers
from pairings.models import TeacherStudentPairing, PairingStatus
from users.models import CustomUser


class UserSummarySerializer(serializers.ModelSerializer):
    """Minimal user info for embedding in pairing responses."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "first_name", "last_name", "full_name", "email", "avatar"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class PairingListSerializer(serializers.ModelSerializer):
    teacher = UserSummarySerializer(read_only=True)
    student = UserSummarySerializer(read_only=True)

    class Meta:
        model = TeacherStudentPairing
        fields = [
            "id", "teacher", "student", "subject", "status",
            "start_date", "end_date", "created_at",
        ]


class PairingDetailSerializer(serializers.ModelSerializer):
    teacher = UserSummarySerializer(read_only=True)
    student = UserSummarySerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = TeacherStudentPairing
        fields = [
            "id", "teacher", "student", "subject", "status",
            "start_date", "end_date", "notes", "created_by",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PairingCreateSerializer(serializers.ModelSerializer):
    teacher_id = serializers.UUIDField(write_only=True)
    student_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = TeacherStudentPairing
        fields = ["teacher_id", "student_id", "subject", "start_date", "notes"]

    def validate_teacher_id(self, value):
        try:
            user = CustomUser.objects.get(id=value, role="teacher")
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("No teacher found with this ID.")
        return user

    def validate_student_id(self, value):
        try:
            user = CustomUser.objects.get(id=value, role="student")
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("No student found with this ID.")
        return user

    def validate(self, data):
        teacher = data.get("teacher_id")
        student = data.get("student_id")
        subject = data.get("subject")
        if teacher and student and subject:
            exists = TeacherStudentPairing.objects.filter(
                teacher=teacher, student=student, subject=subject
            ).exclude(status=PairingStatus.ENDED).exists()
            if exists:
                raise serializers.ValidationError(
                    "An active pairing already exists for this teacher, student, and subject."
                )
        return data

    def create(self, validated_data):
        teacher = validated_data.pop("teacher_id")
        student = validated_data.pop("student_id")
        request = self.context.get("request")
        return TeacherStudentPairing.objects.create(
            teacher=teacher,
            student=student,
            created_by=request.user if request else None,
            **validated_data,
        )


class PairingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherStudentPairing
        fields = ["status", "end_date", "notes"]
