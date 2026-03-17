from rest_framework import serializers
from ai_chat.models import AIConversation, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "role", "content", "input_tokens", "output_tokens", "created_at"]
        read_only_fields = fields


class AIConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source="messages.count", read_only=True)
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = [
            "id", "title", "conversation_type", "message_count",
            "last_message_at", "created_at",
        ]

    def get_last_message_at(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return last.created_at if last else obj.created_at


class AIConversationDetailSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = [
            "id", "title", "conversation_type", "system_prompt",
            "messages", "created_at",
        ]


class CreateConversationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    conversation_type = serializers.ChoiceField(
        choices=["general_chat", "question_generator", "note_summarizer", "problem_solver"],
        default="general_chat",
    )
    system_prompt = serializers.CharField(required=False, allow_blank=True, default="")


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1)
