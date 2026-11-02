from rest_framework import generics

from subjects.models import Subject
from subjects.serializers import SubjectSerializer
from users.models import UserRole
from users.permissions import IsAdminOrReadOnly


class SubjectListCreateView(generics.ListCreateAPIView):
    """All users: list active subjects. Admins also see retired ones and can add subjects."""
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = SubjectSerializer
    pagination_class = None  # a short, curated list

    def get_queryset(self):
        if self.request.user.role == UserRole.ADMIN:
            return Subject.objects.all()
        return Subject.objects.filter(is_active=True)


class SubjectDetailView(generics.RetrieveUpdateAPIView):
    """Admin: rename or retire (is_active=false) a subject. Subjects are never deleted."""
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()
