from decimal import Decimal

from django.db import models
from setup.base_model import BaseModel

# USD per million tokens: (input, output, 5-minute cache write, cache read). Used only for the
# estimate shown in Django admin; check current pricing before relying on it for billing.
MODEL_PRICING_PER_MTOK = {
    "claude-sonnet-5-5": (Decimal("2"), Decimal("10"), Decimal("2.50"), Decimal("0.20")),
}


class AIFeature(models.TextChoices):
    TUTOR = "tutor", "Student tutor"
    QUESTIONS = "questions", "Question generator"
    SUMMARY = "summary", "Notes summariser"


class AIUsage(BaseModel):
    """One model request (a tutor reply or a teacher tool run). Drives the daily caps."""
    user = models.ForeignKey(
        "users.CustomUser", on_delete=models.SET_NULL, null=True, related_name="ai_usage"
    )
    feature = models.CharField(max_length=20, choices=AIFeature.choices)
    model = models.CharField(max_length=100)
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    cache_creation_input_tokens = models.PositiveIntegerField(default=0)
    cache_read_input_tokens = models.PositiveIntegerField(default=0)
    refused = models.BooleanField(default=False)
    request_id = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "feature", "created_at"])]

    def __str__(self):
        return f"{self.get_feature_display()} · {self.model}"

    @property
    def estimated_cost_usd(self) -> Decimal | None:
        prices = MODEL_PRICING_PER_MTOK.get(self.model)
        if prices is None:
            return None
        input_price, output_price, cache_write_price, cache_read_price = prices
        total = (
            self.input_tokens * input_price
            + self.output_tokens * output_price
            + self.cache_creation_input_tokens * cache_write_price
            + self.cache_read_input_tokens * cache_read_price
        )
        return (total / Decimal(1_000_000)).quantize(Decimal("0.0001"))


class AIGeneration(BaseModel):
    """A saved teacher tool result (question set or summary) the teacher can come back to."""
    created_by = models.ForeignKey(
        "users.CustomUser", on_delete=models.SET_NULL, null=True, related_name="ai_generations"
    )
    kind = models.CharField(max_length=20, choices=[(AIFeature.QUESTIONS, "Questions"), (AIFeature.SUMMARY, "Summary")])
    title = models.CharField(max_length=255)
    # What the teacher asked for (subject, topic, level, counts...).
    params = models.JSONField(default=dict)
    # Questions: {"title", "questions": [...]}; summaries: {"markdown": "..."}.
    output = models.JSONField(default=dict)
    lesson = models.ForeignKey(
        "lessons.Lesson", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_generations"
    )
    resource = models.ForeignKey(
        "resources.Resource", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_generations"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
