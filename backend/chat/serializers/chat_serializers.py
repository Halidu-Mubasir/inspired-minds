from rest_framework import serializers
from chat.models import Conversation, Message


class ParticipantSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    avatar = serializers.ImageField(use_url=True, allow_null=True)


class MessageSerializer(serializers.ModelSerializer):
    sender = ParticipantSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "is_read", "read_at", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    teacher = serializers.SerializerMethodField()
    student = serializers.SerializerMethodField()
    subject = serializers.CharField(source="pairing.subject", read_only=True)
    pairing_id = serializers.UUIDField(source="pairing.id", read_only=True)
    unread_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id", "pairing_id", "subject", "teacher", "student",
            "last_message_at", "last_message_preview", "unread_count", "created_at",
        ]

    def _participant(self, user):
        if not user:
            return None
        request = self.context.get("request")
        avatar_url = None
        if user.avatar and request:
            avatar_url = request.build_absolute_uri(user.avatar.url)
        return {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar": avatar_url,
        }

    def get_teacher(self, obj):
        return self._participant(obj.pairing.teacher)

    def get_student(self, obj):
        return self._participant(obj.pairing.student)
