from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _get_user_from_token(token_str):
    if not token_str:
        return AnonymousUser()
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(token_str)
        User = get_user_model()
        return User.objects.get(id=token["user_id"])
    except Exception:
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
