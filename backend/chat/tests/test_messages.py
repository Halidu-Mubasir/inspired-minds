from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from chat.models import Message
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
