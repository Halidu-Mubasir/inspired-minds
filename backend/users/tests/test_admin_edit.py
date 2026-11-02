from django.test import TestCase

from pairings.models import PairingStatus
from setup.testing import client_for, make_pairing, make_subject, make_user
from users.models import StudentProfile, TeacherProfile


class AdminEditTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        TeacherProfile.objects.create(user=cls.teacher, years_of_experience=2)
        cls.student = make_user("student", "student")
        StudentProfile.objects.create(user=cls.student)

    def patch(self, url, data):
        return client_for(self.admin).patch(url, data, format="json")

    def teacher_url(self):
        return f"/api/v1/auth/teachers/{self.teacher.id}/"

    def test_edit_account_and_profile_together(self):
        make_subject("Physics")
        res = self.patch(self.teacher_url(), {
            "first_name": "Kwame",
            "teacher_profile": {"years_of_experience": 9, "subjects": ["Physics"]},
        })
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["first_name"], "Kwame")
        self.assertEqual(res.data["teacher_profile"]["years_of_experience"], 9)
        self.assertEqual(res.data["teacher_profile"]["subjects"], ["Physics"])

    def test_partial_profile_edit_keeps_other_fields(self):
        res = self.patch(f"/api/v1/auth/students/{self.student.id}/", {"student_profile": {"school_name": "Achimota"}})
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["student_profile"]["school_name"], "Achimota")
        self.assertEqual(res.data["role"], "student")

    def test_role_cannot_be_changed(self):
        self.patch(self.teacher_url(), {"role": "admin"})
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.role, "teacher")

    def test_duplicate_email_is_rejected(self):
        res = self.patch(self.teacher_url(), {"email": self.student.email})
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.data)

    def test_deactivate_via_patch_pauses_pairings_and_reactivate_restores_login(self):
        pairing = make_pairing(self.teacher, self.student)
        self.assertEqual(self.patch(self.teacher_url(), {"is_active": False}).status_code, 200)
        pairing.refresh_from_db()
        self.assertEqual(pairing.status, PairingStatus.PAUSED)

        res = self.patch(self.teacher_url(), {"is_active": True})
        self.assertTrue(res.data["is_active"])
        login = client_for(self.teacher).post(
            "/api/v1/auth/login/", {"email": self.teacher.email, "password": "test-pass-123"}
        )
        self.assertEqual(login.status_code, 200)
        pairing.refresh_from_db()
        self.assertEqual(pairing.status, PairingStatus.PAUSED)  # resuming stays an admin decision


class AdminPasswordRulesTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")

    def create(self, password, email="kofi@example.com"):
        return client_for(self.admin).post("/api/v1/auth/teachers/", {
            "email": email, "first_name": "Kofi", "last_name": "Owusu", "password": password,
        }, format="json")

    def test_common_numeric_and_similar_passwords_are_rejected(self):
        for password in ["password123", "12345678", "owusu123"]:  # last: too close to the last name
            with self.subTest(password):
                res = self.create(password)
                self.assertEqual(res.status_code, 400)
                self.assertIn("password", res.data)

    def test_strong_password_is_accepted(self):
        self.assertEqual(self.create("Lagoon-Mango-Sunrise-7").status_code, 201)
