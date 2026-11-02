from datetime import date

from django.db.models import ProtectedError
from django.test import TestCase

from lessons.models import Lesson
from pairings.models import PairingStatus
from setup.testing import client_for, make_pairing, make_user


class HistoryProtectionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")

    def setUp(self):
        self.pairing = make_pairing(self.teacher, self.student)
        Lesson.objects.create(pairing=self.pairing, title="Algebra", scheduled_date=date.today())

    def test_user_with_pairing_cannot_be_deleted(self):
        with self.assertRaises(ProtectedError):
            self.teacher.delete()

    def test_pairing_with_history_cannot_be_deleted(self):
        with self.assertRaises(ProtectedError):
            self.pairing.delete()

    def test_deactivating_teacher_pauses_active_pairings_only(self):
        ended = make_pairing(self.teacher, make_user("student", "other"), subject="Physics")
        ended.status = PairingStatus.ENDED
        ended.save()

        res = client_for(self.admin).delete(f"/api/v1/auth/teachers/{self.teacher.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["pairings_paused"], 1)
        self.pairing.refresh_from_db()
        ended.refresh_from_db()
        self.assertEqual(self.pairing.status, PairingStatus.PAUSED)
        self.assertEqual(ended.status, PairingStatus.ENDED)

    def test_inactive_users_cannot_be_paired(self):
        self.teacher.is_active = False
        self.teacher.save()
        res = client_for(self.admin).post("/api/v1/pairings/", {
            "teacher_id": str(self.teacher.id), "student_id": str(self.student.id),
            "subject": "Physics", "start_date": str(date.today()),
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("teacher_id", res.data)


class EndDateConsistencyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.pairing = make_pairing(make_user("teacher", "teacher"), make_user("student", "student"))

    def patch(self, data):
        return client_for(self.admin).patch(f"/api/v1/pairings/{self.pairing.id}/", data)

    def test_ending_sets_end_date_and_reopening_clears_it(self):
        self.assertEqual(self.patch({"status": "ended"}).status_code, 200)
        self.pairing.refresh_from_db()
        self.assertEqual(self.pairing.end_date, date.today())

        self.assertEqual(self.patch({"status": "active"}).status_code, 200)
        self.pairing.refresh_from_db()
        self.assertIsNone(self.pairing.end_date)

    def test_open_pairing_cannot_have_end_date(self):
        res = self.patch({"end_date": str(date.today())})
        self.assertEqual(res.status_code, 400)
        self.assertIn("end_date", res.data)
