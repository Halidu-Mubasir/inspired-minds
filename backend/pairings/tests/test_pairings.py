from datetime import date

from django.test import TestCase

from pairings.models import PairingStatus, TeacherStudentPairing
from setup.testing import client_for, make_pairing, make_user


class RePairingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")

    def create_pairing(self):
        return client_for(self.admin).post("/api/v1/pairings/", {
            "teacher_id": str(self.teacher.id),
            "student_id": str(self.student.id),
            "subject": "Mathematics",
            "start_date": str(date.today()),
        })

    def test_duplicate_open_pairing_is_rejected(self):
        make_pairing(self.teacher, self.student)
        self.assertEqual(self.create_pairing().status_code, 400)

    def test_can_re_pair_after_pairing_ended(self):
        ended = make_pairing(self.teacher, self.student)
        self.assertEqual(client_for(self.admin).delete(f"/api/v1/pairings/{ended.id}/").status_code, 200)

        res = self.create_pairing()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(TeacherStudentPairing.objects.count(), 2)

    def test_cannot_reopen_ended_pairing_while_another_is_open(self):
        ended = make_pairing(self.teacher, self.student)
        ended.status = PairingStatus.ENDED
        ended.save()
        make_pairing(self.teacher, self.student)

        res = client_for(self.admin).patch(f"/api/v1/pairings/{ended.id}/", {"status": "active"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("status", res.data)

    def test_can_reopen_ended_pairing_when_no_other_is_open(self):
        ended = make_pairing(self.teacher, self.student)
        ended.status = PairingStatus.ENDED
        ended.save()

        res = client_for(self.admin).patch(f"/api/v1/pairings/{ended.id}/", {"status": "active"})
        self.assertEqual(res.status_code, 200, res.data)
