from django.db import models
from setup.base_model import BaseModel


class ConversationType(models.TextChoices):
    GENERAL_CHAT       = "general_chat",       "General Chat"
    QUESTION_GENERATOR = "question_generator", "Question Generator"
    NOTE_SUMMARIZER    = "note_summarizer",    "Note Summarizer"
    PROBLEM_SOLVER     = "problem_solver",     "Problem Solver"


class AIConversation(BaseModel):
    user = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="ai_conversations",
    )
    title = models.CharField(max_length=255, blank=True, default="")
    conversation_type = models.CharField(
        max_length=30,
        choices=ConversationType.choices,
        default=ConversationType.GENERAL_CHAT,
    )
    system_prompt = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.title or self.get_conversation_type_display()}"


class MessageRole(models.TextChoices):
    USER      = "user",      "User"
    ASSISTANT = "assistant", "Assistant"


class AIMessage(BaseModel):
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role          = models.CharField(max_length=20, choices=MessageRole.choices)
    content       = models.TextField()
    input_tokens  = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:60]}"
