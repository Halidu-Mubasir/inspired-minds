from django.db import models
from setup.base_model import BaseModel


class PairingStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PAUSED = "paused", "Paused"
    ENDED = "ended", "Ended"


class TeacherStudentPairing(BaseModel):
    teacher = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="teacher_pairings",
        limit_choices_to={"role": "teacher"},
    )
    student = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="student_pairings",
        limit_choices_to={"role": "student"},
    )
    subject = models.CharField(max_length=255)
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

    class Meta:
        unique_together = ["teacher", "student", "subject"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.teacher.get_full_name()} → {self.student.get_full_name()} ({self.subject})"
