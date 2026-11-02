import django_filters
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from users.models import CustomUser, TeacherProfile, StudentProfile, EducationLevel, UserRole
from users.serializers import (
    UserSerializer,
    CreateTeacherSerializer, CreateStudentSerializer,
    TeacherProfileSerializer, StudentProfileSerializer,
)
from users.permissions import IsAdmin
from users.services import deactivate_user


class MeView(RetrieveUpdateAPIView):
    """Get/update the currently authenticated user's profile."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class ChangeAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        user.avatar = avatar
        user.save()
        return Response({"avatar": request.build_absolute_uri(user.avatar.url)})


USER_SEARCH_FIELDS = ["first_name", "last_name", "email"]


class TeacherFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    is_available = django_filters.BooleanFilter(field_name="teacher_profile__is_available")

    class Meta:
        model = CustomUser
        fields = ["is_active", "is_available"]


class StudentFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    education_level = django_filters.ChoiceFilter(
        field_name="student_profile__education_level", choices=EducationLevel.choices
    )

    class Meta:
        model = CustomUser
        fields = ["is_active", "education_level"]


# --- Admin: Teacher Management ---

class TeacherListCreateView(ListCreateAPIView):
    permission_classes = [IsAdmin]
    filterset_class = TeacherFilter
    search_fields = USER_SEARCH_FIELDS

    def get_queryset(self):
        return (
            CustomUser.objects.filter(role=UserRole.TEACHER)
            .select_related("teacher_profile")
            .prefetch_related("teacher_profile__subjects")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateTeacherSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class TeacherDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = CustomUser.objects.filter(role="teacher").select_related("teacher_profile")

    def destroy(self, request, *args, **kwargs):
        paused = deactivate_user(self.get_object())
        return Response({"message": "Teacher deactivated.", "pairings_paused": paused}, status=status.HTTP_200_OK)


# --- Admin: Student Management ---

class StudentListCreateView(ListCreateAPIView):
    permission_classes = [IsAdmin]
    filterset_class = StudentFilter
    search_fields = USER_SEARCH_FIELDS

    def get_queryset(self):
        return (
            CustomUser.objects.filter(role=UserRole.STUDENT)
            .select_related("student_profile")
            .prefetch_related("student_profile__subjects_of_interest")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateStudentSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class StudentDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = CustomUser.objects.filter(role="student").select_related("student_profile")

    def destroy(self, request, *args, **kwargs):
        paused = deactivate_user(self.get_object())
        return Response({"message": "Student deactivated.", "pairings_paused": paused}, status=status.HTTP_200_OK)


# --- Admin: Dashboard Stats ---

class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from pairings.models import TeacherStudentPairing, PairingStatus
        teachers = CustomUser.objects.filter(role=UserRole.TEACHER)
        students = CustomUser.objects.filter(role=UserRole.STUDENT)
        stats = {
            # total_* count active accounts only (kept for existing clients).
            "total_teachers": teachers.filter(is_active=True).count(),
            "inactive_teachers": teachers.filter(is_active=False).count(),
            "total_students": students.filter(is_active=True).count(),
            "inactive_students": students.filter(is_active=False).count(),
            "active_pairings": TeacherStudentPairing.objects.filter(status=PairingStatus.ACTIVE).count(),
        }
        return Response(stats)


# --- Profile Update Views ---

class UpdateTeacherProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TeacherProfileSerializer

    def get_object(self):
        return TeacherProfile.objects.get(user=self.request.user)


class UpdateStudentProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentProfileSerializer

    def get_object(self):
        return StudentProfile.objects.get(user=self.request.user)
