from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from chat.models import Conversation, Message
from chat.serializers import ConversationSerializer, MessageSerializer


def _get_user_conversations(user):
    """Return Conversation queryset visible to this user, annotated with unread_count."""
    qs = Conversation.objects.filter(
        Q(pairing__teacher=user) | Q(pairing__student=user)
    ).select_related("pairing__teacher", "pairing__student").annotate(
        unread_count=Count(
            "messages",
            filter=Q(messages__is_read=False) & ~Q(messages__sender=user),
        )
    )
    return qs


class ConversationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return _get_user_conversations(self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ConversationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return _get_user_conversations(self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MessageListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs["pk"]
        # Ensure user is a participant
        conversation = generics.get_object_or_404(
            Conversation,
            pk=conversation_id,
        )
        user = self.request.user
        if conversation.pairing.teacher != user and conversation.pairing.student != user:
            return Message.objects.none()
        return conversation.messages.select_related("sender")


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        conversation = generics.get_object_or_404(Conversation, pk=pk)
        user = request.user
        if conversation.pairing.teacher != user and conversation.pairing.student != user:
            return Response({"detail": "Not a participant."}, status=status.HTTP_403_FORBIDDEN)
        now = timezone.now()
        updated = conversation.messages.filter(
            is_read=False
        ).exclude(sender=user).update(is_read=True, read_at=now)
        return Response({"marked_read": updated})
