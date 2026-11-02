import shutil
import tempfile
from datetime import date
from unittest import mock

from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.test import TestCase, override_settings

from ai_services.models import AIUsage, SafeguardingFlag, TutorConversation, TutorMessage
from ai_services.prompts import TUTOR_PROMPT
from ai_services.tests.fakes import FakeProvider, concern, read_stream
from ai_services.views.common import REFUSAL_REPLY
from pairings.models import PairingStatus
from resources.models import Resource
from setup.testing import client_for, make_pairing, make_user
from users.models import StudentProfile

PROVIDER = "ai_services.views.tutor_views.get_provider"


class TutorTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = make_user("admin", "admin")
        cls.teacher = make_user("teacher", "teacher")
        cls.other_teacher = make_user("teacher", "other_teacher")
        cls.student = make_user("student", "esi")
        cls.other_student = make_user("student", "yaw")
        StudentProfile.objects.create(user=cls.student, education_level="shs", grade_or_year="Form 2")
        cls.pairing = make_pairing(cls.teacher, cls.student)

    def setUp(self):
        self.storage_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.storage_dir, ignore_errors=True)
        patcher = mock.patch.object(
            Resource._meta.get_field("file"), "storage", FileSystemStorage(location=self.storage_dir)
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def make_resource(self, name="past-paper.pdf", content=b"%PDF-1.4 fake", visibility="library"):
        resource = Resource(
            title="BECE 2023 Maths", resource_type="past_question", visibility=visibility,
            file_name=name, file_size=len(content), mime_type="application/pdf", uploaded_by=self.teacher,
            pairing=self.pairing if visibility == "private" else None,
        )
        resource.file.save(name, ContentFile(content), save=False)
        resource.save()
        return resource

    def start(self, user=None, **data):
        return client_for(user or self.student).post("/api/v1/ai/tutor/conversations/", data, format="json")

    def send(self, conversation_id, content="How do I factorise x² + 5x + 6?", provider=None, user=None):
        provider = provider or FakeProvider()
        with mock.patch(PROVIDER, return_value=provider):
            response = client_for(user or self.student).post(
                f"/api/v1/ai/tutor/conversations/{conversation_id}/messages/", {"content": content}, format="json"
            )
        return response, provider


class StartConversationTests(TutorTestCase):
    def test_student_starts_conversation_with_supported_file(self):
        resource = self.make_resource()
        res = self.start(subject="Mathematics", resource_id=str(resource.id))
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["resource"]["title"], "BECE 2023 Maths")
        self.assertNotIn("open_flags", res.data)  # staff-only field

    def test_unsupported_file_type_is_rejected(self):
        resource = self.make_resource(name="notes.docx")
        res = self.start(resource_id=str(resource.id))
        self.assertEqual(res.status_code, 400)
        self.assertIn("resource_id", res.data)

    def test_cannot_attach_another_students_private_file(self):
        other_pairing = make_pairing(self.other_teacher, self.other_student)
        resource = self.make_resource(visibility="private")
        resource.pairing = other_pairing
        resource.save()
        self.assertEqual(self.start(resource_id=str(resource.id)).status_code, 400)

    def test_teachers_cannot_start_tutor_chats(self):
        self.assertEqual(self.start(user=self.teacher).status_code, 403)


