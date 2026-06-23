"""Tests for app.subscriptions — subscription term helpers."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from app.subscriptions import (
    PREPAID_SUBSCRIPTION_DURATIONS,
    build_subscription_expiry,
    normalize_datetime,
    sync_subscription_state,
    user_has_active_subscription,
    utc_now,
)


class TestUtcNow:
    def test_returns_utc_datetime(self):
        now = utc_now()
        assert isinstance(now, datetime)
        assert now.tzinfo is not None


class TestNormalizeDatetime:
    def test_none(self):
        assert normalize_datetime(None) is None

    def test_not_datetime(self):
        assert normalize_datetime("not a datetime") is None

    def test_naive_gets_utc(self):
        naive = datetime(2026, 1, 1, 12, 0, 0)
        result = normalize_datetime(naive)
        assert result.tzinfo == timezone.utc

    def test_aware_preserved(self):
        aware = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        result = normalize_datetime(aware)
        assert result == aware


class TestPrepaidDurations:
    def test_three_month(self):
        assert PREPAID_SUBSCRIPTION_DURATIONS["3_month"] == timedelta(days=90)

    def test_twelve_month(self):
        assert PREPAID_SUBSCRIPTION_DURATIONS["12_month"] == timedelta(days=365)


class TestBuildSubscriptionExpiry:
    def test_known_tier(self):
        start = datetime(2026, 6, 1, tzinfo=timezone.utc)
        result = build_subscription_expiry("3_month", activated_at=start)
        assert result == start + timedelta(days=90)

    def test_twelve_month(self):
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        result = build_subscription_expiry("12_month", activated_at=start)
        assert result == start + timedelta(days=365)

    def test_unknown_tier_returns_none(self):
        assert build_subscription_expiry("weekly") is None

    def test_none_tier(self):
        assert build_subscription_expiry(None) is None

    def test_no_activated_at_uses_now(self):
        result = build_subscription_expiry("3_month")
        assert result is not None
        assert result > utc_now()


class TestUserHasActiveSubscription:
    def _user(self, active=True, tier="3_month", expires_at=None):
        u = MagicMock()
        u.subscription_active = active
        u.subscription_tier = tier
        u.subscription_expires_at = expires_at
        return u

    def test_inactive_user(self):
        u = self._user(active=False)
        assert user_has_active_subscription(u) is False

    def test_active_non_prepaid(self):
        u = self._user(active=True, tier="free")
        assert user_has_active_subscription(u) is True

    def test_active_prepaid_not_expired(self):
        future = utc_now() + timedelta(days=30)
        u = self._user(active=True, tier="3_month", expires_at=future)
        assert user_has_active_subscription(u) is True

    def test_active_prepaid_expired(self):
        past = utc_now() - timedelta(days=1)
        u = self._user(active=True, tier="3_month", expires_at=past)
        assert user_has_active_subscription(u) is False

    def test_active_prepaid_no_expiry(self):
        u = self._user(active=True, tier="3_month", expires_at=None)
        assert user_has_active_subscription(u) is False


class TestSyncSubscriptionState:
    def test_syncs_to_inactive(self):
        past = utc_now() - timedelta(days=1)
        u = MagicMock()
        u.subscription_active = True
        u.subscription_tier = "3_month"
        u.subscription_expires_at = past
        result = sync_subscription_state(u)
        assert result is False
        assert u.subscription_active is False

    def test_stays_active(self):
        future = utc_now() + timedelta(days=30)
        u = MagicMock()
        u.subscription_active = True
        u.subscription_tier = "3_month"
        u.subscription_expires_at = future
        result = sync_subscription_state(u)
        assert result is True
