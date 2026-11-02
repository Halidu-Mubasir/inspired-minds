"""Provider-neutral interface for the AI features. Views and services depend on these types
only; each provider adapter (e.g. anthropic_provider) translates them to its own API."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator, Generic, Literal, TypeVar

from pydantic import BaseModel

SchemaT = TypeVar("SchemaT", bound=BaseModel)
Effort = Literal["low", "medium", "high"]


class AIError(Exception):
    """Base class for AI failures the views turn into user-facing messages."""

    user_message = "The AI assistant is unavailable right now. Please try again shortly."

    def __init__(self, user_message: str | None = None):
        if user_message:
            self.user_message = user_message
        super().__init__(self.user_message)


class AINotConfigured(AIError):
    user_message = "AI features haven't been set up for this site yet."


class AIProviderError(AIError):
    """The provider failed (network, rate limit, server error, rejected request)."""


@dataclass(frozen=True)
class Attachment:
    """A file passed to the model alongside a message."""
    kind: Literal["pdf", "image", "text"]
    media_type: str
    data: bytes
    title: str


@dataclass(frozen=True)
class ChatTurn:
    role: Literal["user", "assistant"]
    text: str
    attachments: tuple[Attachment, ...] = ()


@dataclass(frozen=True)
class SystemPrompt:
    """`stable` never varies between requests (so providers can cache it); `context` is
    per-user or per-conversation detail appended after it."""
    stable: str
    context: str = ""


@dataclass
class TokenUsage:
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cache_creation_input_tokens: int = 0
    cache_read_input_tokens: int = 0
    request_id: str = ""

    def add(self, other: TokenUsage) -> None:
        self.input_tokens += other.input_tokens
        self.output_tokens += other.output_tokens
        self.cache_creation_input_tokens += other.cache_creation_input_tokens
        self.cache_read_input_tokens += other.cache_read_input_tokens
        self.request_id = other.request_id or self.request_id


@dataclass(frozen=True)
class SafeguardingSignal:
    """The model asked for a member of staff to follow up on the conversation."""
    reason: str
    severity: Literal["low", "high"]


@dataclass
class ChatReply:
    text: str
    usage: TokenUsage
    refused: bool = False
    signals: list[SafeguardingSignal] = field(default_factory=list)


@dataclass(frozen=True)
class StreamEvent:
    """`text`: a chunk of the reply; `signal`: a safeguarding signal; `done`: the final reply."""
    type: Literal["text", "signal", "done"]
    text: str = ""
    signal: SafeguardingSignal | None = None
    reply: ChatReply | None = None


@dataclass
class StructuredResult(Generic[SchemaT]):
    parsed: SchemaT | None  # None when the model refused or the output was cut off
    usage: TokenUsage
    refused: bool = False


@dataclass
class TextResult:
    text: str
    usage: TokenUsage
    refused: bool = False


class BaseChatProvider(ABC):
    """One implementation per AI vendor. All methods raise AIProviderError on failure."""

    model: str

    @abstractmethod
    def stream_tutor_reply(self, *, system: SystemPrompt, turns: list[ChatTurn]) -> AsyncIterator[StreamEvent]:
        """Stream the tutor's next reply to `turns` (oldest first, ending with the student).

        Yields `text` events as the reply is written, a `signal` event whenever the model
        raises a safeguarding concern, and exactly one final `done` event with the full reply
        and token usage across every request the turn needed.
        """

    @abstractmethod
    def generate_structured(
        self, *, system: SystemPrompt, prompt: str, attachments: tuple[Attachment, ...],
        schema: type[SchemaT], effort: Effort,
    ) -> StructuredResult[SchemaT]:
        """One request whose answer must validate against `schema`."""

    @abstractmethod
    def generate_text(
        self, *, system: SystemPrompt, prompt: str, attachments: tuple[Attachment, ...], effort: Effort,
    ) -> TextResult:
        """One request answered in Markdown text."""
