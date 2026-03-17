import anthropic
from django.conf import settings

SYSTEM_PROMPTS = {
    "general_chat": (
        "You are a friendly, knowledgeable AI tutor helping a student learn. "
        "Give clear, encouraging answers. Break down complex topics step by step. "
        "Use examples where helpful. Keep your tone supportive and patient."
    ),
    "question_generator": (
        "You are an experienced teacher. When given a topic, subject, level, and count, "
        "generate that many clear, well-structured educational questions. "
        "Number each question. After each question, write 'Answer:' followed by the correct answer. "
        "Keep questions appropriate for the specified level."
    ),
    "note_summarizer": (
        "You are an expert at summarizing educational material. "
        "Produce a concise, well-structured summary with key points clearly highlighted. "
        "Use bullet points and short paragraphs. Preserve all important facts and concepts."
    ),
    "problem_solver": (
        "You are a patient tutor who solves problems step by step. "
        "Show your full reasoning at each step. "
        "After the solution, briefly explain the key concept or formula used. "
        "Use clear, simple language."
    ),
}


def get_ai_response(
    conversation_type: str,
    messages_history: list[dict],
    custom_system_prompt: str = "",
) -> dict:
    """
    Call the Anthropic API with the given conversation history.

    Args:
        conversation_type: one of general_chat, question_generator, note_summarizer, problem_solver
        messages_history: list of {"role": "user"|"assistant", "content": str}
        custom_system_prompt: overrides the default system prompt if provided

    Returns:
        {"content": str, "input_tokens": int, "output_tokens": int}
    """
    system = custom_system_prompt or SYSTEM_PROMPTS.get(
        conversation_type, SYSTEM_PROMPTS["general_chat"]
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=4096,
        system=system,
        messages=messages_history,
    )

    return {
        "content": response.content[0].text,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }
