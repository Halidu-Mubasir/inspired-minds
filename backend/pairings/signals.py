from django.db.models.signals import post_save
from django.dispatch import receiver
from pairings.models import TeacherStudentPairing


@receiver(post_save, sender=TeacherStudentPairing)
def create_conversation_for_pairing(sender, instance, created, **kwargs):
    """Every pairing gets exactly one chat Conversation, created with it."""
    if not created:
        return
    from chat.models import Conversation
    Conversation.objects.get_or_create(pairing=instance)
