"""Claude adapter for BaseChatProvider, using the official `anthropic` SDK."""
from __future__ import annotations

import base64
import logging
from typing import Any, AsyncIterator

import anthropic
import pydantic

from ai_services.providers.base import (
    AIProviderError,
    Attachment,
    BaseChatProvider,
    ChatReply,
    ChatTurn,
    Effort,
    SafeguardingSignal,
    SchemaT,
    StreamEvent,
    StructuredResult,
    SystemPrompt,
    TextResult,
    TokenUsage,
)

logger = logging.getLogger(__name__)

# On a policy decline the API retries the request on a fallback model inside the same call.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

TUTOR_MAX_TOKENS = 16_000
TOOL_MAX_TOKENS = 16_000
# A tutor turn needs at most one safeguarding call before the reply, so a small bound is
# plenty; it also caps cost if the model keeps calling the tool.
MAX_TUTOR_ROUNDS = 3

SAFEGUARDING_TOOL: dict[str, Any] = {
    "name": "flag_safeguarding_concern",
    "description": (
        "Alert the student's teacher and the agency's staff that this student may be at risk "
        "and needs a trusted adult to follow up. Use it only for genuine safety concerns: "
        "self-harm or suicidal thoughts, abuse or neglect, someone making them feel unsafe, "
        "serious bullying, or a medical emergency. Do not use it for ordinary study stress or "
        "exam nerves. After calling it, carry on with your reply to the student."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "reason": {
                "type": "string",
                "description": "One or two sentences for staff describing what the student said.",
            },
            "severity": {
                "type": "string",
                "enum": ["low", "high"],
                "description": "high if the student may be in immediate danger, otherwise low.",
            },
        },
        "required": ["reason", "severity"],
        "additionalProperties": False,
    },
    # Stream tool input as it is generated; the input is validated below before it is used.
    "eager_input_streaming": True,
}


def _attachment_block(attachment: Attachment) -> dict[str, Any]:
    if attachment.kind == "image":
        return {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": attachment.media_type,
                "data": base64.standard_b64encode(attachment.data).decode("ascii"),
            },
        }
    if attachment.kind == "pdf":
        source = {
            "type": "base64",
            "media_type": "application/pdf",
            "data": base64.standard_b64encode(attachment.data).decode("ascii"),
        }
    else:
        source = {"type": "text", "media_type": "text/plain", "data": attachment.data.decode("utf-8", "replace")}
    return {"type": "document", "source": source, "title": attachment.title}


def _user_content(text: str, attachments: tuple[Attachment, ...]) -> str | list[dict[str, Any]]:
    if not attachments:
        return text
    # Files go before the question that refers to them.
    return [*(_attachment_block(a) for a in attachments), {"type": "text", "text": text}]


def _system_blocks(system: SystemPrompt) -> list[dict[str, Any]]:
    blocks = [{"type": "text", "text": system.stable}]
    if system.context:
        blocks.append({"type": "text", "text": system.context})
    return blocks


def _usage(message: Any, model: str) -> TokenUsage:
    usage = message.usage
    return TokenUsage(
        model=getattr(message, "model", None) or model,
        input_tokens=usage.input_tokens or 0,
        output_tokens=usage.output_tokens or 0,
        cache_creation_input_tokens=getattr(usage, "cache_creation_input_tokens", None) or 0,
        cache_read_input_tokens=getattr(usage, "cache_read_input_tokens", None) or 0,
        request_id=getattr(message, "_request_id", None) or "",
    )


def _parse_signal(tool_input: Any) -> SafeguardingSignal | None:
    if not isinstance(tool_input, dict):
        return None
    reason, severity = tool_input.get("reason"), tool_input.get("severity")
    if not isinstance(reason, str) or not reason.strip() or severity not in ("low", "high"):
        return None
    return SafeguardingSignal(reason=reason.strip()[:2000], severity=severity)


def _provider_error(error: Exception) -> AIProviderError:
    """Map SDK exceptions (most specific first) to a message the user can act on."""
    if isinstance(error, anthropic.BadRequestError):
        logger.warning("Claude rejected the request: %s", error)
        return AIProviderError("The AI couldn't process this request. If a file is attached, try a smaller or different file.")
    if isinstance(error, anthropic.RateLimitError):
        return AIProviderError("The AI assistant is busy right now. Please try again in a minute.")
    if isinstance(error, (anthropic.AuthenticationError, anthropic.PermissionDeniedError)):
        logger.error("Claude credentials were rejected: %s", error)
        return AIProviderError()
    if isinstance(error, anthropic.APIStatusError):
        logger.warning("Claude API error %s: %s", error.status_code, error)
        return AIProviderError()
    logger.warning("Could not reach the Claude API: %s", error)
    return AIProviderError()


