"""Tests for the rate-limit monitoring router and its in-memory store."""

import time
import uuid
from datetime import datetime, timezone

import pytest

from app.auth import get_current_user
from app.main import app
from app.models import User
from app.routers import rate_limits as rl


@pytest.fixture(autouse=True)
def _reset_store():
    rl._request_counts.clear()
    rl._window_start = time.time()
    rl._requests_this_minute = 0
    rl._total_today = 0
    rl._day_start = time.time()
    yield
    rl._request_counts.clear()
    rl._requests_this_minute = 0
    rl._total_today = 0


@pytest.fixture()
def authed_client(client):
    user = User(
        id=uuid.uuid4(),
        email=f"rl-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="RL User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    async def _dep():
        return user

    app.dependency_overrides[get_current_user] = _dep
    yield client
    app.dependency_overrides.pop(get_current_user, None)


class TestStoreBehavior:
    def test_record_request_counts(self):
        rl.record_request("/a")
        rl.record_request("/a")
        rl.record_request("/b")
        assert rl._request_counts["/a"] == 2
        assert rl._request_counts["/b"] == 1
        assert rl._requests_this_minute == 3
        assert rl._total_today == 3

    def test_window_rollover_resets_minute_counter(self):
        rl._window_start = time.time() - 61
        rl._requests_this_minute = 50
        rl.record_request("/x")
        assert rl._requests_this_minute == 1

    def test_day_rollover_clears_everything(self):
        rl._day_start = time.time() - 86401
        rl._total_today = 100
        rl._request_counts["/old"] = 5
        rl.record_request("/new")
        assert rl._total_today == 1
        assert "/old" not in rl._request_counts


class TestEndpoints:
    def test_status_shape_and_top_endpoints(self, authed_client):
        for _ in range(3):
            rl.record_request("/api/v1/health")
        rl.record_request("/api/v1/boards")

        resp = authed_client.get("/api/v1/rate-limits/status")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["requestsThisMinute"] == 4
        assert data["totalRequestsToday"] == 4
        assert data["requestsPerMinute"] == 60
        assert 0 <= data["resetInSeconds"] <= 60
        assert data["topEndpoints"][0]["path"] == "/api/v1/health"
        assert data["topEndpoints"][0]["count"] == 3

    def test_stats_endpoint_matches_status(self, authed_client):
        rl.record_request("/a")
        resp = authed_client.get("/api/v1/rate-limits/stats")
        assert resp.status_code == 200
        assert resp.json()["requestsThisMinute"] == 1

    def test_config_endpoint(self, authed_client):
        resp = authed_client.get("/api/v1/rate-limits/config")
        assert resp.status_code == 200
        assert resp.json() == {
            "requestsPerMinute": 60,
            "burstSize": 10,
            "windowSeconds": 60,
        }

    def test_reset_endpoint_clears_stats(self, authed_client):
        rl.record_request("/busy")
        resp = authed_client.post("/api/v1/rate-limits/reset")
        assert resp.status_code == 200
        assert resp.json() == {"status": "reset"}

        after = authed_client.get("/api/v1/rate-limits/status").json()
        # Historical counts are gone — the only remaining entries are the
        # middleware-recorded reset/status calls themselves.
        paths = [ep["path"] for ep in after["topEndpoints"]]
        assert "/busy" not in paths
        assert after["totalRequestsToday"] <= 2

    def test_requires_auth(self, client):
        assert client.get("/api/v1/rate-limits/status").status_code in (401, 403)
        assert client.get("/api/v1/rate-limits/stats").status_code in (401, 403)
        assert client.get("/api/v1/rate-limits/config").status_code in (401, 403)
        assert client.post("/api/v1/rate-limits/reset").status_code in (401, 403)
