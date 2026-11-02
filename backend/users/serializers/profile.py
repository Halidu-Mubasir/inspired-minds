from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin edits an account and its role profile in one request.

    is_active=false runs the full deactivation (sessions ended, pairings paused);
    is_active=true reactivates the account but leaves pairings for the admin to resume.
    """
    profile_field: str
    profile_model: type
    m2m_fields: set[str] = set()

    class Meta:
        model = CustomUser
        fields = ["email", "first_name", "last_name", "phone_number", "address", "is_active"]

    @transaction.atomic
    def update(self, instance, validated_data):
        from users.services import deactivate_user

        profile_data = validated_data.pop(self.profile_field, None)
        is_active = validated_data.pop("is_active", None)
        instance = super().update(instance, validated_data)

        if profile_data is not None:
            profile, _ = self.profile_model.objects.get_or_create(user=instance)
            relations = {name: profile_data.pop(name) for name in list(profile_data) if name in self.m2m_fields}
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            for attr, value in relations.items():
                getattr(profile, attr).set(value)

        if is_active is False and instance.is_active:
            deactivate_user(instance)
        elif is_active is True and not instance.is_active:
            instance.is_active = True
            instance.save(update_fields=["is_active", "updated_at"])
        return instance


class UpdateTeacherSerializer(AdminUserUpdateSerializer):
    teacher_profile = TeacherProfileSerializer(required=False)
    profile_field = "teacher_profile"
    profile_model = TeacherProfile
    m2m_fields = {"subjects"}

    class Meta(AdminUserUpdateSerializer.Meta):
        fields = AdminUserUpdateSerializer.Meta.fields + ["teacher_profile"]


class UpdateStudentSerializer(AdminUserUpdateSerializer):
    student_profile = StudentProfileSerializer(required=False)
    profile_field = "student_profile"
    profile_model = StudentProfile
    m2m_fields = {"subjects_of_interest"}

    class Meta(AdminUserUpdateSerializer.Meta):
        fields = AdminUserUpdateSerializer.Meta.fields + ["student_profile"]


class PasswordRulesMixin:
    """Runs Django's AUTH_PASSWORD_VALIDATORS on admin-set passwords, including
    the check that the password isn't too similar to the user's name or email."""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        candidate = CustomUser(
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], candidate)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs


def _create_user(role, validated_data):
    password = validated_data.pop("password")
    user = CustomUser(role=role, **validated_data)
    user.set_password(password)
    user.save()
    return user


class CreateTeacherSerializer(PasswordRulesMixin, serializers.ModelSerializer):
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


class CreateStudentSerializer(PasswordRulesMixin, serializers.ModelSerializer):
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
