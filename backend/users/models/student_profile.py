from django.db import models
from setup.base_model import BaseModel


class EducationLevel(models.TextChoices):
    PRIMARY = "primary", "Primary School"
    JHS = "jhs", "Junior High School"
    SHS = "shs", "Senior High School"
    UNIVERSITY = "university", "University"
    OTHER = "other", "Other"


class StudentProfile(BaseModel):
    user = models.OneToOneField(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    education_level = models.CharField(
        max_length=20, choices=EducationLevel.choices, null=True, blank=True
    )
    school_name = models.CharField(max_length=255, null=True, blank=True)
    grade_or_year = models.CharField(max_length=50, null=True, blank=True)
    subjects_of_interest = models.JSONField(default=list, blank=True)
    parent_guardian_name = models.CharField(max_length=255, null=True, blank=True)
    parent_guardian_phone = models.CharField(max_length=20, null=True, blank=True)
    parent_guardian_email = models.EmailField(null=True, blank=True)

    class Meta:
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"

    def __str__(self):
        return f"Student: {self.user.get_full_name()}"
