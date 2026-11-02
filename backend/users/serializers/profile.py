from django.db import transaction
from rest_framework import serializers
from subjects.serializers import SubjectNameField
from users.models import CustomUser, TeacherProfile, StudentProfile, EducationLevel, UserRole


class TeacherProfileSerializer(serializers.ModelSerializer):
    subjects = SubjectNameField(many=True, required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            "id", "subjects", "qualifications", "bio",
            "years_of_experience", "hourly_rate", "is_available",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentProfileSerializer(serializers.ModelSerializer):
    subjects_of_interest = SubjectNameField(many=True, required=False)

    class Meta:
        model = StudentProfile
        fields = [
            "id", "education_level", "school_name", "grade_or_year",
            "subjects_of_interest", "parent_guardian_name",
            "parent_guardian_phone", "parent_guardian_email",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherProfileSerializer(read_only=True)
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "first_name", "last_name", "phone_number",
            "avatar", "role", "address", "is_active",
            "teacher_profile", "student_profile",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "email", "role", "is_active", "created_at", "updated_at"]


def _create_user(role, validated_data):
    password = validated_data.pop("password")
    user = CustomUser(role=role, **validated_data)
    user.set_password(password)
    user.save()
    return user


class CreateTeacherSerializer(serializers.ModelSerializer):
    """Admin creates a teacher with profile fields."""
    password = serializers.CharField(write_only=True, min_length=8)
    subjects = SubjectNameField(many=True, required=False)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, default=0, min_value=0)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "email", "first_name", "last_name", "phone_number", "address", "password",
            "subjects", "qualifications", "bio", "years_of_experience", "hourly_rate",
        ]

    @transaction.atomic
    def create(self, validated_data):
        subjects = validated_data.pop("subjects", [])
        profile_fields = {
            "qualifications": validated_data.pop("qualifications", ""),
            "bio": validated_data.pop("bio", ""),
            "years_of_experience": validated_data.pop("years_of_experience", 0),
            "hourly_rate": validated_data.pop("hourly_rate", None),
        }
        user = _create_user(UserRole.TEACHER, validated_data)
        profile = TeacherProfile.objects.create(user=user, **profile_fields)
        profile.subjects.set(subjects)
        return user


class CreateStudentSerializer(serializers.ModelSerializer):
    """Admin creates a student with profile fields."""
    password = serializers.CharField(write_only=True, min_length=8)
    education_level = serializers.ChoiceField(choices=EducationLevel.choices, required=False, allow_blank=True)
    school_name = serializers.CharField(required=False, allow_blank=True)
    grade_or_year = serializers.CharField(required=False, allow_blank=True)
    subjects_of_interest = SubjectNameField(many=True, required=False)
    parent_guardian_name = serializers.CharField(required=False, allow_blank=True)
    parent_guardian_phone = serializers.CharField(required=False, allow_blank=True)
    parent_guardian_email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = [
            "email", "first_name", "last_name", "phone_number", "address", "password",
            "education_level", "school_name", "grade_or_year", "subjects_of_interest",
            "parent_guardian_name", "parent_guardian_phone", "parent_guardian_email",
        ]

    @transaction.atomic
    def create(self, validated_data):
        subjects = validated_data.pop("subjects_of_interest", [])
        profile_fields = {
            # Nullable columns store "not given" as NULL rather than "".
            "education_level": validated_data.pop("education_level", "") or None,
            "school_name": validated_data.pop("school_name", ""),
            "grade_or_year": validated_data.pop("grade_or_year", ""),
            "parent_guardian_name": validated_data.pop("parent_guardian_name", ""),
            "parent_guardian_phone": validated_data.pop("parent_guardian_phone", ""),
            "parent_guardian_email": validated_data.pop("parent_guardian_email", "") or None,
        }
        user = _create_user(UserRole.STUDENT, validated_data)
        profile = StudentProfile.objects.create(user=user, **profile_fields)
        profile.subjects_of_interest.set(subjects)
        return user
