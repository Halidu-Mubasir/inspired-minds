from django.db import models
from setup.base_model import BaseModel


class StudentLevel(models.TextChoices):
    NURSERY_KG = "nursery_kg", "Nursery / Kindergarten"
    PRIMARY = "primary", "Primary"
    JHS = "jhs", "Junior High (JHS)"
    SHS = "shs", "Senior High (SHS)"
    UNIVERSITY = "university", "University"
    NA = "na", "N/A"


class Qualification(models.TextChoices):
    HND = "hnd", "HND"
    BACHELOR = "bachelor", "Bachelor's Degree"
    MASTER = "master", "Master's Degree"
    PHD = "phd", "PhD"
    OTHER = "other", "Other"


class TeachingExperience(models.TextChoices):
    LESS_THAN_1 = "less-than-1", "Less than 1 year"
    ONE_TO_THREE = "1-3", "1 – 3 years"
    THREE_TO_FIVE = "3-5", "3 – 5 years"
    FIVE_PLUS = "5-plus", "5+ years"


class ContactEnquiry(BaseModel):
    """A parent or student asking for a tutor via the public website."""
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    level = models.CharField(max_length=20, choices=StudentLevel.choices)
    subjects = models.TextField()
    message = models.TextField(blank=True)
    is_handled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Contact enquiries"

    def __str__(self):
        return f"{self.name} ({self.email})"


class TutorApplication(BaseModel):
    """A prospective tutor expressing interest via the public website."""
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    subjects = models.TextField()
    qualification = models.CharField(max_length=20, choices=Qualification.choices)
    experience = models.CharField(max_length=20, choices=TeachingExperience.choices)
    message = models.TextField(blank=True)
    is_handled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"
