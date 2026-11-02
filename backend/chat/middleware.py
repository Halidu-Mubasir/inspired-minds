from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError


@database_sync_to_async
def _get_user_from_token(token_str):
    if not token_str:
        return AnonymousUser()
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import AccessToken
    User = get_user_model()
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token["user_id"], is_active=True)
    except (TokenError, KeyError, ValidationError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Authenticates WebSocket connections via JWT token in the query string.
    Usage: ws://host/ws/chat/{id}/?token=<access_token>
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_str = params.get("token", [None])[0]
        scope["user"] = await _get_user_from_token(token_str)
        return await super().__call__(scope, receive, send)
