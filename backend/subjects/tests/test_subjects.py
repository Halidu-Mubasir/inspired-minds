from datetime import date

from django.test import TestCase

from setup.testing import client_for, make_subject, make_user
from subjects.models import Subject


class SubjectApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")
        cls.retired = Subject.objects.create(name="Latin", is_active=False)

    def test_seeded_subjects_are_listed_without_retired_ones(self):
        names = [s["name"] for s in client_for(self.teacher).get("/api/v1/subjects/").data]
        self.assertIn("Mathematics", names)
        self.assertNotIn("Latin", names)

    def test_admin_sees_retired_subjects(self):
        names = [s["name"] for s in client_for(self.admin).get("/api/v1/subjects/").data]
        self.assertIn("Latin", names)

    def test_only_admin_can_add_subjects(self):
        self.assertEqual(client_for(self.teacher).post("/api/v1/subjects/", {"name": "Music"}).status_code, 403)
        self.assertEqual(client_for(self.admin).post("/api/v1/subjects/", {"name": "  Music  "}).status_code, 201)
        self.assertTrue(Subject.objects.filter(name="Music").exists())

    def test_duplicate_names_are_rejected_regardless_of_case(self):
        res = client_for(self.admin).post("/api/v1/subjects/", {"name": "mathematics"})
        self.assertEqual(res.status_code, 400)

    def test_retired_subject_cannot_be_used_for_new_pairings(self):
        res = client_for(self.admin).post("/api/v1/pairings/", {
            "teacher_id": str(self.teacher.id), "student_id": str(self.student.id),
            "subject": "Latin", "start_date": str(date.today()),
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("subject", res.data)

    def test_teacher_profile_subjects_are_validated_names(self):
        make_subject("Physics")
        res = client_for(self.admin).post("/api/v1/auth/teachers/", {
            "email": "new@example.com", "first_name": "N", "last_name": "T", "password": "long-enough-pass",
            "subjects": ["Physics", "Mathematics"],
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(set(res.data["teacher_profile"]["subjects"]), {"Physics", "Mathematics"})

        res = client_for(self.admin).post("/api/v1/auth/teachers/", {
            "email": "other@example.com", "first_name": "N", "last_name": "T", "password": "long-enough-pass",
            "subjects": ["Underwater Basket Weaving"],
        }, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("subjects", res.data)
