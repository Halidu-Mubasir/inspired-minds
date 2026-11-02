from datetime import date, timedelta

from django.test import TestCase

from chat.models import Message
from lessons.models import Lesson, LessonStatus
from setup.testing import client_for, make_pairing, make_user


class DraftVisibilityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")
        cls.pairing = make_pairing(cls.teacher, cls.student)
        cls.draft = Lesson.objects.create(pairing=cls.pairing, title="Draft", scheduled_date=date.today())
        cls.scheduled = Lesson.objects.create(
            pairing=cls.pairing, title="Scheduled", scheduled_date=date.today(), status=LessonStatus.SCHEDULED
        )

    def titles(self, user):
        return {lesson["title"] for lesson in client_for(user).get("/api/v1/lessons/").data["results"]}

    def test_students_do_not_see_drafts(self):
        self.assertEqual(self.titles(self.student), {"Scheduled"})
        self.assertEqual(client_for(self.student).get(f"/api/v1/lessons/{self.draft.id}/").status_code, 404)
        self.assertEqual(client_for(self.student).get(f"/api/v1/lessons/{self.draft.id}/topics/").status_code, 404)

    def test_teachers_see_their_drafts(self):
        self.assertEqual(self.titles(self.teacher), {"Draft", "Scheduled"})

    def test_scheduling_publishes_to_student(self):
        client_for(self.teacher).patch(f"/api/v1/lessons/{self.draft.id}/status/", {"status": "scheduled"})
        self.assertEqual(self.titles(self.student), {"Draft", "Scheduled"})


class DashboardSummaryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")
        cls.pairing = make_pairing(cls.teacher, cls.student)
        today = date.today()
        for title, offset, status in [
            ("this week", 2, LessonStatus.SCHEDULED),
            ("today", 0, LessonStatus.SCHEDULED),
            ("next month", 30, LessonStatus.SCHEDULED),
            ("past", -1, LessonStatus.SCHEDULED),
            ("draft this week", 1, LessonStatus.DRAFT),
        ]:
            Lesson.objects.create(pairing=cls.pairing, title=title, scheduled_date=today + timedelta(days=offset), status=status)
        Message.objects.create(conversation=cls.pairing.conversation, sender=cls.teacher, content="hi")

    def summary(self, user):
        res = client_for(user).get("/api/v1/auth/me/summary/")
        self.assertEqual(res.status_code, 200)
        return res.data

    def test_upcoming_counts_scheduled_lessons_in_the_next_seven_days(self):
        self.assertEqual(self.summary(self.teacher)["upcoming_lessons"], 2)
        self.assertEqual(self.summary(self.student)["upcoming_lessons"], 2)

    def test_unread_counts_only_messages_from_the_other_party(self):
        self.assertEqual(self.summary(self.student)["unread_messages"], 1)
        self.assertEqual(self.summary(self.teacher)["unread_messages"], 0)

    def test_admin_stats_include_lessons_this_week(self):
        res = client_for(self.admin).get("/api/v1/auth/dashboard-stats/")
        self.assertEqual(res.data["lessons_this_week"], 2)
