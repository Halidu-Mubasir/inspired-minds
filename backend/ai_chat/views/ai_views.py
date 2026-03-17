from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_chat.models import AIConversation, AIMessage
from ai_chat.serializers.ai_serializers import (
    AIConversationListSerializer,
    AIConversationDetailSerializer,
    CreateConversationSerializer,
    SendMessageSerializer,
    AIMessageSerializer,
)
from ai_chat.services.ai_service import get_ai_response


class AIConversationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/ai-chat/conversations/  — list the current user's conversations
    POST /api/v1/ai-chat/conversations/  — create a new conversation
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            AIConversation.objects
            .filter(user=self.request.user)
            .prefetch_related("messages")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateConversationSerializer
        return AIConversationListSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        conversation = AIConversation.objects.create(
            user=request.user,
            title=data.get("title", ""),
            conversation_type=data.get("conversation_type", "general_chat"),
            system_prompt=data.get("system_prompt", ""),
        )
        return Response(
            AIConversationDetailSerializer(conversation).data,
            status=status.HTTP_201_CREATED,
        )


class AIConversationDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/v1/ai-chat/conversations/<uuid:pk>/  — fetch conversation + messages
    DELETE /api/v1/ai-chat/conversations/<uuid:pk>/  — delete conversation
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIConversationDetailSerializer

    def get_queryset(self):
        return (
            AIConversation.objects
            .filter(user=self.request.user)
            .prefetch_related("messages")
        )


class SendMessageView(APIView):
    """
    POST /api/v1/ai-chat/conversations/<uuid:pk>/messages/
    Body: { "content": "..." }
    Returns: { "user_message": {...}, "ai_message": {...} }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Ownership check
        try:
            conversation = (
                AIConversation.objects
                .prefetch_related("messages")
                .get(pk=pk, user=request.user)
            )
        except AIConversation.DoesNotExist:
            return Response(
                {"detail": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_content = serializer.validated_data["content"]

        # Save the user message first
        user_message = AIMessage.objects.create(
            conversation=conversation,
            role="user",
            content=user_content,
        )

        # Build full message history for the AI call
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in conversation.messages.order_by("created_at")
        ]

        # Call the AI service
        try:
            result = get_ai_response(
                conversation_type=conversation.conversation_type,
                messages_history=history,
                custom_system_prompt=conversation.system_prompt,
            )
        except Exception as e:
            # Roll back the user message if AI call fails
            user_message.delete()
            return Response(
                {"detail": f"AI request failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Auto-set title from the first user message if still blank
        if not conversation.title:
            conversation.title = user_content[:60]
            conversation.save(update_fields=["title", "updated_at"])

        # Save the AI response
        ai_message = AIMessage.objects.create(
            conversation=conversation,
            role="assistant",
            content=result["content"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
        )

        return Response(
            {
                "user_message": AIMessageSerializer(user_message).data,
                "ai_message": AIMessageSerializer(ai_message).data,
            },
            status=status.HTTP_201_CREATED,
        )
