"""Structured-output schemas the model's answers must validate against."""
from typing import Literal

from pydantic import BaseModel, Field


class GeneratedQuestion(BaseModel):
    question: str = Field(description="The question as the student will read it.")
    type: Literal["multiple_choice", "short_answer", "structured"]
    options: list[str] = Field(description="Exactly four options for multiple choice; empty otherwise.")
    answer: str = Field(description="The correct answer (the full text of the correct option for multiple choice).")
    explanation: str = Field(description="Worked reasoning or a marking guide for the teacher.")
    marks: int = Field(description="Suggested marks for the question.")


class QuestionSet(BaseModel):
    title: str = Field(description="A short title for the question set.")
    questions: list[GeneratedQuestion]
