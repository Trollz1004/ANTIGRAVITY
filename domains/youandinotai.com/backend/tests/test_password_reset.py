"""Tests for the single-use 30-minute password reset flow and /health mail flag."""

import asyncio
import logging
import re
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from freezegun import freeze_time
from sqlalchemy import select

from app.auth import _hash_token
from app.config import get_settings


def _register_payload(
    email: str = "reset-member@example.com", password: str = "OldPassword123!"
) -> dict:
    return {
        "email": email,
        "password": password,
        "display_name": "Reset Member",
        "date_of_birth": "1992-04-15",
        "accepted_terms": True,
        "accepted_cookie_policy": True,
        "confirmed_over_18": True,
    }


def _extract_token_from_deliver_mock(mock_deliver) -> str:
    assert mock_deliver.called, "Expected _deliver_email to be called"
    message = mock_deliver.call_args.args[0]
    plain_body = message.get_body(preferencelist=("plain",)).get_content()
    match = re.search(r"/reset-password\?token=([A-Za-z0-9_-]+)", plain_body)
    assert match is not None, f"Reset URL not found in email body: {plain_body}"
    return urllib.parse.unquote(match.group(1))


def test_forgot_password_returns_identical_200_for_existing_and_unknown_email_and_stores_hash_only(
    client, db_session_factory, monkeypatch
):
    from app.models_password_reset import PasswordResetToken

    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "noreply@youandinotai.com")
    monkeypatch.setenv("SMTP_USERNAME", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    get_settings.cache_clear()

    reg_resp = client.post("/api/v1/auth/register", json=_register_payload())
    assert reg_resp.status_code == 201, reg_resp.text
    user_id = uuid.UUID(reg_resp.json()["user_id"])

    with patch("app.email_service._deliver_email") as mock_deliver:
        unknown_resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )
        assert unknown_resp.status_code == 200, unknown_resp.text
        assert mock_deliver.call_count == 0

        existing_resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "  RESET-MEMBER@example.com "},
        )
        assert existing_resp.status_code == 200, existing_resp.text
        assert mock_deliver.call_count == 1
        raw_token = _extract_token_from_deliver_mock(mock_deliver)

    assert unknown_resp.json() == existing_resp.json()
    assert existing_resp.json() == {
        "received": True,
        "message": (
            "If an account exists for that email address, we sent a password reset link. "
            "It expires in 30 minutes."
        ),
    }

    async def _fetch_token_row() -> PasswordResetToken | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
            )

    row = asyncio.run(_fetch_token_row())
    assert row is not None
    assert row.token_hash == _hash_token(raw_token)
    assert row.token_hash != raw_token
    assert row.used_at is None
    expires_at = (
        row.expires_at
        if row.expires_at.tzinfo
        else row.expires_at.replace(tzinfo=timezone.utc)
    )
    delta_minutes = (expires_at - datetime.now(timezone.utc)).total_seconds() / 60.0
    assert 29.0 < delta_minutes <= 30.1

    get_settings.cache_clear()


def test_forgot_password_when_mail_not_configured_returns_same_200_and_logs_one_warning(
    client, caplog, monkeypatch
):
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "")
    get_settings.cache_clear()

    reg_resp = client.post(
        "/api/v1/auth/register",
        json=_register_payload("unconfigured-mail@example.com"),
    )
    assert reg_resp.status_code == 201, reg_resp.text

    with caplog.at_level(logging.WARNING):
        caplog.clear()
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "unconfigured-mail@example.com"},
        )

    assert resp.status_code == 200, resp.text
    assert resp.json() == {
        "received": True,
        "message": (
            "If an account exists for that email address, we sent a password reset link. "
            "It expires in 30 minutes."
        ),
    }
    mail_warnings = [
        rec
        for rec in caplog.records
        if rec.levelno == logging.WARNING
        and ("smtp" in rec.getMessage().lower() or "mail" in rec.getMessage().lower())
    ]
    assert len(mail_warnings) == 1

    get_settings.cache_clear()


def test_health_reports_mail_on_or_off_without_values(client, monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "")
    get_settings.cache_clear()

    off_resp = client.get("/health")
    assert off_resp.status_code == 200, off_resp.text
    assert off_resp.json()["mail"] == "off"

    v1_off_resp = client.get("/api/v1/health")
    assert v1_off_resp.status_code == 200, v1_off_resp.text
    assert v1_off_resp.json()["mail"] == "off"

    monkeypatch.setenv("SMTP_HOST", "smtp-relay.test-domain.internal")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "secret-sender@test-domain.internal")
    monkeypatch.setenv("SMTP_USERNAME", "secret-smtp-user")
    monkeypatch.setenv("SMTP_PASSWORD", "secret-smtp-pass-98765")
    get_settings.cache_clear()

    on_resp = client.get("/health")
    assert on_resp.status_code == 200, on_resp.text
    assert on_resp.json()["mail"] == "on"
    assert "smtp-relay.test-domain.internal" not in on_resp.text
    assert "secret-sender@test-domain.internal" not in on_resp.text
    assert "secret-smtp-user" not in on_resp.text
    assert "secret-smtp-pass-98765" not in on_resp.text

    get_settings.cache_clear()


