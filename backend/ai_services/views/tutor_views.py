import json
from typing import AsyncIterator

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Count, F, Q
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services import quotas
from ai_services.attachments import AttachmentError, is_supported, resource_attachment
from ai_services.models import AIFeature, AIUsage, SafeguardingFlag, TutorConversation, TutorMessage, TutorRole
from ai_services.prompts import tutor_system
from ai_services.providers import AIError, ChatReply, ChatTurn, get_provider
from ai_services.serializers import (
    SafeguardingFlagSerializer,
    TutorConversationCreateSerializer,
    TutorConversationDetailSerializer,
    TutorConversationSerializer,
    TutorMessageCreateSerializer,
    TutorMessageSerializer,
)
from ai_services.views.common import EMPTY_REPLY, REFUSAL_REPLY, error_response, quota_response, usage_fields
from resources.models import Resource
from users.models import UserRole
from users.permissions import IsAdminOrTeacher, IsStudent

# Older turns are dropped beyond this, keeping requests (and cost) bounded in long chats.
MAX_HISTORY_MESSAGES = 40


def _conversations(user):
    return (
        TutorConversation.objects.visible_to(user)
        .select_related("student", "subject", "resource")
        .annotate(
            # distinct: the teacher visibility join can repeat rows.
            message_count=Count("messages", distinct=True),
            open_flags=Count("flags", filter=Q(flags__reviewed_at__isnull=True), distinct=True),
        )
        # Meta.ordering doesn't apply to GROUP BY queries, so order explicitly for stable pages.
        .order_by(F("last_message_at").desc(nulls_last=True), "-created_at")
    )


