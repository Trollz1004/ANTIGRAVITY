"""Tests for app.webhook_retry — retry queue, backoff, dead-letter models."""

from datetime import datetime, timedelta, timezone

from app.webhook_retry import (
    BASE_BACKOFF_SECONDS,
    MAX_RETRIES,
    DeadLetterEntryResponse,
    RetryEnqueueResponse,
    RetryQueueEntryResponse,
    WebhookDeadLetter,
    WebhookRetryQueue,
    _compute_next_retry_time,
)


class TestConstants:
    def test_max_retries(self):
        assert MAX_RETRIES == 5

    def test_base_backoff(self):
        assert BASE_BACKOFF_SECONDS == 1


class TestComputeNextRetryTime:
    def test_first_retry(self):
        before = datetime.now(timezone.utc)
        result = _compute_next_retry_time(0)
        after = datetime.now(timezone.utc)
        # Retry 0 → delay = 1s * 2^0 = 1s
        assert result >= before + timedelta(seconds=1)
        assert result <= after + timedelta(seconds=2)

    def test_exponential_backoff(self):
        # retry_count=0 → 1s, 1 → 2s, 2 → 4s, 3 → 8s, 4 → 16s
        for count, expected_delay in [(0, 1), (1, 2), (2, 4), (3, 8), (4, 16)]:
            before = datetime.now(timezone.utc)
            result = _compute_next_retry_time(count)
            # Should be approximately now + expected_delay seconds
            assert result >= before + timedelta(seconds=expected_delay - 1)
            assert result <= before + timedelta(seconds=expected_delay + 2)


class TestWebhookRetryQueueModel:
    def test_tablename(self):
        assert WebhookRetryQueue.__tablename__ == "webhook_retry_queue"

    def test_columns(self):
        cols = {c.name for c in WebhookRetryQueue.__table__.columns}
        assert "id" in cols
        assert "event_id" in cols
        assert "event_type" in cols
        assert "retry_count" in cols
        assert "next_retry_at" in cols


class TestWebhookDeadLetterModel:
    def test_tablename(self):
        assert WebhookDeadLetter.__tablename__ == "webhook_dead_letter"

    def test_columns(self):
        cols = {c.name for c in WebhookDeadLetter.__table__.columns}
        assert "id" in cols
        assert "event_id" in cols
        assert "last_error" in cols


class TestResponseModels:
    def test_retry_queue_entry(self):
        resp = RetryQueueEntryResponse(
            id="abc",
            event_id="evt-1",
            event_type="payment.updated",
            retry_count=2,
            max_retries=5,
            next_retry_at="2026-06-01T00:00:00Z",
            created_at="2026-06-01T00:00:00Z",
            last_error=None,
        )
        assert resp.retry_count == 2

    def test_dead_letter_entry(self):
        resp = DeadLetterEntryResponse(
            id="abc",
            event_id="evt-2",
            event_type="booking.created",
            total_attempts=5,
            last_error="timeout",
            moved_at="2026-06-01T00:00:00Z",
        )
        assert resp.total_attempts == 5

    def test_retry_enqueue_response(self):
        resp = RetryEnqueueResponse(
            queue_id="q-1",
            event_id="evt-3",
            retry_count=0,
            next_retry_at="2026-06-01T00:01:00Z",
            status="queued",
        )
        assert resp.status == "queued"
