from django.db import models
from setup.base_model import BaseModel


class TeacherProfile(BaseModel):
    user = models.OneToOneField(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    subjects = models.JSONField(default=list, blank=True)
    qualifications = models.TextField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    hourly_rate = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Teacher Profile"
        verbose_name_plural = "Teacher Profiles"

    def __str__(self):
        return f"Teacher: {self.user.get_full_name()}"
