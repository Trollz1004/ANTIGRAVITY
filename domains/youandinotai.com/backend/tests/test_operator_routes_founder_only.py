"""Tests ensuring operator/admin routers answer only the founder or an admin.

Covers:
1. app.auth.require_founder_or_admin (email in support_operator_email_list or is_admin; 403 otherwise; 401 unsigned)
2. admin/flags (/api/v1/admin/flags)
3. clawx (/api/v1/clawx)
4. marketing content writes (/api/v1/marketing/content POST, PUT, PATCH, publish, DELETE)
5. webhooks retry and dead-letter (/api/v1/webhooks/retry/{event_id}, /dead-letter, /retry-queue)
6. migrations (/api/v1/migrations/status, /health, /dry-run, /check)
7. rate-limits (/api/v1/rate-limits/status, /stats, /config, /reset)
8. ops-runs (/api/v1/ops-runs POST, GET, GET /{id})
9. notifications/broadcast (/api/v1/notifications/broadcast)
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.config import get_settings
from app.models import MarketingContent, User
from app.routers import clawx as clawx_router
from app.routers import migrations as migrations_router
from app.webhook_retry import WebhookDeadLetter
from tests.helpers import seed

FOUNDER_EMAIL = "founder@youandinotai.com"
MEMBER_EMAIL = "verified.member@example.com"


def _build_user(*, email: str, verified: bool = True) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed_pw",
        display_name="Test Account",
        is_active=True,
        bot_shield_verified=verified,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


def _marketing_payload(**overrides) -> dict:
    payload = {
        "campaign_name": "FounderLaunch",
        "objective": "Invite verified members to local events",
        "audience": "Verified members",
        "platforms": ["instagram"],
        "core_message": "Meet verified members offline.",
        "post_type": "story",
        "primary_caption": "Verified members only. #YouAndINotAI #BotShield",
        "call_to_action": "Join now",
        "hashtag_block": [
            "#YouAndINotAI",
            "#BotShield",
            "#DateWithPurpose",
        ],
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def _configure_founder_email(monkeypatch):
    monkeypatch.setenv("SUPPORT_OPERATOR_EMAILS", FOUNDER_EMAIL)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def seeded_principals(db_session_factory) -> tuple[User, User]:
    member = _build_user(email=MEMBER_EMAIL, verified=True)
    founder = _build_user(email=FOUNDER_EMAIL, verified=True)
    seed(member, founder, db_session_factory=db_session_factory)
    return member, founder


def test_require_founder_or_admin_exported_and_honors_is_admin():
    import app.auth as auth_mod
    from app.routers import metrics as metrics_mod

    assert hasattr(auth_mod, "require_founder_or_admin")
    assert metrics_mod._require_founder_or_admin is auth_mod.require_founder_or_admin

    ordinary = _build_user(email=MEMBER_EMAIL, verified=True)
    with pytest.raises(Exception) as exc_info:
        asyncio.run(auth_mod.require_founder_or_admin(user=ordinary))
    assert getattr(exc_info.value, "status_code", None) == 403

    founder = _build_user(email=FOUNDER_EMAIL, verified=True)
    assert asyncio.run(auth_mod.require_founder_or_admin(user=founder)) is founder

    admin_user = _build_user(email="admin.flag@example.com", verified=True)
    admin_user.is_admin = True
    assert asyncio.run(auth_mod.require_founder_or_admin(user=admin_user)) is admin_user


def test_admin_flags_router_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    # Unsigned -> 401
    assert client.get("/api/v1/admin/flags/").status_code == 401
    assert client.get("/api/v1/admin/flags/lovebot_enabled").status_code == 401
    assert (
        client.put(
            "/api/v1/admin/flags/lovebot_enabled", json={"value": True}
        ).status_code
        == 401
    )

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert client.get("/api/v1/admin/flags/", headers=member_hdrs).status_code == 403
    assert (
        client.get(
            "/api/v1/admin/flags/lovebot_enabled", headers=member_hdrs
        ).status_code
        == 403
    )
    assert (
        client.put(
            "/api/v1/admin/flags/lovebot_enabled",
            json={"value": False},
            headers=member_hdrs,
        ).status_code
        == 403
    )

    # Founder -> gets through
    founder_hdrs = _auth_headers(founder)
    assert client.get("/api/v1/admin/flags/", headers=founder_hdrs).status_code == 200
    assert (
        client.get(
            "/api/v1/admin/flags/lovebot_enabled", headers=founder_hdrs
        ).status_code
        == 200
    )
    assert (
        client.put(
            "/api/v1/admin/flags/lovebot_enabled",
            json={"value": True},
            headers=founder_hdrs,
        ).status_code
        == 200
    )


def test_clawx_router_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    fake_client = MagicMock()
    fake_client.list_agents.return_value = [
        {"name": "claude", "configured": True, "key_prefix": "sk-a***"}
    ]

    with patch.object(clawx_router, "_get_client", return_value=fake_client):
        # Unsigned -> 401
        assert client.get("/api/v1/clawx/agents").status_code == 401
        assert (
            client.post(
                "/api/v1/clawx/agents/claude/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
            ).status_code
            == 401
        )
        assert client.get("/api/v1/clawx/health").status_code == 401

        # Ordinary verified member -> 403
        member_hdrs = _auth_headers(member)
        assert (
            client.get("/api/v1/clawx/agents", headers=member_hdrs).status_code == 403
        )
        assert (
            client.post(
                "/api/v1/clawx/agents/claude/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
                headers=member_hdrs,
            ).status_code
            == 403
        )
        assert (
            client.get("/api/v1/clawx/health", headers=member_hdrs).status_code == 403
        )

        # Founder -> gets through
        founder_hdrs = _auth_headers(founder)
        assert (
            client.get("/api/v1/clawx/agents", headers=founder_hdrs).status_code == 200
        )
        assert (
            client.post(
                "/api/v1/clawx/agents/claude/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
                headers=founder_hdrs,
            ).status_code
            == 200
        )
        assert (
            client.get("/api/v1/clawx/health", headers=founder_hdrs).status_code == 200
        )


def test_marketing_content_writes_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    existing = MarketingContent(
        id=uuid.uuid4(),
        campaign_name="SeededCampaign",
        objective="Seeded objective",
        audience="Verified members",
        platforms=["instagram"],
        core_message="Core message",
        post_type="story",
        primary_caption="Caption #YouAndINotAI",
        call_to_action="Sign up",
        hashtag_block=["#YouAndINotAI", "#BotShield", "#DateWithPurpose"],
        published=False,
        created_by=founder.id,
    )
    seed(member, founder, existing, db_session_factory=db_session_factory)
    cid = str(existing.id)

    # Unsigned -> 401
    assert (
        client.post("/api/v1/marketing/content", json=_marketing_payload()).status_code
        == 401
    )
    assert (
        client.put(
            f"/api/v1/marketing/content/{cid}", json=_marketing_payload()
        ).status_code
        == 401
    )
    assert (
        client.patch(
            f"/api/v1/marketing/content/{cid}", json={"campaign_name": "Updated"}
        ).status_code
        == 401
    )
    assert client.post(f"/api/v1/marketing/content/{cid}/publish").status_code == 401
    assert client.delete(f"/api/v1/marketing/content/{cid}").status_code == 401

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert (
        client.post(
            "/api/v1/marketing/content",
            json=_marketing_payload(),
            headers=member_hdrs,
        ).status_code
        == 403
    )
    assert (
        client.put(
            f"/api/v1/marketing/content/{cid}",
            json=_marketing_payload(),
            headers=member_hdrs,
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/v1/marketing/content/{cid}",
            json={"campaign_name": "Updated"},
            headers=member_hdrs,
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/api/v1/marketing/content/{cid}/publish", headers=member_hdrs
        ).status_code
        == 403
    )
    assert (
        client.delete(
            f"/api/v1/marketing/content/{cid}", headers=member_hdrs
        ).status_code
        == 403
    )

    # Founder -> gets through on all write routes
    founder_hdrs = _auth_headers(founder)
    created = client.post(
        "/api/v1/marketing/content",
        json=_marketing_payload(),
        headers=founder_hdrs,
    )
    assert created.status_code == 201
    new_id = created.json()["id"]

    assert (
        client.put(
            f"/api/v1/marketing/content/{new_id}",
            json=_marketing_payload(campaign_name="ReplacedByFounder"),
            headers=founder_hdrs,
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/marketing/content/{new_id}",
            json={"campaign_name": "PatchedByFounder"},
            headers=founder_hdrs,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/marketing/content/{new_id}/publish", headers=founder_hdrs
        ).status_code
        == 200
    )
    assert (
        client.delete(
            f"/api/v1/marketing/content/{new_id}", headers=founder_hdrs
        ).status_code
        == 204
    )


def test_webhook_retry_and_dead_letter_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    dead = WebhookDeadLetter(
        event_id="evt_founder_retry",
        event_type="payment.updated",
        event_source="square",
        payload="{}",
        retry_count=5,
        final_error="boom",
    )
    seed(member, founder, dead, db_session_factory=db_session_factory)

    # Unsigned -> 401
    assert client.post("/api/v1/webhooks/retry/evt_founder_retry").status_code == 401
    assert client.get("/api/v1/webhooks/dead-letter").status_code == 401
    assert client.get("/api/v1/webhooks/retry-queue").status_code == 401

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert (
        client.post(
            "/api/v1/webhooks/retry/evt_founder_retry", headers=member_hdrs
        ).status_code
        == 403
    )
    assert (
        client.get("/api/v1/webhooks/dead-letter", headers=member_hdrs).status_code
        == 403
    )
    assert (
        client.get("/api/v1/webhooks/retry-queue", headers=member_hdrs).status_code
        == 403
    )

    # Founder -> gets through
    founder_hdrs = _auth_headers(founder)
    assert (
        client.get("/api/v1/webhooks/dead-letter", headers=founder_hdrs).status_code
        == 200
    )
    assert (
        client.get("/api/v1/webhooks/retry-queue", headers=founder_hdrs).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/webhooks/retry/evt_founder_retry", headers=founder_hdrs
        ).status_code
        == 200
    )


def test_migrations_router_access_control(db_session_factory):
    from app.database import get_db

    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    migrations_app = FastAPI()
    migrations_app.include_router(migrations_router.router)

    async def _override_get_db():
        async with db_session_factory() as session:
            yield session

    migrations_app.dependency_overrides[get_db] = _override_get_db

    with (
        patch.object(
            migrations_router,
            "_get_current_revision",
            new=AsyncMock(return_value="rev1"),
        ),
        patch.object(
            migrations_router, "_get_applied_count", new=AsyncMock(return_value=1)
        ),
        patch(
            "scripts.migration_safety.get_migration_health",
            return_value={"status": "healthy"},
        ),
        patch(
            "scripts.migration_safety.dry_run_migration",
            return_value={"sql": "SELECT 1;", "errors": []},
        ),
        patch(
            "scripts.migration_safety.run_all_checks",
            return_value=[{"check": "locks", "passed": True}],
        ),
        TestClient(migrations_app) as mig_client,
    ):
        # Unsigned -> 401
        assert mig_client.get("/api/v1/migrations/status").status_code == 401
        assert mig_client.get("/api/v1/migrations/health").status_code == 401
        assert mig_client.post("/api/v1/migrations/dry-run").status_code == 401
        assert mig_client.post("/api/v1/migrations/check").status_code == 401

        # Ordinary verified member -> 403
        member_hdrs = _auth_headers(member)
        assert (
            mig_client.get("/api/v1/migrations/status", headers=member_hdrs).status_code
            == 403
        )
        assert (
            mig_client.get("/api/v1/migrations/health", headers=member_hdrs).status_code
            == 403
        )
        assert (
            mig_client.post(
                "/api/v1/migrations/dry-run", headers=member_hdrs
            ).status_code
            == 403
        )
        assert (
            mig_client.post("/api/v1/migrations/check", headers=member_hdrs).status_code
            == 403
        )

        # Founder -> gets through
        founder_hdrs = _auth_headers(founder)
        assert (
            mig_client.get(
                "/api/v1/migrations/status", headers=founder_hdrs
            ).status_code
            == 200
        )
        assert (
            mig_client.get(
                "/api/v1/migrations/health", headers=founder_hdrs
            ).status_code
            == 200
        )
        assert (
            mig_client.post(
                "/api/v1/migrations/dry-run", headers=founder_hdrs
            ).status_code
            == 200
        )
        assert (
            mig_client.post(
                "/api/v1/migrations/check", headers=founder_hdrs
            ).status_code
            == 200
        )


def test_rate_limits_router_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    # Unsigned -> 401
    assert client.get("/api/v1/rate-limits/status").status_code == 401
    assert client.get("/api/v1/rate-limits/stats").status_code == 401
    assert client.get("/api/v1/rate-limits/config").status_code == 401
    assert client.post("/api/v1/rate-limits/reset").status_code == 401

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert (
        client.get("/api/v1/rate-limits/status", headers=member_hdrs).status_code == 403
    )
    assert (
        client.get("/api/v1/rate-limits/stats", headers=member_hdrs).status_code == 403
    )
    assert (
        client.get("/api/v1/rate-limits/config", headers=member_hdrs).status_code == 403
    )
    assert (
        client.post("/api/v1/rate-limits/reset", headers=member_hdrs).status_code == 403
    )

    # Founder -> gets through
    founder_hdrs = _auth_headers(founder)
    assert (
        client.get("/api/v1/rate-limits/status", headers=founder_hdrs).status_code
        == 200
    )
    assert (
        client.get("/api/v1/rate-limits/stats", headers=founder_hdrs).status_code == 200
    )
    assert (
        client.get("/api/v1/rate-limits/config", headers=founder_hdrs).status_code
        == 200
    )
    assert (
        client.post("/api/v1/rate-limits/reset", headers=founder_hdrs).status_code
        == 200
    )


def test_ops_runs_router_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    # Unsigned -> 401
    assert (
        client.post(
            "/api/v1/ops-runs", json={"script": "check.sh", "status": "success"}
        ).status_code
        == 401
    )
    assert client.get("/api/v1/ops-runs").status_code == 401
    assert client.get("/api/v1/ops-runs/some-id").status_code == 401

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert (
        client.post(
            "/api/v1/ops-runs",
            json={"script": "check.sh", "status": "success"},
            headers=member_hdrs,
        ).status_code
        == 403
    )
    assert client.get("/api/v1/ops-runs", headers=member_hdrs).status_code == 403
    assert (
        client.get("/api/v1/ops-runs/some-id", headers=member_hdrs).status_code == 403
    )

    # Founder -> gets through
    founder_hdrs = _auth_headers(founder)
    created = client.post(
        "/api/v1/ops-runs",
        json={"script": "check.sh", "status": "success"},
        headers=founder_hdrs,
    )
    assert created.status_code == 201
    run_id = created.json()["id"]
    assert client.get("/api/v1/ops-runs", headers=founder_hdrs).status_code == 200
    assert (
        client.get(f"/api/v1/ops-runs/{run_id}", headers=founder_hdrs).status_code
        == 200
    )


def test_notifications_broadcast_access_control(client, db_session_factory):
    member, founder = (
        _build_user(email=MEMBER_EMAIL, verified=True),
        _build_user(email=FOUNDER_EMAIL, verified=True),
    )
    seed(member, founder, db_session_factory=db_session_factory)

    # Unsigned -> 401
    assert (
        client.post(
            "/api/v1/notifications/broadcast", json={"type": "agent_activity"}
        ).status_code
        == 401
    )

    # Ordinary verified member -> 403
    member_hdrs = _auth_headers(member)
    assert (
        client.post(
            "/api/v1/notifications/broadcast",
            json={"type": "agent_activity"},
            headers=member_hdrs,
        ).status_code
        == 403
    )

    # Founder -> gets through (202 Accepted)
    founder_hdrs = _auth_headers(founder)
    assert (
        client.post(
            "/api/v1/notifications/broadcast",
            json={"type": "agent_activity"},
            headers=founder_hdrs,
        ).status_code
        == 202
    )
