"""Tests for the webhook retry queue, dead-letter flow, scheduler, and API."""

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from app.models import User
from app.webhook_retry import (
    BASE_BACKOFF_SECONDS,
    WebhookDeadLetter,
    WebhookRetryQueue,
    _compute_next_retry_time,
    _require_current_user,
    enqueue_retry,
    get_dead_letter_entries,
    get_retry_queue_entries,
    manual_retry,
    process_retry_queue,
    scheduled_retry_task,
)


@pytest.fixture()
def session(db_session_factory):
    """Provide an async session with a freshly reset schema."""
    engine = db_session_factory.kw["bind"]
    from app.database import Base

    async def _reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_reset())

    wrapper = {}

    async def _open():
        wrapper["session"] = db_session_factory()

    asyncio.run(_open())
    yield wrapper["session"]
    asyncio.run(wrapper["session"].close())


def _enqueue_payload(n: int = 1) -> dict:
    return {"event_id": f"evt_{n}", "data": {"value": n}}


class TestBackoffSchedule:
    def test_exponential_growth(self):
        before = datetime.now(timezone.utc)
        t0 = _compute_next_retry_time(0)
        t3 = _compute_next_retry_time(3)
        assert (t0 - before).total_seconds() >= BASE_BACKOFF_SECONDS
        assert (t3 - before).total_seconds() >= BASE_BACKOFF_SECONDS * 8
        assert (t3 - t0).total_seconds() >= BASE_BACKOFF_SECONDS * 7


@pytest.mark.asyncio
class TestEnqueueRetry:
    async def test_new_entry_created(self, session):
        entry = await enqueue_retry(
            session,
            event_id="evt_new",
            event_type="payment.updated",
            payload=_enqueue_payload(),
            error_message="boom",
        )
        assert entry.retry_count == 0
        assert entry.next_retry_at is not None
        assert entry.moved_to_dead_letter is False
        assert json.loads(entry.payload) == _enqueue_payload()

    async def test_existing_entry_increments_count(self, session):
        await enqueue_retry(
            session, event_id="evt_inc", event_type="t", payload={}, error_message="e1"
        )
        again = await enqueue_retry(
            session, event_id="evt_inc", event_type="t", payload={}, error_message="e2"
        )
        assert again.retry_count == 1
        assert again.last_error == "e2"
        assert again.moved_to_dead_letter is False

    async def test_reaching_max_retries_moves_to_dead_letter(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_dl", event_type="t", payload={}, error_message="e"
        )
        entry.max_retries = 2
        await enqueue_retry(
            session, event_id="evt_dl", event_type="t", payload={}, error_message="e"
        )
        final = await enqueue_retry(
            session,
            event_id="evt_dl",
            event_type="t",
            payload={},
            error_message="final",
        )
        assert final.moved_to_dead_letter is True

        dead = await session.scalar(
            select(WebhookDeadLetter).where(WebhookDeadLetter.event_id == "evt_dl")
        )
        assert dead is not None
        assert dead.final_error == "final"
        assert dead.retry_count == 2


