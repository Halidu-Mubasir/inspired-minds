"""The Claude adapter against a fake SDK client: request shape, the safeguarding tool loop,
refusals and error mapping. No network calls."""
import asyncio
from types import SimpleNamespace

import anthropic
import httpx2
from django.test import SimpleTestCase

from ai_services.providers import AIProviderError, Attachment, ChatTurn, SystemPrompt
from ai_services.providers.anthropic_provider import FALLBACK_BETA, SAFEGUARDING_TOOL, AnthropicProvider
from ai_services.schemas import QuestionSet

USAGE = SimpleNamespace(input_tokens=50, output_tokens=10, cache_creation_input_tokens=5, cache_read_input_tokens=40)


def text_block(text):
    return SimpleNamespace(type="text", text=text)


def tool_block(tool_input, block_id="toolu_1"):
    return SimpleNamespace(type="tool_use", id=block_id, name=SAFEGUARDING_TOOL["name"], input=tool_input)


def message(content, stop_reason="end_turn"):
    return SimpleNamespace(content=content, stop_reason=stop_reason, usage=USAGE, model="claude-sonnet-5-5")


class FakeStream:
    def __init__(self, final):
        self.final = final

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def __aiter__(self):
        return self._events()

    async def _events(self):
        for block in self.final.content:
            if block.type == "text":
                yield SimpleNamespace(type="text", text=block.text)

    async def get_final_message(self):
        return self.final


class FakeMessages:
    """Records each request's kwargs (copied, since the provider mutates `messages`)."""

    def __init__(self, finals=(), error=None):
        self.finals, self.error, self.requests = list(finals), error, []

    def stream(self, **kwargs):
        self.requests.append({**kwargs, "messages": list(kwargs["messages"])})
        if self.error:
            raise self.error
        return FakeStream(self.finals.pop(0))

    def parse(self, **kwargs):
        self.requests.append(kwargs)
        return self.finals.pop(0)

    def create(self, **kwargs):
        self.requests.append(kwargs)
        return self.finals.pop(0)


def provider_with(messages: FakeMessages) -> AnthropicProvider:
    provider = AnthropicProvider(api_key="test-key", model="claude-sonnet-5-5")
    client = SimpleNamespace(beta=SimpleNamespace(messages=messages))
    provider._async_client = client
    provider._client = client
    return provider


def run_stream(provider, turns):
    async def collect():
        return [event async for event in provider.stream_tutor_reply(system=SystemPrompt(stable="S", context="C"), turns=turns)]
    return asyncio.run(collect())


