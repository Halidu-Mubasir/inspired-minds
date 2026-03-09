from django.db.models.signals import post_save
from django.dispatch import receiver
from pairings.models import TeacherStudentPairing


@receiver(post_save, sender=TeacherStudentPairing)
def create_conversation_for_pairing(sender, instance, created, **kwargs):
    """Auto-create a chat Conversation when a new pairing is created.
    Full implementation completes in Phase 4 when the chat app models exist.
    """
    if not created:
        return
    try:
        from chat.models import Conversation
        Conversation.objects.get_or_create(pairing=instance)
    except Exception:
        # chat.Conversation not yet created (Phase 4) — silently skip
        pass
