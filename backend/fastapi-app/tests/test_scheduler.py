"""Tests for app/scheduler.py — background task scheduler.

Coverage targets:
  - purge_deleted_accounts() — happy path, no pending logs, match cascade
  - process_data_exports() — happy path, missing user, file write failure
  - setup_scheduler() — returns a running scheduler with correct jobs

Design constraints:
  - NO real-time waiting (no time.sleep)
  - All DB calls use an in-memory SQLite session
  - File I/O mocked via patch so no real files written
  - freezegun used to freeze datetime.now() where needed
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from freezegun import freeze_time
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database import Base
from app.models import (
    DataPrivacyLog,
    Match,
    User,
    VerificationEvent,
)

# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(coro):
    """Run a coroutine in a new event loop (pytest-asyncio is auto mode)."""
    return asyncio.run(coro)


def _make_user(email: str = "sched@example.com") -> User:
    from datetime import date

    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="$2b$12$fakehash",
        display_name="Scheduler Test",
        date_of_birth=date(1990, 1, 1),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_privacy_log(
    user_id: uuid.UUID,
    action: str = "delete_requested",
    status: str = "pending",
    scheduled_for: datetime | None = None,
) -> DataPrivacyLog:
    return DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user_id,
        action=action,
        status=status,
        scheduled_for=scheduled_for or datetime(2026, 1, 1, tzinfo=timezone.utc),
    )


@pytest.fixture()
def mem_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async def _setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_setup())
    yield engine

    async def _teardown():
        await engine.dispose()

    asyncio.run(_teardown())


@pytest.fixture()
def mem_session_factory(mem_engine):
    return async_sessionmaker(mem_engine, expire_on_commit=False)


# ── purge_deleted_accounts ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_purge_no_pending_logs_is_noop(mem_session_factory):
    """When there are no pending delete_requested logs, purge returns early."""
    from app import scheduler as sched_mod

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        # Should complete without error and without touching anything
        await sched_mod.purge_deleted_accounts()


@pytest.mark.asyncio
async def test_purge_deletes_user_and_marks_log_completed(mem_session_factory):
    """A pending deletion log with a past scheduled_for triggers cascade delete."""
    from app import scheduler as sched_mod

    user = _make_user("purge_target@example.com")
    log = _make_privacy_log(
        user.id,
        action="delete_requested",
        status="pending",
        scheduled_for=datetime(2025, 1, 1, tzinfo=timezone.utc),  # past
    )

    async with mem_session_factory() as session:
        session.add(user)
        session.add(log)
        await session.commit()

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with freeze_time("2026-05-13 12:00:00"):
            await sched_mod.purge_deleted_accounts()

    # Verify log status updated and user deleted

    async with mem_session_factory() as session:
        updated_log = await session.get(DataPrivacyLog, log.id)
        assert updated_log is not None
        assert updated_log.status == "completed"
        deleted_user = await session.get(User, user.id)
        assert deleted_user is None


@pytest.mark.asyncio
async def test_purge_skips_logs_scheduled_in_future(mem_session_factory):
    """Logs scheduled_for a future date must NOT be purged."""
    from app import scheduler as sched_mod

    user = _make_user("future_purge@example.com")
    future_log = _make_privacy_log(
        user.id,
        action="delete_requested",
        status="pending",
        scheduled_for=datetime(2099, 1, 1, tzinfo=timezone.utc),
    )

    async with mem_session_factory() as session:
        session.add(user)
        session.add(future_log)
        await session.commit()

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with freeze_time("2026-05-13 12:00:00"):
            await sched_mod.purge_deleted_accounts()

    async with mem_session_factory() as session:
        log_after = await session.get(DataPrivacyLog, future_log.id)
        assert log_after.status == "pending"  # untouched
        user_after = await session.get(User, user.id)
        assert user_after is not None  # user still exists


@pytest.mark.asyncio
async def test_purge_skips_non_pending_logs(mem_session_factory):
    """Logs with status != 'pending' are not re-processed."""
    from app import scheduler as sched_mod

    user = _make_user("completed_purge@example.com")
    completed_log = _make_privacy_log(
        user.id,
        action="delete_requested",
        status="completed",
        scheduled_for=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )

    async with mem_session_factory() as session:
        session.add(user)
        session.add(completed_log)
        await session.commit()

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with freeze_time("2026-05-13 12:00:00"):
            await sched_mod.purge_deleted_accounts()

    async with mem_session_factory() as session:
        # User should still exist — only pending logs trigger deletion
        user_after = await session.get(User, user.id)
        assert user_after is not None


@pytest.mark.asyncio
async def test_purge_with_matches_triggers_cascade(mem_session_factory):
    """When a user has matches, the match cascade branch executes."""
    from app import scheduler as sched_mod

    user_a = _make_user("match_purge_a@example.com")
    user_b = _make_user("match_purge_b@example.com")
    match = Match(
        id=uuid.uuid4(),
        user_a=user_a.id,
        user_b=user_b.id,
        status="active",
        matched_at=datetime.now(timezone.utc),
    )
    log = _make_privacy_log(
        user_a.id,
        scheduled_for=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )

    async with mem_session_factory() as session:
        session.add(user_a)
        session.add(user_b)
        await session.flush()
        session.add(match)
        session.add(log)
        await session.commit()

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with freeze_time("2026-05-13 12:00:00"):
            await sched_mod.purge_deleted_accounts()

    async with mem_session_factory() as session:
        from sqlalchemy import select

        remaining_matches = (
            await session.scalars(select(Match).where(Match.id == match.id))
        ).all()
        assert remaining_matches == []


# ── process_data_exports ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_export_no_pending_logs_is_noop(mem_session_factory):
    """No pending export logs = no file writes, no errors."""
    from app import scheduler as sched_mod

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with patch("aiofiles.open", side_effect=AssertionError("should not write")):
            await sched_mod.process_data_exports()  # must not raise


@pytest.mark.asyncio
async def test_export_missing_user_marks_log_failed(mem_session_factory):
    """If the user is not found (deleted externally), log status = failed."""
    from app import scheduler as sched_mod

    ghost_user_id = uuid.uuid4()
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=ghost_user_id,
        action="export_requested",
        status="pending",
    )

    # Insert log without a corresponding user
    async with mem_session_factory() as session:
        # We must insert the user first because of FK, then delete them
        ghost_user = _make_user("ghost@example.com")
        ghost_user.id = ghost_user_id
        session.add(ghost_user)
        await session.flush()
        session.add(log)
        await session.commit()
        # Now delete the user to simulate orphaned log
        await session.delete(ghost_user)
        await session.commit()

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        await sched_mod.process_data_exports()

    async with mem_session_factory() as session:
        updated_log = await session.get(DataPrivacyLog, log.id)
        assert updated_log.status == "failed"


@pytest.mark.asyncio
async def test_export_happy_path_writes_file_and_marks_completed(mem_session_factory):
    """Successful export writes JSON file and sets log status = completed."""
    from app import scheduler as sched_mod

    user = _make_user("export_happy@example.com")
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="export_requested",
        status="pending",
    )

    async with mem_session_factory() as session:
        session.add(user)
        await session.flush()
        session.add(log)
        await session.commit()

    written_content = {}

    class _MockFile:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def write(self, content):
            written_content["data"] = content

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with patch("aiofiles.open", return_value=_MockFile()):
            await sched_mod.process_data_exports()

    # Verify file content was valid JSON
    assert "data" in written_content
    export_data = json.loads(written_content["data"])
    assert export_data["user"]["email"] == "export_happy@example.com"
    assert "messages_sent" in export_data
    assert "matches" in export_data
    assert "exported_at" in export_data

    async with mem_session_factory() as session:
        updated_log = await session.get(DataPrivacyLog, log.id)
        assert updated_log.status == "completed"


@pytest.mark.asyncio
async def test_export_file_write_failure_marks_log_failed(mem_session_factory):
    """If the file write raises an exception, log status = failed."""
    from app import scheduler as sched_mod

    user = _make_user("export_fail@example.com")
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="export_requested",
        status="pending",
    )

    async with mem_session_factory() as session:
        session.add(user)
        await session.flush()
        session.add(log)
        await session.commit()

    class _BrokenFile:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def write(self, _content):
            raise OSError("Disk full")

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with patch("aiofiles.open", return_value=_BrokenFile()):
            await sched_mod.process_data_exports()

    async with mem_session_factory() as session:
        updated_log = await session.get(DataPrivacyLog, log.id)
        assert updated_log.status == "failed"


@pytest.mark.asyncio
async def test_export_user_with_no_profile_exports_null_profile(mem_session_factory):
    """A user without a profile should produce profile=null in export JSON."""
    from app import scheduler as sched_mod

    user = _make_user("export_noprofile@example.com")
    log = DataPrivacyLog(
        id=uuid.uuid4(),
        user_id=user.id,
        action="export_requested",
        status="pending",
    )

    async with mem_session_factory() as session:
        session.add(user)
        await session.flush()
        session.add(log)
        await session.commit()

    written_content = {}

    class _MockFile:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def write(self, content):
            written_content["data"] = content

    with patch.object(sched_mod, "SessionLocal", mem_session_factory):
        with patch("aiofiles.open", return_value=_MockFile()):
            await sched_mod.process_data_exports()

    export_data = json.loads(written_content["data"])
    assert export_data["profile"] is None


# ── setup_scheduler ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_setup_scheduler_returns_running_scheduler():
    """setup_scheduler() must return a started AsyncIOScheduler instance.

    Runs inside an async test so the running event loop is available for
    AsyncIOScheduler.start().
    """
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    from app import scheduler as sched_mod

    scheduler = sched_mod.setup_scheduler()
    try:
        assert isinstance(scheduler, AsyncIOScheduler)
        assert scheduler.running
        # Verify both jobs are registered
        job_funcs = {job.func for job in scheduler.get_jobs()}
        assert sched_mod.purge_deleted_accounts in job_funcs
        assert sched_mod.process_data_exports in job_funcs
    finally:
        scheduler.shutdown(wait=False)


@pytest.mark.asyncio
async def test_setup_scheduler_purge_is_cron_at_3am():
    """purge_deleted_accounts is scheduled as cron at hour=3."""
    from app import scheduler as sched_mod

    scheduler = sched_mod.setup_scheduler()
    try:
        jobs = {job.func: job for job in scheduler.get_jobs()}
        purge_job = jobs[sched_mod.purge_deleted_accounts]
        # Trigger type should be CronTrigger; field hour=3
        trigger_fields = {f.name: str(f) for f in purge_job.trigger.fields}
        assert trigger_fields.get("hour") == "3"
    finally:
        scheduler.shutdown(wait=False)


@pytest.mark.asyncio
async def test_setup_scheduler_export_is_interval_1h():
    """process_data_exports is scheduled as interval at 1 hour."""
    from app import scheduler as sched_mod

    scheduler = sched_mod.setup_scheduler()
    try:
        jobs = {job.func: job for job in scheduler.get_jobs()}
        export_job = jobs[sched_mod.process_data_exports]
        # IntervalTrigger exposes interval attribute
        assert export_job.trigger.interval.total_seconds() == 3600
    finally:
        scheduler.shutdown(wait=False)


# ── subscriptions.py supplemental coverage ────────────────────────────────────
# (Small utilities best tested here to avoid new file clutter)


def test_normalize_datetime_non_datetime_value_returns_none():
    """normalize_datetime rejects a non-datetime value (e.g. a plain string)."""
    from app.subscriptions import normalize_datetime

    assert normalize_datetime("2026-05-13T00:00:00Z") is None  # type: ignore[arg-type]


def test_normalize_datetime_none_returns_none():
    from app.subscriptions import normalize_datetime

    assert normalize_datetime(None) is None


def test_normalize_datetime_naive_datetime_gets_utc():
    from datetime import datetime

    from app.subscriptions import normalize_datetime

    naive = datetime(2026, 5, 13, 12, 0, 0)
    result = normalize_datetime(naive)
    assert result is not None
    assert result.tzinfo is not None


# ── verification_service.py supplemental coverage ─────────────────────────────


@pytest.mark.asyncio
async def test_promote_user_already_verified_returns_true(mem_session_factory):
    """If user.bot_shield_verified is True, early-return True without DB queries."""

    from app.verification_service import promote_user_verification_if_ready

    user = _make_user("promo_already@example.com")
    user.bot_shield_verified = True

    mock_db = AsyncMock()
    result = await promote_user_verification_if_ready(mock_db, user)
    assert result is True
    mock_db.scalar.assert_not_called()  # no DB queries needed


@pytest.mark.asyncio
async def test_promote_user_no_payment_returns_false(mem_session_factory):
    """If user passed liveness but not payment, returns False."""
    from app.verification_service import promote_user_verification_if_ready

    user = _make_user("promo_nopay@example.com")
    user.bot_shield_verified = False
    user.id = uuid.uuid4()

    async with mem_session_factory() as db:
        # Add user but no VerificationEvents at all
        db.add(user)
        await db.commit()

        result = await promote_user_verification_if_ready(db, user)
    assert result is False


@pytest.mark.asyncio
async def test_promote_user_no_liveness_returns_false(mem_session_factory):
    """If user has no liveness event, returns False."""
    from app.verification_service import promote_user_verification_if_ready

    user = _make_user("promo_nolive@example.com")
    user.bot_shield_verified = False
    user.id = uuid.uuid4()

    async with mem_session_factory() as db:
        db.add(user)
        await db.commit()
        result = await promote_user_verification_if_ready(db, user)
    assert result is False


@pytest.mark.asyncio
async def test_promote_user_liveness_passed_no_payment_returns_false(
    mem_session_factory,
):
    """If user passed liveness but has no payment event, returns False (line 66)."""

    from app.verification_service import promote_user_verification_if_ready

    user = _make_user("promo_livnopay@example.com")
    user.bot_shield_verified = False
    user.id = uuid.uuid4()
    liveness_event = VerificationEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        challenge_type="liveness",
        status="passed",
        created_at=datetime.now(timezone.utc),
    )

    async with mem_session_factory() as db:
        db.add(user)
        await db.flush()
        db.add(liveness_event)
        await db.commit()
        result = await promote_user_verification_if_ready(db, user)
    assert result is False


# ── feature_flags.py supplemental coverage ────────────────────────────────────


def test_feature_flags_get_returns_default_for_unknown():
    from app.feature_flags import get_flag

    result = get_flag("nonexistent_flag_xyz", default="fallback")
    assert result == "fallback"


def test_feature_flags_set_and_get_roundtrip():
    from app.feature_flags import get_flag, set_flag

    set_flag("test_roundtrip_flag", True)
    assert get_flag("test_roundtrip_flag") is True
    set_flag("test_roundtrip_flag", False)
    assert get_flag("test_roundtrip_flag") is False


def test_feature_flags_get_all_returns_dict():
    from app.feature_flags import get_all_flags

    flags = get_all_flags()
    assert isinstance(flags, dict)
    assert "lovebot_enabled" in flags
    assert "video_rooms_enabled" in flags


# ── routers/feature_flags.py supplemental coverage ───────────────────────────


def test_feature_flags_router_list_requires_auth(client):
    """GET /api/v1/admin/flags without auth returns 401/403."""
    response = client.get("/api/v1/admin/flags/")
    assert response.status_code in (401, 403)


def test_feature_flags_router_list_returns_flags(client):
    """Authenticated GET /api/v1/admin/flags/ returns dict of flags."""
    from app.auth import create_access_token, get_current_user
    from app.main import app

    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()
    mock_user.email = "flagadmin@example.com"

    async def _override():
        return mock_user

    app.dependency_overrides[get_current_user] = _override
    try:
        membership record = create_access_token(str(mock_user.id))
        response = client.get(
            "/api/v1/admin/flags/",
            headers={"Authorization": f"Bearer {membership record}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "lovebot_enabled" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_feature_flags_router_read_existing_flag(client):
    """GET /api/v1/admin/flags/{name} returns the flag value."""
    from app.auth import create_access_token, get_current_user
    from app.main import app

    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    async def _override():
        return mock_user

    app.dependency_overrides[get_current_user] = _override
    try:
        membership record = create_access_token(str(mock_user.id))
        response = client.get(
            "/api/v1/admin/flags/lovebot_enabled",
            headers={"Authorization": f"Bearer {membership record}"},
        )
        assert response.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_feature_flags_router_read_unknown_flag_returns_404(client):
    """GET /api/v1/admin/flags/{name} with unknown name returns 404."""
    from app.auth import create_access_token, get_current_user
    from app.main import app

    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    async def _override():
        return mock_user

    app.dependency_overrides[get_current_user] = _override
    try:
        membership record = create_access_token(str(mock_user.id))
        response = client.get(
            "/api/v1/admin/flags/nonexistent_xyz_flag",
            headers={"Authorization": f"Bearer {membership record}"},
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_feature_flags_router_update_flag(client):
    """PUT /api/v1/admin/flags/{name} updates and returns new value."""
    from app.auth import create_access_token, get_current_user
    from app.main import app

    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    async def _override():
        return mock_user

    app.dependency_overrides[get_current_user] = _override
    try:
        membership record = create_access_token(str(mock_user.id))
        response = client.put(
            "/api/v1/admin/flags/lovebot_enabled",
            json={"value": False},
            headers={"Authorization": f"Bearer {membership record}"},
        )
        assert response.status_code == 200
        assert response.json()["lovebot_enabled"] is False
        # Reset to avoid polluting other tests
        client.put(
            "/api/v1/admin/flags/lovebot_enabled",
            json={"value": True},
            headers={"Authorization": f"Bearer {membership record}"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_feature_flags_router_update_unknown_flag_returns_404(client):
    """PUT /api/v1/admin/flags/{name} with unknown flag returns 404."""
    from app.auth import create_access_token, get_current_user
    from app.main import app

    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    async def _override():
        return mock_user

    app.dependency_overrides[get_current_user] = _override
    try:
        membership record = create_access_token(str(mock_user.id))
        response = client.put(
            "/api/v1/admin/flags/no_such_flag",
            json={"value": True},
            headers={"Authorization": f"Bearer {membership record}"},
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── webhook_event_store._coerce_payload supplemental coverage ─────────────────


def test_coerce_payload_dict_passes_through():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload({"key": "value"})
    assert result == {"key": "value"}


def test_coerce_payload_valid_json_string():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload('{"key": "value"}')
    assert result == {"key": "value"}


def test_coerce_payload_invalid_json_returns_none():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload("{not valid json!!}")
    assert result is None


def test_coerce_payload_json_array_returns_none():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload("[1, 2, 3]")
    assert result is None


def test_coerce_payload_none_returns_none():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload(None)
    assert result is None


def test_coerce_payload_integer_returns_none():
    from app.webhook_event_store import _coerce_payload

    result = _coerce_payload(42)
    assert result is None


@pytest.mark.asyncio
async def test_webhook_event_exists_no_schema_returns_false(mem_session_factory):
    """When the webhook_events table doesn't exist, webhook_event_exists returns False."""
    from unittest.mock import patch

    from app.webhook_event_store import webhook_event_exists

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=None),
        ):
            result = await webhook_event_exists(db, "evt_nonexistent")
    assert result is False


