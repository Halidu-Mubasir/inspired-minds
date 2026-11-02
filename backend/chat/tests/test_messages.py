from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from chat.consumers.chat_consumer import ChatConsumer
from chat.models import Message
from pairings.models import PairingStatus
from setup.testing import client_for, make_pairing, make_user


class MessageHistoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.teacher = make_user("teacher", "teacher")
        cls.student = make_user("student", "student")
        cls.conversation = make_pairing(cls.teacher, cls.student).conversation
        start = timezone.now() - timedelta(hours=1)
        for i in range(5):
            msg = Message.objects.create(conversation=cls.conversation, sender=cls.teacher, content=f"message {i}")
            # created_at is auto_now_add, so set distinct timestamps afterwards.
            Message.objects.filter(pk=msg.pk).update(created_at=start + timedelta(minutes=i))

    def get_page(self, page):
        url = f"/api/v1/chat/conversations/{self.conversation.id}/messages/?page={page}&page_size=2"
        return client_for(self.student).get(url)

    def test_first_page_holds_the_newest_messages(self):
        res = self.get_page(1)
        self.assertEqual([m["content"] for m in res.data["results"]], ["message 4", "message 3"])
        self.assertIsNotNone(res.data["next"])

    def test_later_pages_hold_older_messages(self):
        res = self.get_page(3)
        self.assertEqual([m["content"] for m in res.data["results"]], ["message 0"])
        self.assertIsNone(res.data["next"])


class EndedPairingChatTests(TestCase):
    """The consumer's DB helper is called directly; the socket plumbing is Channels' concern."""

    @classmethod
    def setUpTestData(cls):
        cls.teacher = make_user("teacher", "teacher")
        cls.pairing = make_pairing(cls.teacher, make_user("student", "student"))

    def save_message(self):
        consumer = ChatConsumer()
        consumer.conversation_id = self.pairing.conversation.id
        consumer.user = self.teacher
        # Bypass the async wrapper (and its descriptor) to run the sync body in this test's transaction.
        return ChatConsumer.__dict__["_save_message"].func(consumer, "hello")

    def test_messages_are_saved_on_open_pairing(self):
        self.assertEqual(self.save_message()["content"], "hello")
        self.assertEqual(Message.objects.count(), 1)

    def test_ended_pairing_chat_is_read_only(self):
        self.pairing.status = PairingStatus.ENDED
        self.pairing.save()
        self.assertIsNone(self.save_message())
        self.assertFalse(Message.objects.exists())
