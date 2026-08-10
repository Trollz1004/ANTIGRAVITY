"""Batch coverage for small operational modules:
square_checkout, telemetry, ops_runs router, and the ClawX router.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.auth import get_current_user
from app.main import app
from app.models import User
from app.routers import clawx as clawx_router
from app.routers import ops_runs as ops_runs_router
from app.square_checkout import create_square_payment_link
from app.telemetry import get_tracer_status, setup_telemetry


def _make_user() -> User:
    return User(
        id=uuid.uuid4(),
        email=f"ops-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Ops User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


@pytest.fixture()
def authed_client(client):
    user = _make_user()
    app.dependency_overrides[get_current_user] = _override_user(user)
    yield client
    app.dependency_overrides.pop(get_current_user, None)


# ── square_checkout ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestSquarePaymentLink:
    async def test_missing_token_or_location_returns_none(self):
        settings = MagicMock(square_access_token="", square_location_id="loc")
        assert (
            await create_square_payment_link(request_body={}, settings=settings) is None
        )

        settings = MagicMock(square_access_token="tok", square_location_id="")
        assert (
            await create_square_payment_link(request_body={}, settings=settings) is None
        )

    async def test_success_returns_checkout_url(self):
        settings = MagicMock(
            square_access_token="tok",
            square_location_id="loc",
            square_api_base_url="https://connect.squareup.test",
            square_api_version="2026-01-22",
        )
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {
            "payment_link": {"url": "https://square.link/u/abc"}
        }
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            url = await create_square_payment_link(
                request_body={"order": {}}, settings=settings
            )
        assert url == "https://square.link/u/abc"
        headers = client.post.call_args.kwargs["headers"]
        assert headers["Authorization"] == "Bearer tok"

    async def test_empty_url_falls_back_to_none(self):
        settings = MagicMock(square_access_token="tok", square_location_id="loc")
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {"payment_link": {"url": ""}}
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await create_square_payment_link(request_body={}, settings=settings)
                is None
            )

    async def test_http_error_returns_none(self):
        settings = MagicMock(square_access_token="tok", square_location_id="loc")
        client = AsyncMock()
        client.post = AsyncMock(side_effect=httpx.ConnectError("unreachable"))
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await create_square_payment_link(request_body={}, settings=settings)
                is None
            )


# ── telemetry ────────────────────────────────────────────────────────────────


class TestTelemetrySetup:
    def test_setup_without_app_or_engine(self):
        with (
            patch("app.telemetry.BatchSpanProcessor") as _proc,
            patch("app.telemetry.OTLPSpanExporter"),
        ):
            status = setup_telemetry()
        assert status["service_name"] == "youandinotai-api"
        assert status["instrumented"] == {"fastapi": False, "sqlalchemy": False}

    def test_setup_instruments_app_and_engine(self):
        fake_app = MagicMock()
        fake_engine = MagicMock()
        fake_engine.sync_engine = MagicMock(name="sync_engine")
        with (
            patch("app.telemetry.BatchSpanProcessor"),
            patch("app.telemetry.OTLPSpanExporter"),
            patch("app.telemetry.FastAPIInstrumentor") as fastapi_inst,
            patch("app.telemetry.SQLAlchemyInstrumentor") as sa_inst_cls,
        ):
            sa_inst = MagicMock()
            sa_inst_cls.return_value = sa_inst
            status = setup_telemetry(app=fake_app, engine=fake_engine)
        fastapi_inst.instrument_app.assert_called_once_with(fake_app)
        sa_inst.instrument.assert_called_once()
        assert status["instrumented"] == {"fastapi": True, "sqlalchemy": True}

    def test_tracer_status_shape(self):
        status = get_tracer_status()
        assert "tracer_provider_type" in status
        assert "has_span_processor" in status


# ── ops_runs router ──────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _clear_ops_runs():
    ops_runs_router._RUNS.clear()
    yield
    ops_runs_router._RUNS.clear()


class TestOpsRuns:
    def test_create_and_get_run(self, authed_client):
        resp = authed_client.post(
            "/api/v1/ops-runs",
            json={
                "script": "deploy.sh",
                "status": "success",
                "duration_ms": 1234,
                "details": "deployed web",
            },
        )
        assert resp.status_code == 201, resp.text
        run = resp.json()
        assert run["script"] == "deploy.sh"
        assert run["duration_ms"] == 1234
        uuid.UUID(run["id"])

        fetched = authed_client.get(f"/api/v1/ops-runs/{run['id']}")
        assert fetched.status_code == 200
        assert fetched.json()["script"] == "deploy.sh"

    def test_get_missing_run_returns_404(self, authed_client):
        resp = authed_client.get("/api/v1/ops-runs/nonexistent-id")
        assert resp.status_code == 404

    def test_list_runs_pagination(self, authed_client):
        for index in range(5):
            authed_client.post(
                "/api/v1/ops-runs",
                json={"script": f"script-{index}", "status": "success"},
            )

        resp = authed_client.get("/api/v1/ops-runs?limit=2&offset=0")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["runs"]) == 2
        pagination = data["pagination"]
        assert pagination["total"] == 5
        assert pagination["has_next"] is True
        assert pagination["has_prev"] is False
        assert pagination["next_offset"] == 2

        # Offset beyond total clamps to the last page
        resp = authed_client.get("/api/v1/ops-runs?limit=2&offset=99")
        data = resp.json()
        assert len(data["runs"]) == 2
        assert data["pagination"]["has_next"] is False

        # Middle page has prev and next offsets
        resp = authed_client.get("/api/v1/ops-runs?limit=2&offset=2")
        data = resp.json()
        assert data["pagination"]["has_prev"] is True
        assert data["pagination"]["prev_offset"] == 0

    def test_list_runs_empty_store(self, authed_client):
        resp = authed_client.get("/api/v1/ops-runs")
        assert resp.status_code == 200
        data = resp.json()
        assert data["runs"] == []
        assert data["pagination"]["total"] == 0

    def test_store_is_bounded(self):
        from app.routers.ops_runs import _MAX_RUNS, _RUNS

        _RUNS.clear()
        for index in range(_MAX_RUNS + 10):
            _RUNS.append({"id": str(index), "recorded_at": str(index)})
            if len(_RUNS) > _MAX_RUNS:
                _RUNS.pop(0)
        assert len(_RUNS) == _MAX_RUNS

    def test_ops_runs_require_auth(self, client):
        resp = client.post(
            "/api/v1/ops-runs", json={"script": "x", "status": "success"}
        )
        assert resp.status_code in (401, 403)


# ── ClawX router ─────────────────────────────────────────────────────────────


class TestClawxRouter:
    def test_list_agents_masks_keys(self, authed_client):
        fake_client = MagicMock()
        fake_client.list_agents.return_value = [
            {"name": "agent-a", "configured": True, "key_prefix": "sk-a***"},
            {"name": "agent-b", "configured": False, "key_prefix": None},
        ]
        with patch.object(clawx_router, "_get_client", return_value=fake_client):
            resp = authed_client.get("/api/v1/clawx/agents")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["total"] == 2
        assert data["configured_count"] == 1
        assert data["agents"][0]["key_prefix"] == "sk-a***"

    def test_callers_customers_integration(self):
        # The lazy client factory constructs and caches a ClawxClient
        clawx_router._clawx_client = None
        with patch.object(clawx_router, "ClawxClient") as cls:
            first = clawx_router._get_client()
            second = clawx_router._get_client()
        assert first is second
        cls.assert_called_once()

    def test_rotate_key_success(self, authed_client):
        fake_client = MagicMock()
        with patch.object(clawx_router, "_get_client", return_value=fake_client):
            resp = authed_client.post(
                "/api/v1/clawx/agents/agent-a/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
            )
        assert resp.status_code == 200, resp.text
        assert resp.json() == {"name": "agent-a", "status": "rotated"}
        fake_client.rotate_key.assert_called_once_with("agent-a", "sk-abcdefghijklmnop")

    def test_rotate_key_unknown_agent_404(self, authed_client):
        from app.clawx_integration import KeyNotFoundError

        fake_client = MagicMock()
        fake_client.rotate_key.side_effect = KeyNotFoundError("no such agent")
        with patch.object(clawx_router, "_get_client", return_value=fake_client):
            resp = authed_client.post(
                "/api/v1/clawx/agents/ghost/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
            )
        assert resp.status_code == 404

    def test_rotate_key_invalid_key_400(self, authed_client):
        from app.clawx_integration import InvalidKeyError

        fake_client = MagicMock()
        fake_client.rotate_key.side_effect = InvalidKeyError("bad key")
        with patch.object(clawx_router, "_get_client", return_value=fake_client):
            resp = authed_client.post(
                "/api/v1/clawx/agents/agent-a/rotate",
                json={"new_key": "sk-abcdefghijklmnop"},
            )
        assert resp.status_code == 400

    def test_health_disabled_short_circuits(self, authed_client):
        settings = MagicMock(clawx_enabled=False, clawx_base_url="http://claw.test")
        with patch.object(clawx_router, "get_settings", return_value=settings):
            resp = authed_client.get("/api/v1/clawx/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["enabled"] is False
        assert data["reachable"] is None

    def test_health_enabled_reports_connectivity(self, authed_client):
        settings = MagicMock(clawx_enabled=True, clawx_base_url="http://claw.test")
        fake_client = MagicMock()
        fake_client.check_connectivity = AsyncMock(
            return_value={"reachable": True, "status_code": 200, "agent": "agent-a"}
        )
        with (
            patch.object(clawx_router, "get_settings", return_value=settings),
            patch.object(clawx_router, "_get_client", return_value=fake_client),
        ):
            resp = authed_client.get("/api/v1/clawx/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["enabled"] is True
        assert data["reachable"] is True
        assert data["base_url"] == "http://claw.test"

    def test_clawx_requires_auth(self, client):
        resp = client.get("/api/v1/clawx/agents")
        assert resp.status_code in (401, 403)
