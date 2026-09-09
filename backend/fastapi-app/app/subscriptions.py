"""Subscription term helpers and runtime truth."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models import User

PREPAID_SUBSCRIPTION_DURATIONS = {
    "3_month": timedelta(days=90),
    "12_month": timedelta(days=365),
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def build_subscription_expiry(
    tier: str | None,
    *,
    activated_at: datetime | None = None,
) -> datetime | None:
    duration = PREPAID_SUBSCRIPTION_DURATIONS.get(str(tier or "").strip())
    if duration is None:
        return None
    start = normalize_datetime(activated_at) or utc_now()
    return start + duration


def user_has_active_subscription(
    user: User,
    *,
    now: datetime | None = None,
) -> bool:
    if not user.subscription_active:
        return False

    tier = str(user.subscription_tier or "").strip()
    if tier not in PREPAID_SUBSCRIPTION_DURATIONS:
        return True

    expires_at = normalize_datetime(user.subscription_expires_at)
    if expires_at is None:
        return False

    current_time = normalize_datetime(now) or utc_now()
    return expires_at > current_time


def sync_subscription_state(
    user: User,
    *,
    now: datetime | None = None,
) -> bool:
    active = user_has_active_subscription(user, now=now)
    if user.subscription_active != active:
        user.subscription_active = active
    return active
