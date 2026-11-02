"""Test doubles: a scripted provider, so tests never call a real AI API."""
from __future__ import annotations

import warnings

from ai_services.providers import (
    AIProviderError,
    BaseChatProvider,
    ChatReply,
    SafeguardingSignal,
    StreamEvent,
    StructuredResult,
    TextResult,
    TokenUsage,
)


def usage(**counts) -> TokenUsage:
    return TokenUsage(model="claude-sonnet-5-5", input_tokens=100, output_tokens=20, request_id="req_test", **counts)


class FakeProvider(BaseChatProvider):
    model = "claude-sonnet-5-5"

    def __init__(self, *, chunks=("Let's ", "work it out."), refused=False, signals=(), fail=False,
                 structured=None, structured_refused=False, text="## Summary", text_refused=False):
        self.chunks, self.refused, self.signals, self.fail = list(chunks), refused, list(signals), fail
        self.structured, self.structured_refused = structured, structured_refused
        self.text, self.text_refused = text, text_refused
        self.calls: list[dict] = []

    async def stream_tutor_reply(self, *, system, turns):
        self.calls.append({"method": "stream_tutor_reply", "system": system, "turns": turns})
        if self.fail:
            raise AIProviderError("The AI assistant is busy right now. Please try again in a minute.")
        for chunk in self.chunks:
            yield StreamEvent(type="text", text=chunk)
        for signal in self.signals:
            yield StreamEvent(type="signal", signal=signal)
        yield StreamEvent(type="done", reply=ChatReply(
            text="" if self.refused else "".join(self.chunks), usage=usage(), refused=self.refused,
            signals=list(self.signals),
        ))

    def generate_structured(self, *, system, prompt, attachments, schema, effort):
        self.calls.append({"method": "generate_structured", "system": system, "prompt": prompt,
                           "attachments": attachments, "schema": schema, "effort": effort})
        if self.fail:
            raise AIProviderError()
        return StructuredResult(parsed=self.structured, usage=usage(), refused=self.structured_refused)

    def generate_text(self, *, system, prompt, attachments, effort):
        self.calls.append({"method": "generate_text", "system": system, "prompt": prompt,
                           "attachments": attachments, "effort": effort})
        return TextResult(text="" if self.text_refused else self.text, usage=usage(), refused=self.text_refused)


def concern(severity="high") -> SafeguardingSignal:
    return SafeguardingSignal(reason="Student said someone at home hurts them.", severity=severity)


def read_stream(response) -> list[dict]:
    """Consume an async streaming response from the sync test client into its JSON events."""
    import json
    with warnings.catch_warnings():
        # Django warns that a sync client consumes an async iterator; that's expected in tests.
        warnings.simplefilter("ignore")
        body = b"".join(response)
    return [json.loads(line) for line in body.decode().splitlines() if line.strip()]
