"""Tests for app.email_service — email building and delivery helpers."""

from unittest.mock import MagicMock, patch

from app.email_service import (
    _build_founder_badge_html,
    _build_founder_badge_subject,
    _build_founder_badge_text,
    _build_waitlist_confirmation_html,
    _build_waitlist_confirmation_subject,
    _build_waitlist_confirmation_text,
    _build_waitlist_notification_html,
    _build_waitlist_notification_subject,
    _build_waitlist_notification_text,
    _smtp_is_configured,
    _waitlist_operator_recipients,
)


class TestSmtpIsConfigured:
    def _settings(self, **overrides):
        s = MagicMock()
        s.smtp_host = overrides.get("smtp_host", "smtp.example.com")
        s.email_from_address = overrides.get("email_from_address", "noreply@example.com")
        s.smtp_username = overrides.get("smtp_username", "user")
        s.smtp_password = overrides.get("smtp_password", "pass")
        return s

    def test_fully_configured(self):
        assert _smtp_is_configured(self._settings()) is True

    def test_no_host(self):
        assert _smtp_is_configured(self._settings(smtp_host="")) is False

    def test_no_from_address(self):
        assert _smtp_is_configured(self._settings(email_from_address="")) is False

    def test_missing_password(self):
        assert _smtp_is_configured(self._settings(smtp_password="")) is False

    def test_missing_username(self):
        assert _smtp_is_configured(self._settings(smtp_username="")) is False

    def test_no_credentials_ok(self):
        # Both empty = no auth needed, should still work
        assert _smtp_is_configured(self._settings(smtp_username="", smtp_password="")) is True

    def test_none_values(self):
        assert _smtp_is_configured(self._settings(smtp_host=None, email_from_address=None)) is False


class TestFounderBadgeEmail:
    def test_subject(self):
        subject = _build_founder_badge_subject()
        assert isinstance(subject, str)
        assert len(subject) > 0

    def test_text_body(self):
        text = _build_founder_badge_text("TestUser")
        assert "TestUser" in text

    def test_html_body(self):
        html = _build_founder_badge_html("TestUser")
        assert "TestUser" in html
        assert "<" in html  # Should contain HTML tags


class TestWaitlistConfirmationEmail:
    def test_subject(self):
        subject = _build_waitlist_confirmation_subject()
        assert isinstance(subject, str)

    def test_text_body(self):
        text = _build_waitlist_confirmation_text("test@example.com")
        assert "test@example.com" in text

    def test_html_body(self):
        html = _build_waitlist_confirmation_html("test@example.com")
        assert "test@example.com" in html


class TestWaitlistNotificationEmail:
    def test_subject(self):
        subject = _build_waitlist_notification_subject()
        assert isinstance(subject, str)

    def test_text_body(self):
        text = _build_waitlist_notification_text("new@example.com")
        assert "new@example.com" in text

    def test_html_body(self):
        html = _build_waitlist_notification_html("new@example.com")
        assert "new@example.com" in html


class TestWaitlistOperatorRecipients:
    def test_returns_list(self):
        settings = MagicMock()
        settings.waitlist_operator_emails = "a@example.com,b@example.com"
        result = _waitlist_operator_recipients(settings)
        assert isinstance(result, list)

    def test_empty_config(self):
        settings = MagicMock()
        settings.waitlist_operator_emails = ""
        result = _waitlist_operator_recipients(settings)
        assert isinstance(result, list)
