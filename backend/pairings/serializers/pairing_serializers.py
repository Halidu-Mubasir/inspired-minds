from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers
from pairings.models import TeacherStudentPairing, PairingStatus
from subjects.serializers import SubjectNameField
from users.models import CustomUser, UserRole

DUPLICATE_PAIRING = "An active pairing already exists for this teacher, student, and subject."


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
    subject = SubjectNameField(read_only=True)

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
    subject = SubjectNameField(read_only=True)

    class Meta:
        model = TeacherStudentPairing
        fields = [
            "id", "teacher", "student", "subject", "status",
            "start_date", "end_date", "notes", "created_by",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


def _open_duplicate_exists(teacher, student, subject, exclude_pk=None):
    duplicates = TeacherStudentPairing.objects.filter(
        teacher=teacher, student=student, subject=subject
    ).exclude(status=PairingStatus.ENDED)
    if exclude_pk:
        duplicates = duplicates.exclude(pk=exclude_pk)
    return duplicates.exists()


class PairingCreateSerializer(serializers.ModelSerializer):
    teacher_id = serializers.UUIDField(write_only=True)
    student_id = serializers.UUIDField(write_only=True)
    subject = SubjectNameField()

    class Meta:
        model = TeacherStudentPairing
        fields = ["teacher_id", "student_id", "subject", "start_date", "notes"]

    def _active_user(self, user_id, role):
        try:
            return CustomUser.objects.get(id=user_id, role=role, is_active=True)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(f"No active {role} found with this ID.")

    def validate_teacher_id(self, value):
        return self._active_user(value, UserRole.TEACHER)

    def validate_student_id(self, value):
        return self._active_user(value, UserRole.STUDENT)

    def validate(self, data):
        if _open_duplicate_exists(data["teacher_id"], data["student_id"], data["subject"]):
            raise serializers.ValidationError(DUPLICATE_PAIRING)
        return data

    def create(self, validated_data):
        teacher = validated_data.pop("teacher_id")
        student = validated_data.pop("student_id")
        request = self.context.get("request")
        try:
            # The pairing and its conversation (created by a post_save signal) succeed or fail together.
            with transaction.atomic():
                return TeacherStudentPairing.objects.create(
                    teacher=teacher,
                    student=student,
                    created_by=request.user if request else None,
                    **validated_data,
                )
        except IntegrityError:
            # A concurrent request created the same open pairing after validate() ran.
            raise serializers.ValidationError(DUPLICATE_PAIRING)


class PairingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherStudentPairing
        fields = ["status", "end_date", "notes"]

    def validate_status(self, value):
        pairing = self.instance
        reopening = pairing and pairing.status == PairingStatus.ENDED and value != PairingStatus.ENDED
        if reopening and _open_duplicate_exists(
            pairing.teacher, pairing.student, pairing.subject, exclude_pk=pairing.pk
        ):
            raise serializers.ValidationError(DUPLICATE_PAIRING)
        return value

    def validate(self, data):
        """Keep end_date consistent with status: set when ending, cleared when reopening."""
        status = data.get("status", self.instance.status if self.instance else None)
        if status == PairingStatus.ENDED:
            data.setdefault("end_date", (self.instance and self.instance.end_date) or timezone.now().date())
        elif "status" in data:
            data["end_date"] = None
        elif data.get("end_date"):
            raise serializers.ValidationError({"end_date": "Only an ended pairing can have an end date."})
        return data
