from datetime import date

from django.test import TestCase

from lessons.models import Lesson, LessonStatus
from setup.testing import client_for, make_pairing, make_user


class LessonStatusTransitionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.teacher = make_user("teacher", "teacher")
        cls.pairing = make_pairing(cls.teacher, make_user("student", "student"))

    def set_status(self, start, target):
        lesson = Lesson.objects.create(pairing=self.pairing, title="L", scheduled_date=date.today(), status=start)
        return client_for(self.teacher).patch(f"/api/v1/lessons/{lesson.id}/status/", {"status": target})

    def test_allowed_transitions(self):
        for start, target in [
            (LessonStatus.DRAFT, LessonStatus.SCHEDULED),
            (LessonStatus.SCHEDULED, LessonStatus.COMPLETED),
            (LessonStatus.SCHEDULED, LessonStatus.DRAFT),
            (LessonStatus.CANCELLED, LessonStatus.SCHEDULED),
        ]:
            with self.subTest(f"{start} -> {target}"):
                self.assertEqual(self.set_status(start, target).status_code, 200)

    def test_completed_is_final(self):
        for target in (LessonStatus.DRAFT, LessonStatus.SCHEDULED, LessonStatus.CANCELLED):
            with self.subTest(target):
                res = self.set_status(LessonStatus.COMPLETED, target)
                self.assertEqual(res.status_code, 400)
                self.assertIn("status", res.data)

    def test_cancelled_cannot_jump_to_completed(self):
        self.assertEqual(self.set_status(LessonStatus.CANCELLED, LessonStatus.COMPLETED).status_code, 400)
