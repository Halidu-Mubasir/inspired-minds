from datetime import timedelta

from django.db import models
from django.utils import timezone
from setup.base_model import BaseModel
from users.models import UserRole


class LessonStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SCHEDULED = "scheduled", "Scheduled"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


# Allowed status changes. Completed is final: it is what lesson history and reporting count.
LESSON_STATUS_TRANSITIONS = {
    LessonStatus.DRAFT: {LessonStatus.SCHEDULED, LessonStatus.COMPLETED, LessonStatus.CANCELLED},
    LessonStatus.SCHEDULED: {LessonStatus.DRAFT, LessonStatus.COMPLETED, LessonStatus.CANCELLED},
    LessonStatus.CANCELLED: {LessonStatus.DRAFT, LessonStatus.SCHEDULED},
    LessonStatus.COMPLETED: set(),
}


class LessonQuerySet(models.QuerySet):
    def for_user(self, user):
        """Lessons on pairings the user takes part in (admins see all).

        Drafts are the teacher's working copies: students only see a lesson once it
        is scheduled (or later completed/cancelled).
        """
        if user.role == UserRole.ADMIN:
            return self.all()
        if user.role == UserRole.TEACHER:
            return self.filter(pairing__teacher=user)
        if user.role == UserRole.STUDENT:
            return self.filter(pairing__student=user).exclude(status=LessonStatus.DRAFT)
        return self.none()

    def upcoming(self, days=7):
        """Scheduled lessons from today through the next `days` days."""
        today = timezone.localdate()
        return self.filter(
            status=LessonStatus.SCHEDULED,
            scheduled_date__gte=today,
            scheduled_date__lt=today + timedelta(days=days),
        )


class Lesson(BaseModel):
    pairing = models.ForeignKey(
        "pairings.TeacherStudentPairing",
        on_delete=models.PROTECT,  # pairings are ended, not deleted
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

    objects = LessonQuerySet.as_manager()

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
