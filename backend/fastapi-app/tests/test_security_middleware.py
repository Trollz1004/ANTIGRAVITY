"""Tests for app.security — InputValidationMiddleware and SecurityHeadersMiddleware."""

import pytest

from app.security import InputValidationMiddleware, SecurityHeadersMiddleware


class TestInputValidationMiddleware:
    def test_suspicious_pattern_detection(self):
        mw = InputValidationMiddleware(app=None)
        assert mw._contains_suspicious_pattern("' OR 1=1") is True
        assert mw._contains_suspicious_pattern("UNION SELECT * FROM users") is True
        assert mw._contains_suspicious_pattern("<script>alert(1)</script>") is True
        assert mw._contains_suspicious_pattern("javascript:void(0)") is True
        assert mw._contains_suspicious_pattern("DROP TABLE users") is True
        assert mw._contains_suspicious_pattern("DELETE FROM sessions") is True
        assert mw._contains_suspicious_pattern("../../../../etc/passwd") is True
        assert mw._contains_suspicious_pattern("%3Cscript%3E") is True
        assert mw._contains_suspicious_pattern("{{7*7}}") is True
        assert mw._contains_suspicious_pattern("${7*7}") is True

    def test_clean_input_passes(self):
        mw = InputValidationMiddleware(app=None)
        assert mw._contains_suspicious_pattern("hello world") is False
        assert mw._contains_suspicious_pattern("john@example.com") is False
        assert mw._contains_suspicious_pattern("search query") is False
        assert mw._contains_suspicious_pattern("/api/v1/users") is False

    def test_empty_input(self):
        mw = InputValidationMiddleware(app=None)
        assert mw._contains_suspicious_pattern("") is False

    def test_case_insensitive(self):
        mw = InputValidationMiddleware(app=None)
        assert mw._contains_suspicious_pattern("union select") is True
        assert mw._contains_suspicious_pattern("UNION SELECT") is True
        assert mw._contains_suspicious_pattern("Union Select") is True

    def test_max_content_length(self):
        assert InputValidationMiddleware.MAX_CONTENT_LENGTH == 10 * 1024 * 1024


class TestSecurityHeadersMiddleware:
    """SecurityHeadersMiddleware is tested via integration in test_security_headers_integration."""

    def test_class_exists(self):
        assert SecurityHeadersMiddleware is not None


class TestSecurityHeadersIntegration:
    def test_security_headers_present(self, client):
        response = client.get("/api/v1/health")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert "max-age=" in (response.headers.get("Strict-Transport-Security") or "")

    def test_csp_header_present(self, client):
        response = client.get("/api/v1/health")
        csp = response.headers.get("Content-Security-Policy", "")
        assert "default-src" in csp

    def test_referrer_policy(self, client):
        response = client.get("/api/v1/health")
        assert (
            response.headers.get("Referrer-Policy")
            == "strict-origin-when-cross-origin"
        )
