from django.db import models
from setup.base_model import BaseModel


class Conversation(BaseModel):
    pairing = models.OneToOneField(
        "pairings.TeacherStudentPairing",
        on_delete=models.CASCADE,
        related_name="conversation",
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_preview = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-last_message_at"]

    def __str__(self):
        return f"Conversation: {self.pairing}"