@pytest.mark.asyncio
async def test_recent_processed_payment_payloads_no_schema_returns_empty(
    mem_session_factory,
):
    """When no schema is available, returns empty list."""
    from unittest.mock import patch

    from app.webhook_event_store import recent_processed_payment_payloads

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=None),
        ):
            result = await recent_processed_payment_payloads(db)
    assert result == []


@pytest.mark.asyncio
async def test_create_webhook_event_no_schema_raises(mem_session_factory):
    """When the schema lookup returns None, create_webhook_event raises RuntimeError."""
    from unittest.mock import patch

    from app.webhook_event_store import create_webhook_event

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=None),
        ):
            with pytest.raises(
                RuntimeError, match="webhook_events table is not available"
            ):
                await create_webhook_event(
                    db,
                    event_id="evt_test",
                    event_type="payment.completed",
                    payload={"amount": 100},
                    processed=True,
                )


@pytest.mark.asyncio
async def test_webhook_event_exists_with_event_source_id_schema(mem_session_factory):
    """When schema uses event_source_id, webhook_event_exists queries via ORM."""
    from unittest.mock import MagicMock, patch

    from app.webhook_event_store import WebhookEventSchema, webhook_event_exists

    mock_table = MagicMock()
    mock_schema = WebhookEventSchema(
        table=mock_table,
        columns=frozenset(
            [
                "id",
                "event_source_id",
                "event_source",
                "event_type",
                "payload",
                "processed",
            ]
        ),
        external_id_column="event_source_id",
    )

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=mock_schema),
        ):
            # Patch db.scalar to return None (event not found)
            db.scalar = AsyncMock(return_value=None)
            result = await webhook_event_exists(db, "evt_notfound")
    assert result is False


