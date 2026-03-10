import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group = f"chat_{self.conversation_id}"
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        conversation = await self._get_conversation()
        if not conversation:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group"):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")

        if msg_type == "chat_message":
            content = data.get("content", "").strip()
            if not content:
                return
            message = await self._save_message(content)
            if message:
                await self.channel_layer.group_send(
                    self.room_group,
                    {"type": "chat.message", "message": message},
                )

        elif msg_type == "typing":
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "chat.typing",
                    "user_id": str(self.user.id),
                    "is_typing": bool(data.get("is_typing", False)),
                },
            )

        elif msg_type == "read":
            await self._mark_read()
            await self.channel_layer.group_send(
                self.room_group,
                {"type": "chat.read", "user_id": str(self.user.id)},
            )

    # ── Group event handlers ──────────────────────────────────────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
        }))

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "is_typing": event["is_typing"],
        }))

    async def chat_read(self, event):
        await self.send(text_data=json.dumps({
            "type": "read",
            "user_id": event["user_id"],
        }))

    # ── DB helpers ────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_conversation(self):
        from chat.models import Conversation
        from django.db.models import Q
        try:
            conv = Conversation.objects.select_related(
                "pairing__teacher", "pairing__student"
            ).get(pk=self.conversation_id)
            pairing = conv.pairing
            if pairing.teacher == self.user or pairing.student == self.user:
                return conv
            return None
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def _save_message(self, content):
        from chat.models import Conversation, Message
        from chat.serializers import MessageSerializer
        try:
            conversation = Conversation.objects.get(pk=self.conversation_id)
            msg = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content,
            )
            # Update conversation preview
            preview = content[:197] + "…" if len(content) > 197 else content
            conversation.last_message_at = timezone.now()
            conversation.last_message_preview = preview
            conversation.save(update_fields=["last_message_at", "last_message_preview"])

            # Serialize for broadcast
            data = MessageSerializer(msg).data
            data["id"] = str(data["id"])
            data["conversation"] = str(data["conversation"])
            return data
        except Exception:
            return None

    @database_sync_to_async
    def _mark_read(self):
        from chat.models import Conversation
        now = timezone.now()
        try:
            conversation = Conversation.objects.get(pk=self.conversation_id)
            conversation.messages.filter(
                is_read=False
            ).exclude(sender=self.user).update(is_read=True, read_at=now)
        except Conversation.DoesNotExist:
            pass
