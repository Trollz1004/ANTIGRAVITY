"""Health router tests for Square readiness reporting."""

import asyncio
import os
from types import SimpleNamespace
from unittest.mock import AsyncMock

os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-characters-long-for-security"

from app.routers import health


def _settings(
    *,
    access_token: str = "square-access-token",
    location_id: str = "LY5GN09F5AN83",
    verify_signature: bool = True,
    signature_key: str = "sig-key",
    notification_url: str = "https://api.youandinotai.com/api/v1/webhooks/square-payment",
):
    return SimpleNamespace(
        square_access_token=access_token,
        square_location_id=location_id,
        square_webhook_verify_signature=verify_signature,
        square_payment_webhook_signature_key=signature_key,
        square_payment_webhook_notification_url=notification_url,
        square_webhook_signature_key=signature_key,
        square_webhook_notification_url=notification_url,
    )


def test_square_health_ready_requires_dynamic_square_credentials(monkeypatch):
    monkeypatch.setattr(health, "settings", _settings(access_token=""))
    assert health._square_health_ready() is False


def test_square_health_ready_requires_signature_material_when_enabled(monkeypatch):
    monkeypatch.setattr(health, "settings", _settings(signature_key=""))
    assert health._square_health_ready() is False


def test_health_check_reports_square_connected(monkeypatch):
    mock_db = AsyncMock()
    mock_db.scalar = AsyncMock(return_value=7)

    monkeypatch.setattr(health, "settings", _settings())
    monkeypatch.setattr(health, "check_db_health", AsyncMock(return_value=True))

    response = asyncio.run(health.health_check(mock_db))

    assert response.status == "ok"
    assert response.db_connected is True
    assert response.square_connected is True
    assert response.user_count == 7
