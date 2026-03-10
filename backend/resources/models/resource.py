import os
from django.db import models
from setup.base_model import BaseModel


class ResourceType(models.TextChoices):
    NOTE = "note", "Note"
    DOCUMENT = "document", "Document"
    PAST_QUESTION = "past_question", "Past Question"
    ANSWER_SHEET = "answer_sheet", "Answer Sheet"
    WORKSHEET = "worksheet", "Worksheet"


class ResourceVisibility(models.TextChoices):
    PRIVATE = "private", "Private"
    LIBRARY = "library", "Library"


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
    file = models.FileField(upload_to="resources/%Y/%m/")
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

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)
