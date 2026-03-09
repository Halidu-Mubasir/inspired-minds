from .auth import LoginView, LogoutView, ChangePasswordView
from .user import (
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

__all__ = [
    "LoginView",
    "LogoutView",
    "ChangePasswordView",
    "MeView",
    "ChangeAvatarView",
    "TeacherListCreateView",
    "TeacherDetailView",
    "StudentListCreateView",
    "StudentDetailView",
    "DashboardStatsView",
    "UpdateTeacherProfileView",
    "UpdateStudentProfileView",
]
