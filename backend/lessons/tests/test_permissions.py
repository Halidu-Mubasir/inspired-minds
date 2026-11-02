from datetime import date

from django.test import TestCase

from lessons.models import Lesson, LessonTopic
from setup.testing import client_for, make_pairing, make_user


class LessonAccessTests(TestCase):
    """Teacher A teaches student A; teacher B teaches student B. Neither side may touch the other's lessons."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher_a = make_user("teacher", "teacher_a")
        cls.teacher_b = make_user("teacher", "teacher_b")
        cls.student_a = make_user("student", "student_a")
        cls.student_b = make_user("student", "student_b")
        cls.pairing_a = make_pairing(cls.teacher_a, cls.student_a)
        cls.pairing_b = make_pairing(cls.teacher_b, cls.student_b)
        # Scheduled, so the student can see it (drafts are hidden from students).
        cls.lesson_a = Lesson.objects.create(
            pairing=cls.pairing_a, title="Algebra", scheduled_date=date.today(), status="scheduled"
        )
        cls.topic_a = LessonTopic.objects.create(lesson=cls.lesson_a, title="Linear equations")

    def create_lesson(self, user, pairing):
        return client_for(user).post(
            "/api/v1/lessons/",
            {"pairing_id": str(pairing.id), "title": "New lesson", "scheduled_date": str(date.today())},
        )

    # ── Creating lessons ──────────────────────────────────────────────────

    def test_student_cannot_create_lesson_on_own_pairing(self):
        self.assertEqual(self.create_lesson(self.student_a, self.pairing_a).status_code, 403)

    def test_student_cannot_create_lesson_on_other_pairing(self):
        self.assertEqual(self.create_lesson(self.student_a, self.pairing_b).status_code, 403)

    def test_teacher_cannot_create_lesson_on_other_teachers_pairing(self):
        res = self.create_lesson(self.teacher_a, self.pairing_b)
        self.assertEqual(res.status_code, 400)
        self.assertIn("pairing_id", res.data)

    def test_teacher_can_create_lesson_on_own_pairing(self):
        self.assertEqual(self.create_lesson(self.teacher_a, self.pairing_a).status_code, 201)

    def test_admin_can_create_lesson_on_any_pairing(self):
        self.assertEqual(self.create_lesson(self.admin, self.pairing_b).status_code, 201)

    # ── Reading and changing lessons ──────────────────────────────────────

    def test_lesson_list_is_scoped_to_participants(self):
        for user, expected in [
            (self.teacher_a, 1), (self.student_a, 1),
            (self.teacher_b, 0), (self.student_b, 0), (self.admin, 1),
        ]:
            with self.subTest(user=user.email):
                res = client_for(user).get("/api/v1/lessons/")
                self.assertEqual(res.data["count"], expected)

    def test_student_cannot_change_status(self):
        res = client_for(self.student_a).patch(f"/api/v1/lessons/{self.lesson_a.id}/status/", {"status": "completed"})
        self.assertEqual(res.status_code, 403)

    def test_other_teacher_cannot_change_status(self):
        res = client_for(self.teacher_b).patch(f"/api/v1/lessons/{self.lesson_a.id}/status/", {"status": "completed"})
        self.assertEqual(res.status_code, 404)

    def test_student_cannot_see_teacher_notes(self):
        self.lesson_a.teacher_notes = "private"
        self.lesson_a.save()
        res = client_for(self.student_a).get(f"/api/v1/lessons/{self.lesson_a.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertNotIn("teacher_notes", res.data)

    # ── Topics ────────────────────────────────────────────────────────────

    def topics_url(self, lesson=None):
        return f"/api/v1/lessons/{(lesson or self.lesson_a).id}/topics/"

    def test_outsiders_cannot_list_topics(self):
        for user in (self.teacher_b, self.student_b):
            with self.subTest(user=user.email):
                self.assertEqual(client_for(user).get(self.topics_url()).status_code, 404)

    def test_participants_can_list_topics(self):
        for user in (self.teacher_a, self.student_a, self.admin):
            with self.subTest(user=user.email):
                res = client_for(user).get(self.topics_url())
                self.assertEqual(res.status_code, 200)
                self.assertEqual(res.data["count"], 1)

    def test_student_cannot_add_topic(self):
        res = client_for(self.student_a).post(self.topics_url(), {"title": "Sneaky"})
        self.assertEqual(res.status_code, 403)

    def test_other_teacher_cannot_add_topic(self):
        res = client_for(self.teacher_b).post(self.topics_url(), {"title": "Sneaky"})
        self.assertEqual(res.status_code, 404)

    def test_other_teacher_cannot_edit_or_delete_topic(self):
        url = f"{self.topics_url()}{self.topic_a.id}/"
        client = client_for(self.teacher_b)
        self.assertEqual(client.patch(url, {"is_completed": True}).status_code, 404)
        self.assertEqual(client.delete(url).status_code, 404)

    def test_student_cannot_edit_topic(self):
        url = f"{self.topics_url()}{self.topic_a.id}/"
        self.assertEqual(client_for(self.student_a).patch(url, {"is_completed": True}).status_code, 403)

    def test_teacher_can_manage_own_topics(self):
        client = client_for(self.teacher_a)
        self.assertEqual(client.post(self.topics_url(), {"title": "Quadratics"}).status_code, 201)
        url = f"{self.topics_url()}{self.topic_a.id}/"
        self.assertEqual(client.patch(url, {"is_completed": True}).status_code, 200)
        self.assertEqual(client.delete(url).status_code, 204)