class TutorReplyTests(TutorTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = TutorConversation.objects.create(student=self.student)

    def test_reply_streams_and_is_saved_with_usage(self):
        res, _ = self.send(self.conversation.id)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/x-ndjson")
        events = read_stream(res)
        self.assertEqual([e["type"] for e in events], ["start", "text", "text", "done"])
        self.assertEqual("".join(e["text"] for e in events if e["type"] == "text"), "Let's work it out.")
        self.assertEqual(events[-1]["message"]["content"], "Let's work it out.")
        self.assertEqual(events[-1]["usage"], {"used": 1, "limit": 50, "remaining": 49})

        self.assertEqual(list(self.conversation.messages.values_list("role", flat=True)), ["user", "assistant"])
        usage = AIUsage.objects.get()
        self.assertEqual((usage.user, usage.feature, usage.input_tokens), (self.student, "tutor", 100))
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.title, "How do I factorise x² + 5x + 6?")
        self.assertIsNotNone(self.conversation.last_message_at)

    def test_history_and_student_context_are_sent(self):
        read_stream(self.send(self.conversation.id, "First question")[0])
        res, provider = self.send(self.conversation.id, "Second question")
        read_stream(res)  # the provider only runs as the stream is consumed
        call = provider.calls[0]
        self.assertEqual([t.role for t in call["turns"]], ["user", "assistant", "user"])
        self.assertEqual(call["turns"][-1].text, "Second question")
        self.assertEqual(call["system"].stable, TUTOR_PROMPT)  # unchanged, so it can be cached
        self.assertIn("First name: Esi", call["system"].context)
        self.assertIn("Level: Senior High School Form 2", call["system"].context)

    def test_attached_file_goes_with_the_first_turn_only(self):
        self.conversation.resource = self.make_resource()
        self.conversation.save()
        read_stream(self.send(self.conversation.id, "Question 1 please")[0])
        res, provider = self.send(self.conversation.id, "And question 2?")
        read_stream(res)
        turns = provider.calls[0]["turns"]
        self.assertEqual(len(turns[0].attachments), 1)
        self.assertEqual(turns[0].attachments[0].kind, "pdf")
        self.assertEqual(turns[2].attachments, ())

    def test_refusal_shows_a_friendly_reply(self):
        res, _ = self.send(self.conversation.id, provider=FakeProvider(refused=True))
        done = read_stream(res)[-1]
        self.assertEqual(done["message"]["content"], REFUSAL_REPLY)
        self.assertTrue(TutorMessage.objects.get(role="assistant").refused)
        self.assertTrue(AIUsage.objects.get().refused)

    def test_provider_failure_streams_an_error_and_saves_no_reply(self):
        res, _ = self.send(self.conversation.id, provider=FakeProvider(fail=True))
        events = read_stream(res)
        self.assertEqual(events[-1]["type"], "error")
        self.assertIn("busy", events[-1]["detail"])
        self.assertFalse(TutorMessage.objects.filter(role="assistant").exists())
        self.assertFalse(AIUsage.objects.exists())  # failed requests don't count against the cap

    @override_settings(AI_DAILY_TUTOR_MESSAGES=1)
    def test_daily_cap(self):
        read_stream(self.send(self.conversation.id)[0])
        res, provider = self.send(self.conversation.id)
        self.assertEqual(res.status_code, 429)
        self.assertEqual(provider.calls, [])

    @override_settings(ANTHROPIC_API_KEY="")
    def test_not_configured_returns_503(self):
        res = client_for(self.student).post(
            f"/api/v1/ai/tutor/conversations/{self.conversation.id}/messages/", {"content": "hi"}, format="json"
        )
        self.assertEqual(res.status_code, 503)
        self.assertFalse(TutorMessage.objects.exists())

    def test_only_the_owner_can_send(self):
        res, _ = self.send(self.conversation.id, user=self.other_student)
        self.assertEqual(res.status_code, 404)

    def test_empty_and_overlong_messages_are_rejected(self):
        for content in ["   ", "x" * 4001]:
            with self.subTest(length=len(content)):
                res, provider = self.send(self.conversation.id, content=content)
                self.assertEqual(res.status_code, 400)
                self.assertEqual(provider.calls, [])


class OversightTests(TutorTestCase):
    def setUp(self):
        super().setUp()
        self.conversation = TutorConversation.objects.create(student=self.student, title="Help")
        read_stream(self.send(self.conversation.id, provider=FakeProvider(signals=[concern()]))[0])

    def detail(self, user):
        return client_for(user).get(f"/api/v1/ai/tutor/conversations/{self.conversation.id}/")

    def ids(self, user, query=""):
        res = client_for(user).get(f"/api/v1/ai/tutor/conversations/{query}")
        return [c["id"] for c in res.data["results"]]

    def test_safeguarding_signal_creates_flag_hidden_from_student(self):
        flag = SafeguardingFlag.objects.get()
        self.assertEqual(flag.severity, "high")
        self.assertEqual(flag.message.role, "user")
        self.assertNotIn("flags", self.detail(self.student).data)

    def test_paired_teacher_and_admin_can_review(self):
        for user in (self.teacher, self.admin):
            with self.subTest(user=user.email):
                res = self.detail(user)
                self.assertEqual(res.status_code, 200)
                self.assertEqual(res.data["open_flags"], 1)
                self.assertEqual(len(res.data["flags"]), 1)
                self.assertEqual(len(res.data["messages"]), 2)
        self.assertEqual(self.ids(self.teacher, "?flagged=true"), [str(self.conversation.id)])

    def test_unpaired_and_ended_pairing_teachers_cannot_see(self):
        self.assertEqual(self.detail(self.other_teacher).status_code, 404)
        self.pairing.status = PairingStatus.ENDED
        self.pairing.save()
        self.assertEqual(self.detail(self.teacher).status_code, 404)
        self.assertEqual(self.ids(self.teacher), [])

    def test_other_students_cannot_see(self):
        self.assertEqual(self.detail(self.other_student).status_code, 404)

    def test_teacher_marks_flag_reviewed(self):
        flag = SafeguardingFlag.objects.get()
        res = client_for(self.teacher).post(f"/api/v1/ai/tutor/flags/{flag.id}/review/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["reviewed_by"]["first_name"], "Teacher")
        self.assertEqual(self.detail(self.teacher).data["open_flags"], 0)
        self.assertEqual(
            client_for(self.other_teacher).post(f"/api/v1/ai/tutor/flags/{flag.id}/review/").status_code, 404
        )
