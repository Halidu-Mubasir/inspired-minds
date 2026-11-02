from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.db.models import Q
from setup.base_model import BaseModel
from users.models import UserRole


def private_storage():
    """Resource files live outside MEDIA_ROOT so they are only reachable through
    the access-checked download endpoint, never as a public /media/ URL."""
    return FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT, base_url=None)


class ResourceType(models.TextChoices):
    NOTE = "note", "Note"
    DOCUMENT = "document", "Document"
    PAST_QUESTION = "past_question", "Past Question"
    ANSWER_SHEET = "answer_sheet", "Answer Sheet"
    WORKSHEET = "worksheet", "Worksheet"


class ResourceVisibility(models.TextChoices):
    PRIVATE = "private", "Private"
    LIBRARY = "library", "Library"


class ResourceQuerySet(models.QuerySet):
    def visible_to(self, user):
        """Resources the user may view or download."""
        library = Q(visibility=ResourceVisibility.LIBRARY)
        if user.role == UserRole.ADMIN:
            return self.all()
        if user.role == UserRole.TEACHER:
            return self.filter(Q(pairing__teacher=user) | Q(uploaded_by=user) | library)
        if user.role == UserRole.STUDENT:
            return self.filter(Q(pairing__student=user, visibility=ResourceVisibility.PRIVATE) | library)
        return self.none()

    def editable_by(self, user):
        """Resources the user may edit or delete: admins any, teachers their own uploads."""
        if user.role == UserRole.ADMIN:
            return self.all()
        if user.role == UserRole.TEACHER:
            return self.filter(uploaded_by=user)
        return self.none()


class Resource(BaseModel):
    uploaded_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="resources",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=30, choices=ResourceType.choices)
    file = models.FileField(upload_to="resources/%Y/%m/", storage=private_storage)
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=127)
    subject = models.CharField(max_length=255, blank=True)
    visibility = models.CharField(
        max_length=10,
        choices=ResourceVisibility.choices,
        default=ResourceVisibility.PRIVATE,
    )
    pairing = models.ForeignKey(
        "pairings.TeacherStudentPairing",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resources",
    )
    lesson = models.ForeignKey(
        "lessons.Lesson",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resources",
    )

    objects = ResourceQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        if self.file:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)
