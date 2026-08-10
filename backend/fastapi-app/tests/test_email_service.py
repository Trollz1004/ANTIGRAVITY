"""Tests for transactional email helpers — SMTP delivery is mocked."""

from unittest.mock import MagicMock, patch

import pytest

from app.config import Settings
from app.email_service import (
    _build_email_message,
    _build_founder_badge_html,
    _build_founder_badge_subject,
    _build_founder_badge_text,
    _build_waitlist_confirmation_html,
    _build_waitlist_confirmation_text,
    _build_waitlist_notification_html,
    _build_waitlist_notification_text,
    _deliver_email,
    _smtp_is_configured,
    _waitlist_operator_recipients,
    send_waitlist_confirmation,
    send_waitlist_operator_notice,
    send_welcome_email,
    sendWelcomeEmail,
)


def _settings(**overrides) -> Settings:
    base = {
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_username": "mailer",
        "smtp_password": "secret",
        "smtp_use_ssl": False,
        "smtp_use_starttls": True,
        "email_from_address": "noreply@youandinotai.com",
        "email_from_name": "YouAndINotAI",
        "email_reply_to": "support@youandinotai.com",
        "app_url": "https://youandinotai.com",
        "support_operator_emails": "ops@youandinotai.com",
    }
    base.update(overrides)
    return Settings(**base)


class TestSmtpConfigured:
    def test_fully_configured(self):
        assert _smtp_is_configured(_settings()) is True

    def test_missing_host(self):
        assert _smtp_is_configured(_settings(smtp_host="")) is False

    def test_missing_from_address(self):
        assert _smtp_is_configured(_settings(email_from_address="")) is False

    def test_username_without_password_is_incomplete(self):
        assert _smtp_is_configured(_settings(smtp_password="")) is False

    def test_password_without_username_is_incomplete(self):
        assert _smtp_is_configured(_settings(smtp_username="")) is False

    def test_unauthenticated_smtp_is_allowed(self):
        assert (
            _smtp_is_configured(_settings(smtp_username="", smtp_password="")) is True
        )


class TestMessageBuilders:
    def test_founder_badge_text_personalized(self):
        body = _build_founder_badge_text(
            display_name="Ada", app_url="https://youandinotai.com"
        )
        assert "Hi Ada," in body
        assert "Founder Badge" in body
        assert "$1 Bot-Shield" in body
        assert "https://youandinotai.com" in body

    def test_founder_badge_text_falls_back_to_generic_name(self):
        assert "Hi there," in _build_founder_badge_text(display_name="  ", app_url="x")
        assert "Hi there," in _build_founder_badge_text(display_name=None, app_url="x")

    def test_founder_badge_html_escapes_name(self):
        html = _build_founder_badge_html(
            display_name="<script>alert(1)</script>",
            app_url="https://youandinotai.com",
        )
        assert "<script>" not in html
        assert "&lt;script&gt;" in html

    def test_founder_badge_subject(self):
        assert _build_founder_badge_subject() == "Founder Badge unlocked"

    def test_waitlist_confirmation_bodies(self):
        text = _build_waitlist_confirmation_text(
            recipient_email="a@b.com", app_url="https://youandinotai.com"
        )
        assert "a@b.com" in text
        html = _build_waitlist_confirmation_html(
            recipient_email="a@b.com", app_url="https://youandinotai.com"
        )
        assert "a@b.com" in html

    def test_waitlist_notification_bodies(self):
        text = _build_waitlist_notification_text(
            recipient_email="n@e.com", app_url="https://youandinotai.com"
        )
        assert "n@e.com" in text
        html = _build_waitlist_notification_html(
            recipient_email="n@e.com", app_url="https://youandinotai.com"
        )
        assert "n@e.com" in html

    def test_build_email_message_headers(self):
        settings = _settings()
        message = _build_email_message(
            recipients=["a@b.com", "c@d.com"],
            subject="Hello",
            text_body="text",
            html_body="<b>html</b>",
            settings=settings,
        )
        assert message["To"] == "a@b.com, c@d.com"
        assert "YouAndINotAI" in message["From"]
        assert message["Reply-To"] == "support@youandinotai.com"
        assert message["Subject"] == "Hello"

    def test_build_email_message_without_reply_to(self):
        settings = _settings(email_reply_to="")
        message = _build_email_message(
            recipients=["a@b.com"],
            subject="Hi",
            text_body="t",
            html_body="<p>h</p>",
            settings=settings,
        )
        assert message["Reply-To"] is None