def test_reset_password_succeeds_within_30_minutes_and_allows_new_login(
    client, monkeypatch
):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "noreply@youandinotai.com")
    get_settings.cache_clear()

    client.post(
        "/api/v1/auth/register",
        json=_register_payload("happy-reset@example.com", "OldPassword123!"),
    )

    with patch("app.email_service._deliver_email") as mock_deliver:
        forgot_resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "happy-reset@example.com"},
        )
        assert forgot_resp.status_code == 200
        raw_token = _extract_token_from_deliver_mock(mock_deliver)

    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword456!"},
    )
    assert reset_resp.status_code == 200, reset_resp.text
    assert reset_resp.json() == {
        "reset": True,
        "message": "Your password has been updated. Please sign in with your new password.",
    }

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "happy-reset@example.com", "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "happy-reset@example.com", "password": "NewPassword456!"},
    )
    assert new_login.status_code == 200, new_login.text
    assert new_login.json()["access_token"]

    get_settings.cache_clear()


def test_reset_password_token_is_single_use_and_superseded_by_newer_request(
    client, monkeypatch
):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "noreply@youandinotai.com")
    get_settings.cache_clear()

    client.post(
        "/api/v1/auth/register",
        json=_register_payload("single-use@example.com", "OldPassword123!"),
    )

    with patch("app.email_service._deliver_email") as mock_deliver:
        client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "single-use@example.com"},
        )
        first_token = _extract_token_from_deliver_mock(mock_deliver)

        # Requesting a second token burns the first token
        client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "single-use@example.com"},
        )
        second_token = _extract_token_from_deliver_mock(mock_deliver)

    assert first_token != second_token

    superseded_attempt = client.post(
        "/api/v1/auth/reset-password",
        json={"token": first_token, "new_password": "NewPassword456!"},
    )
    assert superseded_attempt.status_code == 400
    assert superseded_attempt.json()["details"]["code"] == "TOKEN_INVALID"

    first_use = client.post(
        "/api/v1/auth/reset-password",
        json={"token": second_token, "new_password": "NewPassword456!"},
    )
    assert first_use.status_code == 200, first_use.text

    second_use = client.post(
        "/api/v1/auth/reset-password",
        json={"token": second_token, "new_password": "ThirdPassword789!"},
    )
    assert second_use.status_code == 400
    assert second_use.json()["details"]["code"] == "TOKEN_INVALID"

    get_settings.cache_clear()


def test_reset_password_rejects_token_expired_after_30_minutes(client, monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "noreply@youandinotai.com")
    get_settings.cache_clear()

    with freeze_time("2026-11-22 12:00:00+00:00") as frozen:
        client.post(
            "/api/v1/auth/register",
            json=_register_payload("expired-reset@example.com", "OldPassword123!"),
        )
        with patch("app.email_service._deliver_email") as mock_deliver:
            client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "expired-reset@example.com"},
            )
            raw_token = _extract_token_from_deliver_mock(mock_deliver)

        frozen.tick(timedelta(minutes=31))

        expired_resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": "NewPassword456!"},
        )
        assert expired_resp.status_code == 400
        assert expired_resp.json()["details"]["code"] == "TOKEN_INVALID"

    get_settings.cache_clear()


def test_reset_password_ends_existing_sessions_refresh_and_access_tokens(
    client, monkeypatch
):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "noreply@youandinotai.com")
    get_settings.cache_clear()

    client.post(
        "/api/v1/auth/register",
        json=_register_payload("session-burn@example.com", "OldPassword123!"),
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "session-burn@example.com", "password": "OldPassword123!"},
    )
    assert login_resp.status_code == 200, login_resp.text
    old_access_token = login_resp.json()["access_token"]
    old_refresh_token = login_resp.json()["refresh_token"]

    me_before = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {old_access_token}"},
    )
    assert me_before.status_code == 200

    with patch("app.email_service._deliver_email") as mock_deliver:
        client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "session-burn@example.com"},
        )
        raw_token = _extract_token_from_deliver_mock(mock_deliver)

    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword456!"},
    )
    assert reset_resp.status_code == 200, reset_resp.text

    # Prior refresh token is revoked
    refresh_after = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_refresh_token},
    )
    assert refresh_after.status_code == 401

    # Prior access token is immediately rejected
    me_after = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {old_access_token}"},
    )
    assert me_after.status_code == 401

    get_settings.cache_clear()


def test_forgot_and_reset_password_enforce_route_rate_limit_429(client, monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "")
    get_settings.cache_clear()

    limit = get_settings().password_reset_rate_limit_per_minute

    for _ in range(limit):
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "ratelimit@example.com"},
        )
        assert resp.status_code == 200

    blocked_forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "ratelimit@example.com"},
    )
    assert blocked_forgot.status_code == 429

    for _ in range(limit):
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "x" * 43, "new_password": "NewPassword456!"},
        )
        assert resp.status_code == 400

    blocked_reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "x" * 43, "new_password": "NewPassword456!"},
    )
    assert blocked_reset.status_code == 429

    get_settings.cache_clear()
