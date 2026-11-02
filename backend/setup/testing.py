"""Shared fixtures for API tests."""
from datetime import date

from rest_framework.test import APIClient

from pairings.models import TeacherStudentPairing
from users.models import CustomUser


def make_user(role, name):
    return CustomUser.objects.create_user(
        email=f"{name}@example.com",
        first_name=name.title(),
        last_name="Test",
        password="test-pass-123",
        role=role,
    )


def make_pairing(teacher, student, subject="Mathematics"):
    return TeacherStudentPairing.objects.create(
        teacher=teacher, student=student, subject=subject, start_date=date.today()
    )


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client