class AnthropicProvider(BaseChatProvider):
    def __init__(self, *, api_key: str, model: str):
        self.model = model
        self._api_key = api_key
        self._async_client: anthropic.AsyncAnthropic | None = None
        # Teacher tools run inside a synchronous request, so give up sooner than the SDK's
        # 10-minute default.
        self._client = anthropic.Anthropic(api_key=api_key, timeout=180.0)

    @property
    def _aclient(self) -> anthropic.AsyncAnthropic:
        # Created lazily so it binds to the event loop that serves the streaming response.
        if self._async_client is None:
            self._async_client = anthropic.AsyncAnthropic(api_key=self._api_key)
        return self._async_client

    async def stream_tutor_reply(self, *, system: SystemPrompt, turns: list[ChatTurn]) -> AsyncIterator[StreamEvent]:
        messages: list[dict[str, Any]] = [
            {"role": t.role, "content": _user_content(t.text, t.attachments) if t.role == "user" else t.text}
            for t in turns
        ]
        usage = TokenUsage(model=self.model)
        text_parts: list[str] = []
        signals: list[SafeguardingSignal] = []
        refused = False

        try:
            for _ in range(MAX_TUTOR_ROUNDS):
                separate_round = bool(text_parts)
                async with self._aclient.beta.messages.stream(
                    model=self.model,
                    max_tokens=TUTOR_MAX_TOKENS,
                    system=_system_blocks(system),
                    messages=messages,
                    tools=[SAFEGUARDING_TOOL],
                    # Chat: low effort keeps replies quick; thinking is skipped on simple turns.
                    output_config={"effort": "low"},
                    # Caches the system prompt, any attached file and the history so far.
                    cache_control={"type": "ephemeral"},
                    betas=[FALLBACK_BETA],
                    fallbacks="default",
                ) as stream:
                    async for event in stream:
                        if event.type == "text" and event.text:
                            if separate_round:
                                separate_round = False
                                text_parts.append("\n\n")
                                yield StreamEvent(type="text", text="\n\n")
                            text_parts.append(event.text)
                            yield StreamEvent(type="text", text=event.text)
                    message = await stream.get_final_message()

                usage.add(_usage(message, self.model))
                if message.stop_reason == "refusal":
                    refused = True
                    break
                tool_uses = [b for b in message.content if b.type == "tool_use"]
                if message.stop_reason != "tool_use" or not tool_uses:
                    break  # end_turn, or max_tokens (a truncated tool call is not run)

                results = []
                for block in tool_uses:
                    signal = _parse_signal(block.input) if block.name == SAFEGUARDING_TOOL["name"] else None
                    if signal is None:
                        results.append({
                            "type": "tool_result", "tool_use_id": block.id, "is_error": True,
                            "content": "Invalid call. Expected flag_safeguarding_concern with a non-empty "
                                       "'reason' and 'severity' of 'low' or 'high'.",
                        })
                        continue
                    signals.append(signal)
                    yield StreamEvent(type="signal", signal=signal)
                    results.append({
                        "type": "tool_result", "tool_use_id": block.id,
                        "content": "Recorded; staff will follow up. Now continue your reply to the student.",
                    })
                # Pass the assistant turn back unchanged (thinking blocks included), then the results.
                messages.append({"role": "assistant", "content": message.content})
                messages.append({"role": "user", "content": results})
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as error:
            raise _provider_error(error) from error

        yield StreamEvent(
            type="done",
            reply=ChatReply(text="".join(text_parts).strip(), usage=usage, refused=refused, signals=signals),
        )

    def generate_structured(
        self, *, system: SystemPrompt, prompt: str, attachments: tuple[Attachment, ...],
        schema: type[SchemaT], effort: Effort,
    ) -> StructuredResult[SchemaT]:
        try:
            response = self._client.beta.messages.parse(
                model=self.model,
                max_tokens=TOOL_MAX_TOKENS,
                system=_system_blocks(system),
                messages=[{"role": "user", "content": _user_content(prompt, attachments)}],
                output_format=schema,
                output_config={"effort": effort},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as error:
            raise _provider_error(error) from error

        usage = _usage(response, self.model)
        if response.stop_reason == "refusal":
            return StructuredResult(parsed=None, usage=usage, refused=True)
        try:
            parsed = response.parsed_output
        except (pydantic.ValidationError, ValueError):
            parsed = None  # e.g. cut off at max_tokens
        return StructuredResult(parsed=parsed, usage=usage)

    def generate_text(
        self, *, system: SystemPrompt, prompt: str, attachments: tuple[Attachment, ...], effort: Effort,
    ) -> TextResult:
        try:
            response = self._client.beta.messages.create(
                model=self.model,
                max_tokens=TOOL_MAX_TOKENS,
                system=_system_blocks(system),
                messages=[{"role": "user", "content": _user_content(prompt, attachments)}],
                output_config={"effort": effort},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as error:
            raise _provider_error(error) from error

        usage = _usage(response, self.model)
        if response.stop_reason == "refusal":
            return TextResult(text="", usage=usage, refused=True)
        text = "".join(block.text for block in response.content if block.type == "text").strip()
        return TextResult(text=text, usage=usage)
