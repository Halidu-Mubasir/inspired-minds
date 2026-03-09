from rest_framework import serializers
from users.models import CustomUser, TeacherProfile, StudentProfile


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = [
            "id", "subjects", "qualifications", "bio",
            "years_of_experience", "hourly_rate", "is_available",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentProfileSerializer(serializers.ModelSerializer):
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


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing users."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "first_name", "last_name", "phone_number", "avatar", "role", "is_active"]


class CreateTeacherSerializer(serializers.ModelSerializer):
    """Admin creates a teacher with profile fields."""
    password = serializers.CharField(write_only=True, min_length=8)
    subjects = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, default=0)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "email", "first_name", "last_name", "phone_number", "address", "password",
            "subjects", "qualifications", "bio", "years_of_experience", "hourly_rate",
        ]

    def create(self, validated_data):
        profile_fields = {
            "subjects": validated_data.pop("subjects", []),
            "qualifications": validated_data.pop("qualifications", ""),
            "bio": validated_data.pop("bio", ""),
            "years_of_experience": validated_data.pop("years_of_experience", 0),
            "hourly_rate": validated_data.pop("hourly_rate", None),
        }
        password = validated_data.pop("password")
        user = CustomUser(role="teacher", **validated_data)
        user.set_password(password)
        user.save()
        TeacherProfile.objects.create(user=user, **profile_fields)
        return user


class CreateStudentSerializer(serializers.ModelSerializer):
    """Admin creates a student with profile fields."""
    password = serializers.CharField(write_only=True, min_length=8)
    education_level = serializers.CharField(required=False, allow_blank=True)
    school_name = serializers.CharField(required=False, allow_blank=True)
    grade_or_year = serializers.CharField(required=False, allow_blank=True)
    subjects_of_interest = serializers.ListField(child=serializers.CharField(), required=False, default=list)
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

    def create(self, validated_data):
        profile_fields = {
            "education_level": validated_data.pop("education_level", None),
            "school_name": validated_data.pop("school_name", ""),
            "grade_or_year": validated_data.pop("grade_or_year", ""),
            "subjects_of_interest": validated_data.pop("subjects_of_interest", []),
            "parent_guardian_name": validated_data.pop("parent_guardian_name", ""),
            "parent_guardian_phone": validated_data.pop("parent_guardian_phone", ""),
            "parent_guardian_email": validated_data.pop("parent_guardian_email", None),
        }
        password = validated_data.pop("password")
        user = CustomUser(role="student", **validated_data)
        user.set_password(password)
        user.save()
        StudentProfile.objects.create(user=user, **profile_fields)
        return user
