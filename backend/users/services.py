from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from users.tokens import revoke_refresh_tokens


@transaction.atomic
def deactivate_user(user):
    """Deactivate an account without deleting its history.

    Ends the user's sessions and pauses their active pairings, so the other party
    sees the pairing on hold rather than silently orphaned. Returns the number of
    pairings paused.
    """
    from pairings.models import PairingStatus, TeacherStudentPairing

    user.is_active = False
    user.save(update_fields=["is_active", "updated_at"])
    revoke_refresh_tokens(user)
    return TeacherStudentPairing.objects.filter(
        Q(teacher=user) | Q(student=user), status=PairingStatus.ACTIVE
    ).update(status=PairingStatus.PAUSED, updated_at=timezone.now())
