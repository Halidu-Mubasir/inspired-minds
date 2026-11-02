from rest_framework import status
from rest_framework.response import Response

from ai_services import quotas
from ai_services.models import AIUsage
from ai_services.providers import AIError, AINotConfigured, TokenUsage

REFUSAL_REPLY = (
    "I can't help with that one, but I'm happy to help with your schoolwork. "
    "What are you studying at the moment?"
)
EMPTY_REPLY = "Sorry, I didn't manage to write a reply. Could you ask that again?"


def error_response(error: AIError) -> Response:
    code = status.HTTP_503_SERVICE_UNAVAILABLE if isinstance(error, AINotConfigured) else status.HTTP_502_BAD_GATEWAY
    return Response({"detail": error.user_message}, status=code)


def quota_response(exceeded: quotas.QuotaExceeded, what: str) -> Response:
    return Response(
        {"detail": f"You've used all {exceeded.limit} {what} for today. They reset at midnight."},
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


def usage_fields(user, feature: str, usage: TokenUsage, refused: bool) -> dict:
    return {
        "user": user,
        "feature": feature,
        "model": usage.model,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_creation_input_tokens": usage.cache_creation_input_tokens,
        "cache_read_input_tokens": usage.cache_read_input_tokens,
        "refused": refused,
        "request_id": usage.request_id,
    }


def record_usage(user, feature: str, usage: TokenUsage, refused: bool = False) -> AIUsage:
    return AIUsage.objects.create(**usage_fields(user, feature, usage, refused))
