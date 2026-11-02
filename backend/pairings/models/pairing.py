from django.db import models
from setup.base_model import BaseModel
from users.models import UserRole


class PairingStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PAUSED = "paused", "Paused"
    ENDED = "ended", "Ended"


class PairingQuerySet(models.QuerySet):
    def for_user(self, user):
        """Pairings the user takes part in (admins see all)."""
        if user.role == UserRole.ADMIN:
            return self.all()
        if user.role == UserRole.TEACHER:
            return self.filter(teacher=user)
        if user.role == UserRole.STUDENT:
            return self.filter(student=user)
        return self.none()


class TeacherStudentPairing(BaseModel):
    # PROTECT: a pairing carries lessons and chat history, so users who have one are
    # deactivated rather than deleted, and pairings are ended rather than deleted.
    teacher = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        related_name="teacher_pairings",
        limit_choices_to={"role": "teacher"},
    )
    student = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        related_name="student_pairings",
        limit_choices_to={"role": "student"},
    )
    subject = models.ForeignKey("subjects.Subject", on_delete=models.PROTECT, related_name="pairings")
    status = models.CharField(
        max_length=20, choices=PairingStatus.choices, default=PairingStatus.ACTIVE
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_pairings",
    )

    objects = PairingQuerySet.as_manager()

    class Meta:
        constraints = [
            # Ended pairings are history; a teacher may be re-paired with the same student and subject.
            models.UniqueConstraint(
                fields=["teacher", "student", "subject"],
                condition=~models.Q(status=PairingStatus.ENDED),
                name="unique_open_pairing",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.teacher.get_full_name()} → {self.student.get_full_name()} ({self.subject})"