@pytest.mark.asyncio
class TestProcessRetryQueue:
    async def test_due_entry_succeeds_and_is_removed(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_ok", event_type="t", payload={"x": 1}
        )
        entry.next_retry_at = datetime.now(timezone.utc) - timedelta(seconds=1)

        with patch(
            "app.webhook_retry.create_webhook_event", new=AsyncMock()
        ) as mock_create:
            processed = await process_retry_queue(session)

        assert processed == ["evt_ok"]
        mock_create.assert_awaited_once()
        kwargs = mock_create.call_args.kwargs
        assert kwargs["event_id"] == "evt_ok_retry_1"
        assert kwargs["payload"] == {"x": 1}
        assert (
            await session.scalar(
                select(WebhookRetryQueue).where(WebhookRetryQueue.event_id == "evt_ok")
            )
        ) is None

    async def test_future_entries_are_not_due(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_future", event_type="t", payload={}
        )
        entry.next_retry_at = datetime.now(timezone.utc) + timedelta(hours=1)
        processed = await process_retry_queue(session)
        assert processed == []

    async def test_failing_retry_reschedules(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_fail", event_type="t", payload={}
        )
        entry.next_retry_at = datetime.now(timezone.utc) - timedelta(seconds=1)

        with patch(
            "app.webhook_retry.create_webhook_event",
            new=AsyncMock(side_effect=RuntimeError("still broken")),
        ):
            processed = await process_retry_queue(session)

        assert processed == ["evt_fail"]
        assert entry.retry_count == 1
        assert entry.last_error == "still broken"
        assert entry.moved_to_dead_letter is False

    async def test_exhausted_retry_moves_to_dead_letter(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_exhaust", event_type="t", payload={}
        )
        entry.max_retries = 1
        entry.next_retry_at = datetime.now(timezone.utc) - timedelta(seconds=1)

        with patch(
            "app.webhook_retry.create_webhook_event",
            new=AsyncMock(side_effect=RuntimeError("permanent")),
        ):
            processed = await process_retry_queue(session)

        assert processed == ["evt_exhaust"]
        assert entry.moved_to_dead_letter is True
        dead = await session.scalar(
            select(WebhookDeadLetter).where(WebhookDeadLetter.event_id == "evt_exhaust")
        )
        assert dead is not None
        assert dead.final_error == "permanent"


@pytest.mark.asyncio
class TestManualRetry:
    async def test_retry_from_queue_resets_counters(self, session):
        entry = await enqueue_retry(
            session, event_id="evt_manual", event_type="t", payload={}
        )
        entry.retry_count = 3
        entry.last_error = "some error"

        result = await manual_retry(session, "evt_manual")
        assert result.retry_count == 0
        assert result.last_error is None

    async def test_retry_reenqueues_from_dead_letter(self, session):
        session.add(
            WebhookDeadLetter(
                event_id="evt_dead",
                event_type="t",
                event_source="square",
                payload=json.dumps({"a": 1}) if False else '{"a": 1}',
                retry_count=5,
                final_error="permanent",
            )
        )
        await session.flush()

        entry = await manual_retry(session, "evt_dead")
        assert entry.retry_count == 0
        assert (
            await session.scalar(
                select(WebhookDeadLetter).where(
                    WebhookDeadLetter.event_id == "evt_dead"
                )
            )
        ) is None

    async def test_retry_unknown_event_raises_404(self, session):
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as excinfo:
            await manual_retry(session, "evt_missing")
        assert excinfo.value.status_code == 404


@pytest.mark.asyncio
class TestListOperations:
    async def test_dead_letter_pagination(self, session):
        for index in range(3):
            session.add(
                WebhookDeadLetter(
                    event_id=f"evt_dl_{index}",
                    event_type="t",
                    event_source="square",
                    payload="{}",
                    retry_count=5,
                    final_error="x",
                )
            )
        await session.flush()

        page = await get_dead_letter_entries(session, limit=2, offset=0)
        assert len(page) == 2
        rest = await get_dead_letter_entries(session, limit=2, offset=2)
        assert len(rest) == 1

    async def test_retry_queue_excludes_dead_lettered(self, session):
        await enqueue_retry(session, event_id="evt_active", event_type="t", payload={})
        moved = await enqueue_retry(
            session, event_id="evt_moved", event_type="t", payload={}
        )
        moved.moved_to_dead_letter = True
        await session.flush()

        entries = await get_retry_queue_entries(session)
        event_ids = {e.event_id for e in entries}
        assert "evt_active" in event_ids
        assert "evt_moved" not in event_ids


