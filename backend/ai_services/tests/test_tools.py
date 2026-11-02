from datetime import date
from unittest import mock

from django.test import TestCase, override_settings

from ai_services.models import AIGeneration, AIUsage
from ai_services.schemas import GeneratedQuestion, QuestionSet
from ai_services.tests.fakes import FakeProvider
from lessons.models import Lesson, LessonTopic
from setup.testing import client_for, make_pairing, make_user

PROVIDER = "ai_services.views.tool_views.get_provider"

QUESTIONS = QuestionSet(title="Quadratics practice", questions=[
    GeneratedQuestion(question="Solve x² − 5x + 6 = 0.", type="short_answer", options=[],
                      answer="x = 2 or x = 3", explanation="Factorise: (x − 2)(x − 3) = 0.", marks=2),
])

QUESTION_REQUEST = {"subject": "Mathematics", "topic": "Quadratic equations", "level": "SHS 2", "count": 5}


class TeacherToolTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.teacher = make_user("teacher", "teacher")
        cls.other_teacher = make_user("teacher", "other")
        cls.student = make_user("student", "student")
        cls.pairing = make_pairing(cls.teacher, cls.student)
        cls.lesson = Lesson.objects.create(
            pairing=cls.pairing, title="Quadratic Equations", scheduled_date=date.today(),
            student_notes="Bring a calculator.", teacher_notes="Esi struggles with factorising.",
        )
        LessonTopic.objects.create(lesson=cls.lesson, title="Factorising")

    def post(self, path, data, provider=None, user=None):
        provider = provider or FakeProvider(structured=QUESTIONS)
        with mock.patch(PROVIDER, return_value=provider):
            response = client_for(user or self.teacher).post(f"/api/v1/ai/tools/{path}/", data, format="json")
        return response, provider

    def test_question_generation_is_saved_with_usage(self):
        res, provider = self.post("questions", QUESTION_REQUEST)
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["kind"], "questions")
        self.assertEqual(res.data["output"]["questions"][0]["answer"], "x = 2 or x = 3")
        self.assertEqual(res.data["usage"], {"used": 1, "limit": 30, "remaining": 29})
        call = provider.calls[0]
        self.assertIs(call["schema"], QuestionSet)
        self.assertEqual(call["effort"], "medium")
        self.assertIn("Topic: Quadratic equations", call["prompt"])
        self.assertEqual(AIUsage.objects.get().feature, "questions")

    def test_lesson_context_excludes_private_teacher_notes(self):
        res, provider = self.post("questions", {**QUESTION_REQUEST, "lesson_id": str(self.lesson.id)})
        self.assertEqual(res.status_code, 201, res.data)
        prompt = provider.calls[0]["prompt"]
        self.assertIn("Factorising", prompt)
        self.assertIn("Bring a calculator.", prompt)
        self.assertNotIn("struggles", prompt)

    def test_other_teachers_lessons_cannot_be_used(self):
        res, provider = self.post("questions", {**QUESTION_REQUEST, "lesson_id": str(self.lesson.id)},
                                  user=self.other_teacher)
        self.assertEqual(res.status_code, 400)
        self.assertEqual(provider.calls, [])

    def test_refusal_and_incomplete_output(self):
        res, _ = self.post("questions", QUESTION_REQUEST, provider=FakeProvider(structured_refused=True))
        self.assertEqual(res.status_code, 422)
        res, _ = self.post("questions", QUESTION_REQUEST, provider=FakeProvider(structured=None))
        self.assertEqual(res.status_code, 502)
        self.assertFalse(AIGeneration.objects.exists())
        self.assertEqual(AIUsage.objects.count(), 2)  # the requests still cost tokens

    def test_students_cannot_use_teacher_tools(self):
        res, provider = self.post("questions", QUESTION_REQUEST, user=self.student)
        self.assertEqual(res.status_code, 403)
        self.assertEqual(provider.calls, [])

    def test_unknown_subject_and_bad_count_are_rejected(self):
        for data in [{**QUESTION_REQUEST, "subject": "Astrology"}, {**QUESTION_REQUEST, "count": 50}]:
            with self.subTest(data=data):
                self.assertEqual(self.post("questions", data)[0].status_code, 400)

    def test_summary_from_pasted_notes(self):
        res, provider = self.post("summary", {"text": "Photosynthesis turns light into chemical energy.",
                                              "format": "teacher_summary", "length": "short"})
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["output"], {"markdown": "## Summary"})
        self.assertEqual(res.data["title"], "Teacher summary: pasted notes")
        self.assertEqual(provider.calls[0]["effort"], "low")
        self.assertIn("<notes>", provider.calls[0]["prompt"])

    def test_summary_needs_a_source(self):
        self.assertEqual(self.post("summary", {"format": "revision_sheet"})[0].status_code, 400)

    @override_settings(AI_DAILY_TEACHER_TOOL_RUNS=1)
    def test_tools_share_one_daily_cap(self):
        self.assertEqual(self.post("questions", QUESTION_REQUEST)[0].status_code, 201)
        res, provider = self.post("summary", {"text": "Some notes"})
        self.assertEqual(res.status_code, 429)
        self.assertEqual(provider.calls, [])

    def test_history_is_private_to_its_author(self):
        self.post("questions", QUESTION_REQUEST)
        mine = client_for(self.teacher).get("/api/v1/ai/tools/generations/").data
        theirs = client_for(self.other_teacher).get("/api/v1/ai/tools/generations/").data
        self.assertEqual(mine["count"], 1)
        self.assertEqual(theirs["count"], 0)
        generation_id = mine["results"][0]["id"]
        self.assertEqual(client_for(self.other_teacher).get(f"/api/v1/ai/tools/generations/{generation_id}/").status_code, 404)

    def test_usage_endpoint(self):
        with mock.patch(PROVIDER, return_value=FakeProvider()):
            teacher = client_for(self.teacher).get("/api/v1/ai/usage/").data
            student = client_for(self.student).get("/api/v1/ai/usage/").data
        self.assertEqual(teacher, {"configured": True, "teacher_tools": {"used": 0, "limit": 30, "remaining": 30}})
        self.assertEqual(student["tutor"]["limit"], 50)
