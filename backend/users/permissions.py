from rest_framework.permissions import SAFE_METHODS, BasePermission
from users.models import UserRole


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.TEACHER


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.STUDENT


class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (UserRole.ADMIN, UserRole.TEACHER)


class IsAdminOrTeacherOrReadOnly(BasePermission):
    """Any authenticated user may read; only admins and teachers may write.

    Which objects a user can see is decided by the view's queryset, not here.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in (UserRole.ADMIN, UserRole.TEACHER)


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        return obj == request.user or getattr(obj, "user", None) == request.user