class TutorStreamTests(SimpleTestCase):
    def test_plain_reply_and_request_shape(self):
        fake = FakeMessages([message([text_block("Try factorising.")])])
        attachment = Attachment(kind="pdf", media_type="application/pdf", data=b"%PDF", title="Paper")
        events = run_stream(provider_with(fake), [ChatTurn(role="user", text="Q1?", attachments=(attachment,))])

        self.assertEqual([e.type for e in events], ["text", "done"])
        reply = events[-1].reply
        self.assertEqual(reply.text, "Try factorising.")
        self.assertEqual((reply.usage.input_tokens, reply.usage.cache_read_input_tokens), (50, 40))

        request = fake.requests[0]
        self.assertEqual(request["model"], "claude-sonnet-5-5")
        self.assertEqual(request["output_config"], {"effort": "low"})
        self.assertEqual((request["fallbacks"], request["betas"]), ("default", [FALLBACK_BETA]))
        self.assertEqual(request["cache_control"], {"type": "ephemeral"})
        self.assertEqual([b["text"] for b in request["system"]], ["S", "C"])
        content = request["messages"][0]["content"]
        self.assertEqual(content[0]["type"], "document")  # file before the question
        self.assertEqual(content[0]["source"]["media_type"], "application/pdf")
        self.assertEqual(content[1], {"type": "text", "text": "Q1?"})
        self.assertNotIn("thinking", request)  # adaptive (the default) at low effort

    def test_safeguarding_call_is_reported_then_reply_continues(self):
        first = message([tool_block({"reason": "Mentions being hurt at home.", "severity": "high"})], "tool_use")
        fake = FakeMessages([first, message([text_block("Please talk to a trusted adult.")])])
        events = run_stream(provider_with(fake), [ChatTurn(role="user", text="...")])

        self.assertEqual([e.type for e in events], ["signal", "text", "done"])
        self.assertEqual(events[0].signal.severity, "high")
        reply = events[-1].reply
        self.assertEqual(len(reply.signals), 1)
        self.assertEqual(reply.usage.input_tokens, 100)  # both rounds counted

        followup = fake.requests[1]["messages"]
        self.assertIs(followup[1]["content"], first.content)  # assistant turn passed back unchanged
        self.assertEqual(followup[2]["content"][0]["tool_use_id"], "toolu_1")
        self.assertNotIn("is_error", followup[2]["content"][0])

    def test_invalid_tool_input_gets_an_error_result_and_no_signal(self):
        fake = FakeMessages([
            message([tool_block({"reason": "", "severity": "urgent"})], "tool_use"),
            message([text_block("OK.")]),
        ])
        events = run_stream(provider_with(fake), [ChatTurn(role="user", text="...")])
        self.assertNotIn("signal", [e.type for e in events])
        self.assertTrue(fake.requests[1]["messages"][2]["content"][0]["is_error"])

    def test_tool_loop_is_bounded(self):
        looping = [message([tool_block({"reason": "x", "severity": "low"}, f"t{i}")], "tool_use") for i in range(5)]
        fake = FakeMessages(looping)
        run_stream(provider_with(fake), [ChatTurn(role="user", text="...")])
        self.assertEqual(len(fake.requests), 3)

    def test_refusal(self):
        fake = FakeMessages([message([], "refusal")])
        reply = run_stream(provider_with(fake), [ChatTurn(role="user", text="...")])[-1].reply
        self.assertTrue(reply.refused)

    def test_api_errors_become_provider_errors(self):
        request = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")
        for error, expected in [
            (anthropic.RateLimitError("slow down", response=httpx2.Response(429, request=request), body=None), "busy"),
            (anthropic.APIConnectionError(request=request), "unavailable"),
        ]:
            with self.subTest(error=type(error).__name__):
                with self.assertRaises(AIProviderError) as raised:
                    run_stream(provider_with(FakeMessages(error=error)), [ChatTurn(role="user", text="...")])
                self.assertIn(expected, raised.exception.user_message)


class ToolRequestTests(SimpleTestCase):
    def test_structured_request_and_refusal(self):
        parsed = SimpleNamespace(stop_reason="end_turn", usage=USAGE, model="claude-sonnet-5-5",
                                 parsed_output=QuestionSet(title="T", questions=[]))
        refused = SimpleNamespace(stop_reason="refusal", usage=USAGE, model="claude-sonnet-5-5", parsed_output=None)
        fake = FakeMessages([parsed, refused])
        provider = provider_with(fake)
        kwargs = dict(system=SystemPrompt(stable="S"), prompt="Write 3", attachments=(), schema=QuestionSet, effort="medium")

        result = provider.generate_structured(**kwargs)
        self.assertEqual(result.parsed.title, "T")
        request = fake.requests[0]
        self.assertIs(request["output_format"], QuestionSet)
        self.assertEqual(request["output_config"], {"effort": "medium"})
        self.assertEqual(request["fallbacks"], "default")

        self.assertTrue(provider.generate_structured(**kwargs).refused)

    def test_text_request_reads_text_blocks_only(self):
        response = message([SimpleNamespace(type="thinking", thinking=""), text_block("## Summary")])
        result = provider_with(FakeMessages([response])).generate_text(
            system=SystemPrompt(stable="S"), prompt="Summarise", attachments=(), effort="low"
        )
        self.assertEqual(result.text, "## Summary")
