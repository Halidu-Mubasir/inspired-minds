import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework_simplejwt.tokens import RefreshToken
from setup.base_model import BaseModel
from users.managers import CustomUserManager


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    TEACHER = "teacher", "Teacher"
    STUDENT = "student", "Student"


class CustomUser(AbstractUser, BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=120, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField("Email Address", unique=True)
    avatar = models.ImageField(
        blank=True, null=True, upload_to="avatars/", default=None
    )
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(
        max_length=20, choices=UserRole.choices, default=UserRole.STUDENT
    )
    address = models.TextField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {
            "refresh_token": str(refresh),
            "access_token": str(refresh.access_token),
        }
