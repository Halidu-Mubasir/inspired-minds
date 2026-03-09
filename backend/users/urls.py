from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    LoginView,
    LogoutView,
    ChangePasswordView,
    MeView,
    ChangeAvatarView,
    TeacherListCreateView,
    TeacherDetailView,
    StudentListCreateView,
    StudentDetailView,
    DashboardStatsView,
    UpdateTeacherProfileView,
    UpdateStudentProfileView,
)

urlpatterns = [
    # Auth
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Current user
    path("me/", MeView.as_view(), name="me"),
    path("me/avatar/", ChangeAvatarView.as_view(), name="change-avatar"),
    path("me/teacher-profile/", UpdateTeacherProfileView.as_view(), name="teacher-profile"),
    path("me/student-profile/", UpdateStudentProfileView.as_view(), name="student-profile"),
    # Admin: Teachers
    path("teachers/", TeacherListCreateView.as_view(), name="teacher-list"),
    path("teachers/<uuid:pk>/", TeacherDetailView.as_view(), name="teacher-detail"),
    # Admin: Students
    path("students/", StudentListCreateView.as_view(), name="student-list"),
    path("students/<uuid:pk>/", StudentDetailView.as_view(), name="student-detail"),
    # Admin: Stats
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
