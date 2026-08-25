"""Tests for app/database.py utilities and app/routers/health.py endpoints."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app import database
from app.database import (
    Base,
    _reconcile_sqlite_schema,
    check_db_health,
    get_db,
    get_pool_status,
    reconcile_legacy_schema,
)
from tests.helpers import seed


@pytest.mark.asyncio
class TestDatabaseUtilities:
    async def test_get_db_yields_session(self):
        gen = get_db()
        session = await gen.__anext__()
        try:
            from sqlalchemy.ext.asyncio import AsyncSession

            assert isinstance(session, AsyncSession)
        finally:
            with pytest.raises(StopAsyncIteration):
                await gen.__anext__()

    async def test_check_db_health_true_and_false(self):
        assert await check_db_health() is True

        fail_engine = MagicMock()
        fail_cm = AsyncMock()
        fail_cm.__aenter__ = AsyncMock(side_effect=RuntimeError("connection refused"))
        fail_cm.__aexit__ = AsyncMock(return_value=False)
        fail_engine.connect = MagicMock(return_value=fail_cm)

        with patch.object(database, "engine", fail_engine):
            assert await check_db_health() is False

    async def test_get_pool_status_shape(self):
        status = await get_pool_status()
        assert set(status) == {"size", "checked_in", "checked_out", "overflow"}

    async def test_reconcile_skipped_under_test_env(self):
        with patch.object(database.settings, "app_env", "test"):
            # Returns immediately without touching the engine
            await reconcile_legacy_schema()

    async def test_reconcile_runs_create_all_and_sqlite_reconcile(self):
        """Full reconcile on the SQLite engine — covers the schema backfill path."""
        with patch.object(database.settings, "app_env", "development"):
            await reconcile_legacy_schema()
            # Idempotent: repeated calls must succeed
            await reconcile_legacy_schema()

    async def test_sqlite_reconcile_directly(self):
        engine = database.engine
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with engine.connect() as conn:
            await _reconcile_sqlite_schema(conn)
            await conn.commit()


# ── Health router endpoints ──────────────────────────────────────────────────


def test_health_endpoint_full_shape(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["db_connected"] is True
    assert "redis_connected" in data
    assert data["status"] in ("ok", "degraded")
    assert data["wallet_rails_status"] in ("proven", "unproven")
    assert isinstance(data["payment_proof_labels"], list)
    assert isinstance(data["user_count"], int)


def test_health_allocations_empty_and_populated(client, db_session_factory):
    from app.models import RevenueAllocation

    resp = client.get("/api/v1/health/allocations")
    assert resp.status_code == 200
    assert resp.json() == {"allocations": []}

    allocation = RevenueAllocation(
        user_id=None,
        source_event_id="evt_health_1",
        square_payment_id="pay_health_1",
        payment_tier="bot_shield",
        gross_amount_cents=100,
        reserve_amount_cents=0,
        operating_amount_cents=100,
        payer_type="customer",
    )
    seed(allocation, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/health/allocations")
    assert resp.status_code == 200
    rows = resp.json()["allocations"]
    assert len(rows) == 1
    assert rows[0]["square_payment_id"] == "pay_health_1"
    assert rows[0]["status"] == "reserved"


def test_health_allocations_summary_groups_by_payer(client, db_session_factory):
    from app.models import RevenueAllocation

    customer = RevenueAllocation(
        user_id=None,
        source_event_id="evt_sum_c",
        square_payment_id="pay_sum_c",
        payment_tier="bot_shield",
        gross_amount_cents=100,
        reserve_amount_cents=0,
        operating_amount_cents=100,
        payer_type="customer",
    )
    founder = RevenueAllocation(
        user_id=None,
        source_event_id="evt_sum_f",
        square_payment_id="pay_sum_f",
        payment_tier="founding_member",
        gross_amount_cents=1499,
        reserve_amount_cents=0,
        operating_amount_cents=1499,
        payer_type="founder_test",
    )
    seed(customer, founder, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/health/allocations/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["customer_only"]["payments"] == 1
    assert data["customer_only"]["gross_cents"] == 100
    assert data["founder_test"]["payments"] == 1
    assert data["founder_test"]["gross_cents"] == 1499
    assert data["with_test"]["payments"] == 2
    assert data["with_test"]["gross_cents"] == 1599
    # There is no revenue split. The summary reports payments and gross only;
    # any reserve/operating field reappearing here is a regression.
    for bucket in ("customer_only", "founder_test", "with_test"):
        assert set(data[bucket]) == {
            "payments",
            "gross_cents",
        }, f"{bucket} exposed unexpected fields: {sorted(data[bucket])}"


def test_health_allocations_summary_empty(client):
    resp = client.get("/api/v1/health/allocations/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["customer_only"]["payments"] == 0
    assert data["with_test"]["gross_cents"] == 0


def test_health_webhooks_listing(client, db_session_factory):
    from app.models import WebhookEvent

    event = WebhookEvent(
        event_source_id="evt_health_webhook",
        event_type="payment.updated",
        payload={"k": "v"},
        processed=True,
        created_at=datetime.now(timezone.utc),
    )
    seed(event, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/health/webhooks")
    assert resp.status_code == 200
    rows = resp.json()["webhooks"]
    assert len(rows) == 1
    assert rows[0]["event_source_id"] == "evt_health_webhook"
    assert rows[0]["processed"] in (True, 1)


def test_health_wallet_rails_proven_with_square_labels(client, db_session_factory):
    """A processed Square payment proves wallet rails."""
    from app.models import WebhookEvent

    payload = {
        "data": {
            "object": {
                "payment": {
                    "id": "pay_wallet_1",
                    "status": "COMPLETED",
                    "note": "Bot-Shield Verification",
                    "card_details": {
                        "card": {"card_brand": "VISA"},
                        "wallet_details": {
                            "status": "CAPTURED",
                            "brand": "CASH_APP",
                        },
                    },
                }
            }
        }
    }
    event = WebhookEvent(
        event_source_id="evt_wallet_proof",
        event_type="payment.completed",
        payload=payload,
        processed=True,
        created_at=datetime.now(timezone.utc),
    )
    seed(event, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["wallet_rails_proven"] is True
    assert data["wallet_rails_status"] == "proven"
    assert len(data["payment_proof_labels"]) >= 1
