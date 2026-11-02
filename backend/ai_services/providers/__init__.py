from functools import lru_cache

from django.conf import settings

from ai_services.providers.base import (
    AIError,
    AINotConfigured,
    AIProviderError,
    Attachment,
    BaseChatProvider,
    ChatReply,
    ChatTurn,
    SafeguardingSignal,
    StreamEvent,
    StructuredResult,
    SystemPrompt,
    TextResult,
    TokenUsage,
)


@lru_cache(maxsize=1)
def _build_provider(name: str, model: str, api_key: str) -> BaseChatProvider:
    if name == "anthropic":
        if not api_key:
            raise AINotConfigured()
        from ai_services.providers.anthropic_provider import AnthropicProvider
        return AnthropicProvider(api_key=api_key, model=model)
    raise AINotConfigured(f"Unknown AI_PROVIDER {name!r}.")


def get_provider() -> BaseChatProvider:
    """The configured provider. Raises AINotConfigured when no credentials are set."""
    return _build_provider(settings.AI_PROVIDER, settings.AI_MODEL, settings.ANTHROPIC_API_KEY)


__all__ = [
    "get_provider",
    "AIError",
    "AINotConfigured",
    "AIProviderError",
    "Attachment",
    "BaseChatProvider",
    "ChatReply",
    "ChatTurn",
    "SafeguardingSignal",
    "StreamEvent",
    "StructuredResult",
    "SystemPrompt",
    "TextResult",
    "TokenUsage",
]
