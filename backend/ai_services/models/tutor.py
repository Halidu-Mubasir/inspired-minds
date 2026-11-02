from django.db import models
from pairings.models import PairingStatus
from setup.base_model import BaseModel
from users.models import UserRole


class TutorConversationQuerySet(models.QuerySet):
    def visible_to(self, user):
        """Who may read a student's tutor chats: the student, their current teachers
        (active or paused pairings) and admins. Kept for safeguarding review."""
        if user.role == UserRole.ADMIN:
            return self.all()
        if user.role == UserRole.STUDENT:
            return self.filter(student=user)
        if user.role == UserRole.TEACHER:
            # Both conditions in one filter() so they apply to the same pairing row.
            return self.filter(
                student__student_pairings__teacher=user,
                student__student_pairings__status__in=[PairingStatus.ACTIVE, PairingStatus.PAUSED],
            ).distinct()
        return self.none()


class TutorConversation(BaseModel):
    """A student's chat with the AI tutor. Never deleted: it is a safeguarding record."""
    student = models.ForeignKey(
        "users.CustomUser", on_delete=models.PROTECT, related_name="tutor_conversations"
    )
    title = models.CharField(max_length=120, blank=True)
    subject = models.ForeignKey(
        "subjects.Subject", on_delete=models.PROTECT, null=True, blank=True, related_name="tutor_conversations"
    )
    # Optional file the student is asking about (past question, worksheet...).
    resource = models.ForeignKey(
        "resources.Resource", on_delete=models.SET_NULL, null=True, blank=True, related_name="tutor_conversations"
    )
    last_message_at = models.DateTimeField(null=True, blank=True)

    objects = TutorConversationQuerySet.as_manager()

    class Meta:
        ordering = ["-last_message_at", "-created_at"]

    def __str__(self):
        return self.title or f"Tutor chat {self.pk}"


class TutorRole(models.TextChoices):
    USER = "user", "Student"
    ASSISTANT = "assistant", "Tutor"


class TutorMessage(BaseModel):
    conversation = models.ForeignKey(TutorConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=TutorRole.choices)
    content = models.TextField()
    # The model declined to answer; content holds the message the student was shown instead.
    refused = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"


class FlagSeverity(models.TextChoices):
    LOW = "low", "Low"
    HIGH = "high", "High"


class SafeguardingFlag(BaseModel):
    """Raised by the tutor when a student's message suggests they may be at risk,
    for a teacher or admin to follow up. Students never see these."""
    conversation = models.ForeignKey(TutorConversation, on_delete=models.CASCADE, related_name="flags")
    message = models.ForeignKey(
        TutorMessage, on_delete=models.SET_NULL, null=True, blank=True, related_name="flags"
    )
    reason = models.TextField()
    severity = models.CharField(max_length=10, choices=FlagSeverity.choices, default=FlagSeverity.LOW)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "users.CustomUser", on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_flags"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_severity_display()} flag on {self.conversation}"
