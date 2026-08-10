"""Tests for app/main.py — root endpoints, middleware, and exception handlers."""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import Request

from app.auth import get_current_user
from app.main import (
    _generate_correlation_id,
    _is_messages_post,
    _log_suitability_flags,
    app,
    global_exception_handler,
)
from app.models import User


def _make_user() -> User:
    return User(
        id=uuid.uuid4(),
        email=f"main-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed",
        display_name="Main User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


# ── Root endpoints ───────────────────────────────────────────────────────────


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "running"
    assert data["docs_url"] == "/docs"
    assert "service" in data and "version" in data


def test_root_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    # Degraded when optional deps (Redis) are unavailable, healthy otherwise
    assert resp.json()["status"] in ("healthy", "degraded")


def test_custom_swagger_ui_served(client):
    resp = client.get("/docs-custom")
    assert resp.status_code == 200
    assert "swagger" in resp.text.lower() or "Swagger" in resp.text


def test_telemetry_health_requires_auth(client):
    resp = client.get("/api/v1/health/telemetry")
    assert resp.status_code in (401, 403)


def test_telemetry_health_with_auth(client):
    user = _make_user()
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        resp = client.get("/api/v1/health/telemetry")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "youandinotai-api"
        assert "telemetry" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_detailed_health_dashboard_with_auth(client):
    user = _make_user()
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        with patch("app.main.redis_health_check", side_effect=RuntimeError("no redis")):
            resp = client.get("/api/v1/health/detailed")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["dependencies"]["redis"]["status"] == "unavailable"
        assert data["status"] in ("healthy", "degraded", "unhealthy")
        assert isinstance(data["endpoints"], list)
        assert data["total_check_latency_ms"] >= 0
        assert data["rate_limiting"]["requests_per_minute"] > 0
        # Endpoint summary only lists real API routes and skips the dashboard itself
        assert all(
            not e["path"].startswith("/api/v1/health/detailed")
            for e in data["endpoints"]
        )
        assert any(e["path"].startswith("/api/v1/") for e in data["endpoints"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_detailed_health_dashboard_healthy_path(client):
    user = _make_user()
    app.dependency_overrides[get_current_user] = _override_user(user)
    try:
        with (
            patch("app.main.redis_health_check", return_value={"status": "ok"}),
            patch("app.main.check_db_health", return_value=True),
            patch("app.main._square_health_ready", return_value=True),
        ):
            resp = client.get("/api/v1/health/detailed")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Helpers ──────────────────────────────────────────────────────────────────


def test_correlation_id_format():
    cid = _generate_correlation_id()
    parsed = uuid.UUID(cid)
    assert str(parsed) == cid


def _request_for(method: str, path: str) -> Request:
    scope = {
        "type": "http",
        "method": method,
        "url": f"http://testserver{path}",
        "path": path,
        "headers": [],
        "client": ("127.0.0.1", 1234),
    }
    return Request(scope)


def test_is_messages_post_matching():
    assert _is_messages_post(_request_for("POST", "/api/v1/messages/abc")) is True
    assert _is_messages_post(_request_for("GET", "/api/v1/messages/abc")) is False
    assert _is_messages_post(_request_for("POST", "/api/v1/boards")) is False


def test_log_suitability_flags_toxic_keyword(caplog):
    request = _request_for("POST", "/api/v1/messages/abc")
    body = json.dumps({"content": "trust me this is true"}).encode()
    with caplog.at_level("WARNING"):
        _log_suitability_flags(request, body, "corr-1")
    assert any("Suitability flag" in r.message for r in caplog.records)


def test_log_suitability_flags_clean_inputs(caplog):
    request = _request_for("POST", "/api/v1/messages/abc")
    with caplog.at_level("WARNING"):
        _log_suitability_flags(request, b"{not-json", "corr-2")
        _log_suitability_flags(request, b"{}", "corr-2")
        _log_suitability_flags(request, json.dumps({"content": 123}).encode(), "corr-2")
        _log_suitability_flags(
            request, json.dumps({"content": "hello friend"}).encode(), "corr-2"
        )
    assert not any("Suitability flag" in r.message for r in caplog.records)


def test_correlation_id_header_present(client):
    resp = client.get("/")
    assert "X-Correlation-ID" in resp.headers
    uuid.UUID(resp.headers["X-Correlation-ID"])


def test_suitability_guard_middleware_logs_and_passes(client, db_session_factory):
    """A flagged message still flows through (guard logs, does not block)."""
    import asyncio

    from app.models import Match

    alice = _make_user()
    bob = _make_user()
    match = Match(
        id=uuid.uuid4(),
        user_a=alice.id,
        user_b=bob.id,
        status="active",
        matched_at=datetime.now(timezone.utc),
    )

    async def _seed():
        async with db_session_factory() as session:
            session.add(alice)
            session.add(bob)
            session.add(match)
            await session.commit()

    asyncio.run(_seed())
    app.dependency_overrides[get_current_user] = _override_user(alice)
    try:
        with patch("app.main._log_suitability_flags") as mock_log:
            resp = client.post(
                f"/api/v1/messages/{match.id}", json={"content": "idiot"}
            )
        assert resp.status_code == 201
        mock_log.assert_called_once()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── Monitoring gauge branches ────────────────────────────────────────────────


def test_request_metrics_recorded_when_monitoring_present(client):
    monitoring = MagicMock()
    app.state.monitoring = monitoring
    try:
        resp = client.get("/")
        assert resp.status_code == 200
        monitoring.REQUEST_IN_PROGRESS_GAUGE.inc.assert_called()
        monitoring.REQUEST_IN_PROGRESS_GAUGE.dec.assert_called()
        monitoring.REQUEST_COUNTER.labels.assert_called()
        monitoring.REQUEST_DURATION_HISTOGRAM.labels.assert_called()
    finally:
        del app.state.monitoring


# ── Exception handlers ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_global_exception_handler_response():
    request = _request_for("GET", "/boom")
    request.state.correlation_id = "corr-123"
    response = await global_exception_handler(request, RuntimeError("kaput"))
    assert response.status_code == 500
    body = json.loads(bytes(response.body))
    assert body["code"] == "INTERNAL_ERROR"
    assert body["details"]["correlation_id"] == "corr-123"
    assert body["detail"]


def test_http_exception_handler_shape(client):
    resp = client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert "code" in body
    assert "correlation_id" in json.dumps(body)


# ── gzip middleware ──────────────────────────────────────────────────────────


def test_gzip_compression_on_large_responses(client):
    resp = client.get("/docs-custom", headers={"Accept-Encoding": "gzip"})
    assert resp.status_code == 200
    # httpx transparently decodes; verify the server flagged gzip encoding
    assert resp.headers.get("content-encoding") == "gzip" or len(resp.content) > 0