@pytest.mark.asyncio
class TestScheduledTask:
    async def test_commits_when_work_done(self):
        fake_session = AsyncMock()
        fake_cm = AsyncMock()
        fake_cm.__aenter__ = AsyncMock(return_value=fake_session)
        fake_cm.__aexit__ = AsyncMock(return_value=False)
        fake_session_cm = lambda: fake_cm  # noqa: E731

        with (
            patch("app.webhook_retry.SessionLocal", fake_session_cm),
            patch(
                "app.webhook_retry.process_retry_queue",
                new=AsyncMock(return_value=["evt_1"]),
            ),
        ):
            await scheduled_retry_task()
        fake_session.commit.assert_awaited_once()

    async def test_rolls_back_when_idle(self):
        fake_session = AsyncMock()
        fake_cm = AsyncMock()
        fake_cm.__aenter__ = AsyncMock(return_value=fake_session)
        fake_cm.__aexit__ = AsyncMock(return_value=False)

        with (
            patch("app.webhook_retry.SessionLocal", lambda: fake_cm),
            patch(
                "app.webhook_retry.process_retry_queue",
                new=AsyncMock(return_value=[]),
            ),
        ):
            await scheduled_retry_task()
        fake_session.rollback.assert_awaited_once()

    async def test_rolls_back_on_failure(self):
        fake_session = AsyncMock()
        fake_cm = AsyncMock()
        fake_cm.__aenter__ = AsyncMock(return_value=fake_session)
        fake_cm.__aexit__ = AsyncMock(return_value=False)

        with (
            patch("app.webhook_retry.SessionLocal", lambda: fake_cm),
            patch(
                "app.webhook_retry.process_retry_queue",
                new=AsyncMock(side_effect=RuntimeError("db down")),
            ),
        ):
            await scheduled_retry_task()  # must not raise
        fake_session.rollback.assert_awaited_once()


# ── HTTP router ──────────────────────────────────────────────────────────────


def _override_operator():
    user = User(
        id=uuid.uuid4(),
        email="operator@example.com",
        password_hash="hashed",
        display_name="Operator",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    async def _dep():
        return user

    return _dep


def test_retry_endpoint_reenqueues(client, db_session_factory):
    from app.main import app

    dead = WebhookDeadLetter(
        event_id="evt_api_retry",
        event_type="payment.updated",
        event_source="square",
        payload="{}",
        retry_count=5,
        final_error="permanent",
    )

    async def _seed():
        async with db_session_factory() as session:
            session.add(dead)
            await session.commit()

    asyncio.run(_seed())

    app.dependency_overrides[_require_current_user] = _override_operator()
    try:
        resp = client.post("/api/v1/webhooks/retry/evt_api_retry")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["event_id"] == "evt_api_retry"
        assert data["retry_count"] == 0

        # Unknown event → 404
        resp = client.post("/api/v1/webhooks/retry/evt_that_never_existed")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(_require_current_user, None)


def test_dead_letter_and_queue_listing_endpoints(client, db_session_factory):
    from app.main import app

    async def _seed():
        async with db_session_factory() as session:
            session.add(
                WebhookDeadLetter(
                    event_id="evt_dl_list",
                    event_type="payment.updated",
                    event_source="square",
                    payload="{}",
                    retry_count=5,
                    final_error="done",
                )
            )
            session.add(
                WebhookRetryQueue(
                    event_id="evt_q_list",
                    event_type="payment.updated",
                    event_source="square",
                    payload="{}",
                    retry_count=1,
                    max_retries=5,
                    next_retry_at=datetime.now(timezone.utc),
                    last_error="transient",
                )
            )
            await session.commit()

    asyncio.run(_seed())

    app.dependency_overrides[_require_current_user] = _override_operator()
    try:
        resp = client.get("/api/v1/webhooks/dead-letter")
        assert resp.status_code == 200
        rows = resp.json()
        assert any(r["event_id"] == "evt_dl_list" for r in rows)
        target = next(r for r in rows if r["event_id"] == "evt_dl_list")
        assert target["final_error"] == "done"
        assert target["moved_at"] is not None

        resp = client.get("/api/v1/webhooks/retry-queue")
        assert resp.status_code == 200
        rows = resp.json()
        assert any(r["event_id"] == "evt_q_list" for r in rows)
        target = next(r for r in rows if r["event_id"] == "evt_q_list")
        assert target["last_error"] == "transient"
        assert target["max_retries"] == 5
    finally:
        app.dependency_overrides.pop(_require_current_user, None)


def test_retry_endpoints_require_bearer_token(client):
    resp = client.post("/api/v1/webhooks/retry/evt_x")
    assert resp.status_code in (401, 403)
    resp = client.get("/api/v1/webhooks/dead-letter")
    assert resp.status_code in (401, 403)
    resp = client.get("/api/v1/webhooks/retry-queue")
    assert resp.status_code in (401, 403)
