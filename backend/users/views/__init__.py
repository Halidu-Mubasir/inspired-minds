from .auth import (
    LoginView,
    LogoutView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)
from .user import (
    MeView,
    ChangeAvatarView,
    TeacherListCreateView,
    TeacherDetailView,
    StudentListCreateView,
    StudentDetailView,
    DashboardStatsView,
    MySummaryView,
    UpdateTeacherProfileView,
    UpdateStudentProfileView,
)

__all__ = [
    "LoginView",
    "LogoutView",
    "ChangePasswordView",
    "PasswordResetRequestView",
    "PasswordResetConfirmView",
    "MeView",
    "ChangeAvatarView",
    "TeacherListCreateView",
    "TeacherDetailView",
    "StudentListCreateView",
    "StudentDetailView",
    "DashboardStatsView",
    "MySummaryView",
    "UpdateTeacherProfileView",
    "UpdateStudentProfileView",
]