class TutorConversationListCreateView(generics.ListCreateAPIView):
    """Students: their own chats (and start new ones). Teachers: their students' chats.
    Admins: all chats. Filter with ?student=<id> and ?flagged=true."""
    permission_classes = [IsAuthenticated]
    serializer_class = TutorConversationSerializer
    filter_backends = []

    def get_queryset(self):
        qs = _conversations(self.request.user)
        student = self.request.query_params.get("student")
        if student:
            qs = qs.filter(student_id=student)
        if self.request.query_params.get("flagged") == "true":
            qs = qs.filter(open_flags__gt=0)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.STUDENT:
            return Response({"detail": "Only students can start tutor chats."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TutorConversationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        conversation = TutorConversation.objects.create(
            student=request.user,
            subject=serializer.validated_data.get("subject"),
            resource=serializer.validated_data.get("resource_id"),
        )
        return Response(
            TutorConversationSerializer(_conversations(request.user).get(pk=conversation.pk), context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TutorConversationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TutorConversationDetailSerializer

    def get_queryset(self):
        return _conversations(self.request.user).prefetch_related("messages", "flags__reviewed_by")


def _level(student) -> str:
    profile = getattr(student, "student_profile", None)
    if not profile:
        return ""
    parts = [profile.get_education_level_display() if profile.education_level else "", profile.grade_or_year or ""]
    return " ".join(p for p in parts if p)


def _subjects(student) -> list[str]:
    profile = getattr(student, "student_profile", None)
    return [s.name for s in profile.subjects_of_interest.all()] if profile else []


def _line(payload: dict) -> bytes:
    return (json.dumps(payload, cls=DjangoJSONEncoder) + "\n").encode()


class TutorReplyView(APIView):
    """POST a student message; the reply streams back as newline-delimited JSON events:
    {"type": "start", "user_message": ...}, then {"type": "text", "text": ...} chunks, then
    {"type": "done", "message": ..., "usage": ...} or {"type": "error", "detail": ...}."""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        conversation = generics.get_object_or_404(
            TutorConversation.objects.select_related("subject", "resource"), pk=pk, student=request.user
        )
        serializer = TutorMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data["content"]

        try:
            provider = get_provider()
        except AIError as error:
            return error_response(error)
        try:
            quotas.check_quota(request.user, quotas.TUTOR)
        except quotas.QuotaExceeded as exceeded:
            return quota_response(exceeded, "tutor messages")

        attachment = None
        resource = conversation.resource
        # Only send the file while the student can still see it (access can end with a pairing).
        if resource and is_supported(resource) and Resource.objects.visible_to(request.user).filter(pk=resource.pk).exists():
            try:
                attachment = resource_attachment(resource)
            except AttachmentError as error:
                return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        user_message = TutorMessage.objects.create(conversation=conversation, role=TutorRole.USER, content=content)
        if not conversation.title:
            conversation.title = content if len(content) <= 60 else content[:57].rstrip() + "…"
            conversation.save(update_fields=["title", "updated_at"])

        history = list(conversation.messages.order_by("created_at"))[-MAX_HISTORY_MESSAGES:]
        while history and history[0].role != TutorRole.USER:
            history.pop(0)  # the model expects the conversation to open with the student
        turns = [
            ChatTurn(role=m.role, text=m.content, attachments=(attachment,) if i == 0 and attachment else ())
            for i, m in enumerate(history)
        ]
        system = tutor_system(
            first_name=request.user.first_name,
            level=_level(request.user),
            subjects=_subjects(request.user),
            conversation_subject=conversation.subject.name if conversation.subject else None,
            attachment_title=attachment.title if attachment else None,
        )

        stream = self._stream(provider, request.user, conversation.pk, user_message, system, turns)
        response = StreamingHttpResponse(stream, content_type="application/x-ndjson")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"  # don't let a proxy hold the stream back
        return response

    @staticmethod
    async def _stream(provider, user, conversation_id, user_message, system, turns) -> AsyncIterator[bytes]:
        yield _line({"type": "start", "user_message": TutorMessageSerializer(user_message).data})

        reply: ChatReply | None = None
        try:
            async for event in provider.stream_tutor_reply(system=system, turns=turns):
                if event.type == "text":
                    yield _line({"type": "text", "text": event.text})
                elif event.type == "done":
                    reply = event.reply
        except AIError as error:
            yield _line({"type": "error", "detail": error.user_message})
            return
        if reply is None:
            yield _line({"type": "error", "detail": AIError.user_message})
            return

        text = REFUSAL_REPLY if reply.refused else (reply.text or EMPTY_REPLY)
        assistant_message = await TutorMessage.objects.acreate(
            conversation_id=conversation_id, role=TutorRole.ASSISTANT, content=text, refused=reply.refused
        )
        for signal in reply.signals:
            await SafeguardingFlag.objects.acreate(
                conversation_id=conversation_id, message=user_message, reason=signal.reason, severity=signal.severity
            )
        await TutorConversation.objects.filter(pk=conversation_id).aupdate(
            last_message_at=timezone.now(), updated_at=timezone.now()
        )
        await AIUsage.objects.acreate(**usage_fields(user, AIFeature.TUTOR, reply.usage, reply.refused))

        limit = quotas.daily_limit(quotas.TUTOR)
        used = await quotas.aused_today(user, quotas.TUTOR)
        yield _line({
            "type": "done",
            "message": TutorMessageSerializer(assistant_message).data,
            "usage": {"used": used, "limit": limit, "remaining": max(0, limit - used)},
        })


class SafeguardingFlagReviewView(APIView):
    """Teacher or admin marks a safeguarding flag as followed up."""
    permission_classes = [IsAdminOrTeacher]

    def post(self, request, pk):
        flag = generics.get_object_or_404(
            SafeguardingFlag.objects.filter(conversation__in=TutorConversation.objects.visible_to(request.user)),
            pk=pk,
        )
        if flag.reviewed_at is None:
            flag.reviewed_at = timezone.now()
            flag.reviewed_by = request.user
            flag.save(update_fields=["reviewed_at", "reviewed_by", "updated_at"])
        return Response(SafeguardingFlagSerializer(flag).data)
