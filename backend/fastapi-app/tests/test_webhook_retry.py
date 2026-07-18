"""Tests for webhook retry queue with exponential backoff."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.webhook_retry import (
    MAX_RETRIES,
    _compute_next_retry_time,
    enqueue_retry,
    get_dead_letter_entries,
    get_retry_queue_entries,
    manual_retry,
    process_retry_queue,
    WebhookDeadLetter,
    WebhookRetryQueue,
)


class TestComputeNextRetryTime:

    def test_exponential_backoff(self):
        now = datetime.now(timezone.utc)
        result = _compute_next_retry_time(0)
        assert result > now
        assert result <= now + timedelta(seconds=2)

        result_1 = _compute_next_retry_time(1)
        assert result_1 > now
        assert result_1 <= now + timedelta(seconds=3)

        result_4 = _compute_next_retry_time(4)
        assert result_4 > now
        assert result_4 <= now + timedelta(seconds=17)

    def test_retry_time_increases(self):
        t0 = _compute_next_retry_time(0)
        t1 = _compute_next_retry_time(1)
        t2 = _compute_next_retry_time(2)
        assert t0 < t1 < t2


def _mock_db():
    db = MagicMock()
    db.scalar = AsyncMock()
    db.scalars = AsyncMock()
    db.add = MagicMock()
    db.delete = AsyncMock()
    db.flush = AsyncMock()
    return db


def _make_scalars_result(entries):
    mock = MagicMock()
    mock.all.return_value = entries
    return mock


class TestEnqueueRetry:

    @pytest.mark.asyncio
    async def test_enqueue_new_entry(self):
        db = _mock_db()
        db.scalar.return_value = None

        entry = await enqueue_retry(
            db,
            event_id="evt_001",
            event_type="payment.updated",
            payload={"amount": 100},
            error_message="timeout",
        )

        assert entry.event_id == "evt_001"
        assert entry.retry_count == 0
        assert entry.last_error == "timeout"
        db.add.assert_called_once()
        db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_enqueue_existing_entry_increments_retry(self):
        existing = MagicMock(spec=WebhookRetryQueue)
        existing.event_id = "evt_001"
        existing.retry_count = 0
        existing.max_retries = MAX_RETRIES
        existing.moved_to_dead_letter = False

        db = _mock_db()
        db.scalar.return_value = existing

        result = await enqueue_retry(
            db,
            event_id="evt_001",
            event_type="payment.updated",
            payload={"amount": 100},
            error_message="timeout again",
        )

        assert result.retry_count == 1
        assert result.last_error == "timeout again"

    @pytest.mark.asyncio
    async def test_enqueue_max_retries_moves_to_dead_letter(self):
        existing = MagicMock(spec=WebhookRetryQueue)
        existing.event_id = "evt_001"
        existing.retry_count = 4
        existing.max_retries = 5
        existing.moved_to_dead_letter = False
        existing.event_type = "payment.updated"
        existing.event_source = "square"
        existing.payload = '{"amount": 100}'

        db = _mock_db()
        db.scalar.return_value = existing

        result = await enqueue_retry(
            db,
            event_id="evt_001",
            event_type="payment.updated",
            payload={"amount": 100},
            error_message="final failure",
        )

        assert result.retry_count == 5
        assert result.moved_to_dead_letter is True
        db.add.assert_called_once()


class TestProcessRetryQueue:

    @pytest.mark.asyncio
    async def test_process_due_entries_success(self):
        entry = MagicMock(spec=WebhookRetryQueue)
        entry.event_id = "evt_001"
        entry.event_type = "payment.updated"
        entry.event_source = "square"
        entry.payload = '{"amount": 100}'
        entry.retry_count = 0
        entry.max_retries = MAX_RETRIES
        entry.moved_to_dead_letter = False

        db = _mock_db()
        db.scalars.return_value = [entry]

        with patch("app.webhook_retry.create_webhook_event", new=AsyncMock()):
            processed = await process_retry_queue(db)

        assert "evt_001" in processed
        db.delete.assert_awaited_once_with(entry)
        db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_process_due_entries_failure_moves_to_dead_letter(self):
        entry = MagicMock(spec=WebhookRetryQueue)
        entry.event_id = "evt_001"
        entry.event_type = "payment.updated"
        entry.event_source = "square"
        entry.payload = '{"amount": 100}'
        entry.retry_count = 4
        entry.max_retries = 5
        entry.moved_to_dead_letter = False

        db = _mock_db()
        db.scalars.return_value = [entry]

        with patch(
            "app.webhook_retry.create_webhook_event",
            new=AsyncMock(side_effect=ValueError("processing failed")),
        ):
            processed = await process_retry_queue(db)

        assert "evt_001" in processed
        assert entry.retry_count == 5
        assert entry.moved_to_dead_letter is True
        db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_due_entries_retry_again(self):
        entry = MagicMock(spec=WebhookRetryQueue)
        entry.event_id = "evt_001"
        entry.event_type = "payment.updated"
        entry.event_source = "square"
        entry.payload = '{"amount": 100}'
        entry.retry_count = 1
        entry.max_retries = 5
        entry.moved_to_dead_letter = False

        db = _mock_db()
        db.scalars.return_value = [entry]

        with patch(
            "app.webhook_retry.create_webhook_event",
            new=AsyncMock(side_effect=ValueError("still failing")),
        ):
            processed = await process_retry_queue(db)

        assert "evt_001" in processed
        assert entry.retry_count == 2
        assert entry.moved_to_dead_letter is False

    @pytest.mark.asyncio
    async def test_process_no_due_entries(self):
        db = _mock_db()
        db.scalars.return_value = []

        processed = await process_retry_queue(db)

        assert processed == []


class TestManualRetry:

    @pytest.mark.asyncio
    async def test_manual_retry_existing_entry(self):
        entry = MagicMock(spec=WebhookRetryQueue)
        entry.event_id = "evt_001"
        entry.retry_count = 3
        entry.next_retry_at = datetime.now(timezone.utc) + timedelta(hours=1)
        entry.last_error = "previous error"

        db = _mock_db()
        db.scalar.return_value = entry

        result = await manual_retry(db, "evt_001")

        assert result.retry_count == 0
        assert result.last_error is None
        db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_manual_retry_from_dead_letter(self):
        dead = MagicMock(spec=WebhookDeadLetter)
        dead.event_id = "evt_001"
        dead.event_type = "payment.updated"
        dead.event_source = "square"
        dead.payload = '{"amount": 100}'

        db = _mock_db()
        db.scalar = AsyncMock(side_effect=[None, dead])

        result = await manual_retry(db, "evt_001")

        assert result.event_id == "evt_001"
        assert result.retry_count == 0
        db.delete.assert_awaited_once_with(dead)
        db.flush.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_manual_retry_not_found(self):
        db = _mock_db()
        db.scalar = AsyncMock(return_value=None)

        with pytest.raises(Exception) as exc:
            await manual_retry(db, "evt_not_found")

        assert "No retry queue or dead-letter entry found" in str(exc.value.detail)


class TestGetEntries:

    @pytest.mark.asyncio
    async def test_get_dead_letter_entries(self):
        entry = MagicMock(spec=WebhookDeadLetter)
        entry.event_id = "evt_001"
        entry.event_type = "payment.updated"
        entry.event_source = "square"
        entry.retry_count = 5
        entry.final_error = "exhausted"
        entry.created_at = datetime.now(timezone.utc)
        entry.moved_at = datetime.now(timezone.utc)

        db = _mock_db()
        db.scalars.return_value = _make_scalars_result([entry])

        results = await get_dead_letter_entries(db, limit=10, offset=0)

        assert len(results) == 1
        assert results[0].event_id == "evt_001"

    @pytest.mark.asyncio
    async def test_get_retry_queue_entries(self):
        entry = MagicMock(spec=WebhookRetryQueue)
        entry.event_id = "evt_001"
        entry.event_type = "payment.updated"
        entry.event_source = "square"
        entry.retry_count = 2
        entry.max_retries = 5
        entry.next_retry_at = datetime.now(timezone.utc)
        entry.last_error = "timeout"
        entry.created_at = datetime.now(timezone.utc)
        entry.moved_to_dead_letter = False

        db = _mock_db()
        db.scalars.return_value = _make_scalars_result([entry])

        results = await get_retry_queue_entries(db, limit=10, offset=0)

        assert len(results) == 1
        assert results[0].event_id == "evt_001"
