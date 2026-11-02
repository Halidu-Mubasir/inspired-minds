"""Daily per-user caps on AI requests, counted from AIUsage records."""
from __future__ import annotations

from datetime import datetime, time

from django.conf import settings
from django.utils import timezone

from ai_services.models import AIFeature, AIUsage

TUTOR = "tutor"
TEACHER_TOOLS = "teacher_tools"

_FEATURES = {
    TUTOR: [AIFeature.TUTOR],
    TEACHER_TOOLS: [AIFeature.QUESTIONS, AIFeature.SUMMARY],
}


class QuotaExceeded(Exception):
    def __init__(self, limit: int):
        self.limit = limit
        super().__init__(f"Daily limit of {limit} reached.")


def daily_limit(group: str) -> int:
    return settings.AI_DAILY_TUTOR_MESSAGES if group == TUTOR else settings.AI_DAILY_TEACHER_TOOL_RUNS


def _today_start() -> datetime:
    # Midnight in the site's time zone (Africa/Accra), not UTC.
    return timezone.make_aware(datetime.combine(timezone.localdate(), time.min))


def _usage_today(user, group: str):
    return AIUsage.objects.filter(user=user, feature__in=_FEATURES[group], created_at__gte=_today_start())


def used_today(user, group: str) -> int:
    return _usage_today(user, group).count()


async def aused_today(user, group: str) -> int:
    return await _usage_today(user, group).acount()


def check_quota(user, group: str) -> None:
    limit = daily_limit(group)
    if used_today(user, group) >= limit:
        raise QuotaExceeded(limit)


def quota_summary(user, group: str) -> dict:
    limit = daily_limit(group)
    used = used_today(user, group)
    return {"used": used, "limit": limit, "remaining": max(0, limit - used)}
