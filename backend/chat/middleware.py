from channels.middleware import BaseMiddleware


class JWTAuthMiddleware(BaseMiddleware):
    """JWT authentication middleware for WebSocket connections.
    Full implementation in Phase 4.
    """
    async def __call__(self, scope, receive, send):
        # Placeholder - full implementation added in Phase 4 (chat feature)
        return await super().__call__(scope, receive, send)
