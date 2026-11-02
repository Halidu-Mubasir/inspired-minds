from unittest import mock

from django.test import TestCase

from setup.testing import client_for, make_user
from users.models import CustomUser, StudentProfile, TeacherProfile


class UserCreationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")

    def create_student(self, **fields):
        data = {"email": "new@example.com", "first_name": "N", "last_name": "S", "password": "long-enough-pass", **fields}
        return client_for(self.admin).post("/api/v1/auth/students/", data, format="json")

    def test_user_is_not_created_when_profile_creation_fails(self):
        with mock.patch.object(TeacherProfile.objects, "create", side_effect=RuntimeError("db down")):
            with self.assertRaises(RuntimeError):
                client_for(self.admin).post("/api/v1/auth/teachers/", {
                    "email": "new@example.com", "first_name": "N", "last_name": "T", "password": "long-enough-pass",
                }, format="json")
        self.assertFalse(CustomUser.objects.filter(email="new@example.com").exists())

    def test_invalid_education_level_is_rejected(self):
        res = self.create_student(education_level="kindergarten-ish")
        self.assertEqual(res.status_code, 400)
        self.assertIn("education_level", res.data)

    def test_blank_optional_fields_are_stored_as_null(self):
        res = self.create_student(education_level="", parent_guardian_email="")
        self.assertEqual(res.status_code, 201, res.data)
        profile = StudentProfile.objects.get(user__email="new@example.com")
        self.assertIsNone(profile.education_level)
        self.assertIsNone(profile.parent_guardian_email)
