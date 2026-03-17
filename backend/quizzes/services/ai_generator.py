import json
import anthropic
from django.conf import settings


def generate_quiz_questions(
    topic: str,
    subject: str = "",
    num_questions: int = 10,
    difficulty: str = "medium",
    question_types: list | None = None,
) -> list:
    """
    Call the Anthropic API to generate quiz questions.

    Returns a list of question dicts:
    [
        {
            "type": "mcq" | "true_false",
            "question_text": "...",
            "options": [{"text": "...", "is_correct": bool}, ...],
            "explanation": "..."
        },
        ...
    ]
    """
    if question_types is None:
        question_types = ["mcq", "true_false"]

    types_desc = " and ".join(
        {"mcq": "Multiple Choice (4 options, exactly 1 correct)", "true_false": "True/False (2 options)"}.get(t, t)
        for t in question_types
    )

    prompt = f"""You are an expert teacher creating a quiz for a student.

Generate exactly {num_questions} quiz questions about the topic: "{topic}"
{f'Subject area: {subject}' if subject else ''}
Difficulty level: {difficulty}
Question types to include: {types_desc}

STRICT RULES:
- MCQ questions: exactly 4 options, exactly 1 marked is_correct=true
- True/False questions: exactly 2 options ("True" and "False"), exactly 1 marked is_correct=true
- Mix the question types proportionally if both are requested
- Vary the difficulty across questions
- Write clear, unambiguous questions appropriate for the difficulty level
- Explanations should be 1-2 sentences explaining why the correct answer is right

Respond with ONLY valid JSON — no markdown, no code blocks, no extra text:
{{
  "questions": [
    {{
      "type": "mcq",
      "question_text": "...",
      "options": [
        {{"text": "...", "is_correct": false}},
        {{"text": "...", "is_correct": true}},
        {{"text": "...", "is_correct": false}},
        {{"text": "...", "is_correct": false}}
      ],
      "explanation": "..."
    }},
    {{
      "type": "true_false",
      "question_text": "...",
      "options": [
        {{"text": "True", "is_correct": true}},
        {{"text": "False", "is_correct": false}}
      ],
      "explanation": "..."
    }}
  ]
}}"""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if the model wraps the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    data = json.loads(raw)
    return data["questions"]
