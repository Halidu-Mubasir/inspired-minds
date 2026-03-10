from django.db import models
from setup.base_model import BaseModel


class LessonStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SCHEDULED = "scheduled", "Scheduled"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Lesson(BaseModel):
    pairing = models.ForeignKey(
        "pairings.TeacherStudentPairing",
        on_delete=models.CASCADE,
        related_name="lessons",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(
        max_length=20,
        choices=LessonStatus.choices,
        default=LessonStatus.DRAFT,
    )
    teacher_notes = models.TextField(blank=True, null=True)
    student_notes = models.TextField(blank=True, null=True)
    homework = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-scheduled_date", "-scheduled_time"]

    def __str__(self):
        return f"{self.title} — {self.pairing}"


class LessonTopic(BaseModel):
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.title}"
