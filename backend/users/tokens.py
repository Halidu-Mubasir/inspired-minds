from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def revoke_refresh_tokens(user):
    """Blacklist every refresh token issued to the user, ending all of their sessions.

    Access tokens already issued stay valid until they expire (ACCESS_TOKEN_LIFETIME),
    except for deactivated users, whom JWT authentication rejects outright.
    """
    for token in OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=True):
        BlacklistedToken.objects.get_or_create(token=token)