@pytest.mark.asyncio
async def test_mark_webhook_event_processed_no_schema_is_noop(mem_session_factory):
    """mark_webhook_event_processed with no schema returns without error."""
    from unittest.mock import patch

    from app.webhook_event_store import mark_webhook_event_processed

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=None),
        ):
            await mark_webhook_event_processed(db, "evt_none")  # must not raise


@pytest.mark.asyncio
async def test_get_webhook_event_schema_no_table_returns_none(mem_session_factory):
    """get_webhook_event_schema returns None when webhook_events table doesn't exist.

    The in-memory SQLite test DB only has the app models — webhook_events is
    created by the normal Base.metadata but we patch it to not exist.
    """

    # Create a fresh engine with NO tables at all
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.webhook_event_store import get_webhook_event_schema

    bare_engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    bare_factory = async_sessionmaker(bare_engine, expire_on_commit=False)

    try:
        async with bare_factory() as db:
            result = await get_webhook_event_schema(db)
        assert result is None
    finally:
        await bare_engine.dispose()


@pytest.mark.asyncio
async def test_recent_payloads_with_event_source_id_schema(mem_session_factory):
    """recent_processed_payment_payloads with event_source_id schema returns list."""
    from unittest.mock import MagicMock, patch

    from app.webhook_event_store import (
        WebhookEventSchema,
        recent_processed_payment_payloads,
    )

    mock_table = MagicMock()
    mock_schema = WebhookEventSchema(
        table=mock_table,
        columns=frozenset(
            [
                "id",
                "event_source_id",
                "event_source",
                "event_type",
                "payload",
                "processed",
                "created_at",
            ]
        ),
        external_id_column="event_source_id",
    )

    async with mem_session_factory() as db:
        with patch(
            "app.webhook_event_store.get_webhook_event_schema",
            new=AsyncMock(return_value=mock_schema),
        ):
            # No events in DB → empty result
            result = await recent_processed_payment_payloads(db)
    assert isinstance(result, list)