class TestOperatorRecipients:
    def test_dedupes_and_normalizes(self):
        settings = _settings(
            support_operator_emails="OPS@youandinotai.com, other@youandinotai.com",
            email_reply_to="ops@youandinotai.com",
            email_from_address="ops@youandinotai.com",
        )
        recipients = _waitlist_operator_recipients(settings)
        assert recipients == ["ops@youandinotai.com", "other@youandinotai.com"]

    def test_empty_when_nothing_configured(self):
        settings = _settings(
            support_operator_emails="",
            email_reply_to="",
            email_from_address="",
        )
        assert _waitlist_operator_recipients(settings) == []


class TestDelivery:
    def test_deliver_over_starttls(self):
        settings = _settings(smtp_use_ssl=False, smtp_use_starttls=True)
        message = MagicMock()
        server = MagicMock()
        with patch("smtplib.SMTP") as smtp_cls:
            smtp_cls.return_value.__enter__ = MagicMock(return_value=server)
            smtp_cls.return_value.__exit__ = MagicMock(return_value=False)
            _deliver_email(message, settings)
        server.ehlo.assert_called()
        server.starttls.assert_called_once()
        server.login.assert_called_once_with("mailer", "secret")
        server.send_message.assert_called_once_with(message)

    def test_deliver_plain_without_tls_or_auth(self):
        settings = _settings(
            smtp_use_ssl=False,
            smtp_use_starttls=False,
            smtp_username="",
            smtp_password="",
        )
        message = MagicMock()
        server = MagicMock()
        with patch("smtplib.SMTP") as smtp_cls:
            smtp_cls.return_value.__enter__ = MagicMock(return_value=server)
            smtp_cls.return_value.__exit__ = MagicMock(return_value=False)
            _deliver_email(message, settings)
        server.starttls.assert_not_called()
        server.login.assert_not_called()
        server.send_message.assert_called_once_with(message)

    def test_deliver_over_ssl(self):
        settings = _settings(smtp_use_ssl=True)
        message = MagicMock()
        server = MagicMock()
        with patch("smtplib.SMTP_SSL") as smtp_cls:
            smtp_cls.return_value.__enter__ = MagicMock(return_value=server)
            smtp_cls.return_value.__exit__ = MagicMock(return_value=False)
            _deliver_email(message, settings)
        server.login.assert_called_once()
        server.send_message.assert_called_once_with(message)


class TestAsyncSenders:
    @pytest.mark.asyncio
    async def test_welcome_email_skips_when_smtp_unconfigured(self):
        settings = _settings(smtp_host="")
        assert (
            await send_welcome_email(
                recipient_email="user@example.com",
                display_name="User",
                settings=settings,
            )
            is False
        )

    @pytest.mark.asyncio
    async def test_welcome_email_delivers_when_configured(self):
        settings = _settings()
        with patch("app.email_service._deliver_email") as mock_deliver:
            result = await send_welcome_email(
                recipient_email="user@example.com",
                display_name="User",
                settings=settings,
            )
        assert result is True
        mock_deliver.assert_called_once()
        message = mock_deliver.call_args.args[0]
        assert message["To"] == "user@example.com"
        assert message["Subject"] == "Founder Badge unlocked"

    @pytest.mark.asyncio
    async def test_waitlist_confirmation_paths(self):
        unconfigured = _settings(smtp_host="")
        assert (
            await send_waitlist_confirmation(
                recipient_email="w@example.com", settings=unconfigured
            )
            is False
        )

        settings = _settings()
        with patch("app.email_service._deliver_email") as mock_deliver:
            assert (
                await send_waitlist_confirmation(
                    recipient_email="w@example.com", settings=settings
                )
                is True
            )
        message = mock_deliver.call_args.args[0]
        assert "waitlist" in message["Subject"]

    @pytest.mark.asyncio
    async def test_operator_notice_paths(self):
        unconfigured = _settings(smtp_host="")
        assert (
            await send_waitlist_operator_notice(
                recipient_email="w@example.com", settings=unconfigured
            )
            is False
        )

        no_recipients = _settings(
            support_operator_emails="", email_reply_to="", email_from_address=""
        )
        assert (
            await send_waitlist_operator_notice(
                recipient_email="w@example.com", settings=no_recipients
            )
            is False
        )

        settings = _settings()
        with patch("app.email_service._deliver_email") as mock_deliver:
            assert (
                await send_waitlist_operator_notice(
                    recipient_email="w@example.com", settings=settings
                )
                is True
            )
        message = mock_deliver.call_args.args[0]
        assert "waitlist signup" in message["Subject"]
        assert "ops@youandinotai.com" in message["To"]

    def test_camelcase_alias_points_at_async_sender(self):
        assert sendWelcomeEmail is send_welcome_email
