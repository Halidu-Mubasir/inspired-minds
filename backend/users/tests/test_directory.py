from django.test import TestCase

from setup.testing import client_for, make_subject, make_user
from users.models import StudentProfile, TeacherProfile


class AdminDirectoryTests(TestCase):
    """Server-side search, filters and pagination for the admin teacher/student lists."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.ama = make_user("teacher", "ama")
        cls.kofi = make_user("teacher", "kofi")
        cls.kofi.is_active = False
        cls.kofi.save()
        TeacherProfile.objects.create(user=cls.ama, is_available=True).subjects.set([make_subject("Physics")])
        TeacherProfile.objects.create(user=cls.kofi, is_available=False)

        cls.esi = make_user("student", "esi")
        cls.yaw = make_user("student", "yaw")
        StudentProfile.objects.create(user=cls.esi, education_level="shs")
        StudentProfile.objects.create(user=cls.yaw, education_level="jhs")

    def emails(self, url):
        res = client_for(self.admin).get(url)
        self.assertEqual(res.status_code, 200)
        return {u["email"] for u in res.data["results"]}

    def test_teacher_search_and_filters(self):
        self.assertEqual(self.emails("/api/v1/auth/teachers/?search=ama"), {"ama@example.com"})
        self.assertEqual(self.emails("/api/v1/auth/teachers/?is_available=false"), {"kofi@example.com"})
        self.assertEqual(self.emails("/api/v1/auth/teachers/?is_active=true"), {"ama@example.com"})

    def test_student_education_level_filter(self):
        self.assertEqual(self.emails("/api/v1/auth/students/?education_level=shs"), {"esi@example.com"})

    def test_list_includes_profiles_for_cards(self):
        res = client_for(self.admin).get("/api/v1/auth/teachers/?search=ama")
        self.assertEqual(res.data["results"][0]["teacher_profile"]["subjects"], ["Physics"])

    def test_lists_are_paginated(self):
        res = client_for(self.admin).get("/api/v1/auth/teachers/?page_size=1")
        self.assertEqual(res.data["count"], 2)
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIsNotNone(res.data["next"])

    def test_dashboard_stats_include_inactive_counts(self):
        res = client_for(self.admin).get("/api/v1/auth/dashboard-stats/")
        self.assertEqual(res.data["total_teachers"], 1)
        self.assertEqual(res.data["inactive_teachers"], 1)
        self.assertEqual(res.data["total_students"], 2)
        self.assertEqual(res.data["inactive_students"], 0)
