"""Tests for app/security_audit.py — SecurityAudit + run_security_audit().

Coverage targets:
  - check_jwt_configuration(): missing, too short, weak, strong
  - check_square_configuration(): missing, too short, sig-verify disabled
  - check_cors_configuration(): wildcard vs restricted origins
  - check_environment_variables(): debug in production
  - check_file_permissions(): .env readable, permission error, missing
  - run_audit(): aggregation and summary counts
  - _add_finding(): severity-to-log-level mapping
  - run_security_audit(): convenience wrapper

All tests run with env isolation — get_settings() cache is cleared between
tests so environment mutations don't bleed across.
"""

from __future__ import annotations

import logging
import os
from unittest.mock import MagicMock, patch

import pytest

from app.security_audit import SecurityAudit

# ── Fixture: fresh settings + audit instance ──────────────────────────────────


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Clear the lru_cache on get_settings before/after each test."""
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _make_audit(overrides: dict | None = None) -> SecurityAudit:
    """Return a SecurityAudit with a mocked Settings object."""
    audit = SecurityAudit.__new__(SecurityAudit)
    audit.findings = []

    settings = MagicMock()
    # Safe defaults
    settings.jwt_secret = "a-strong-secret-that-is-32chars!!"
    settings.square_access_token = "EAAA" + "x" * 60
    settings.square_webhook_verify_signature = True
    settings.cors_origins = "https://youandinotai.com"
    settings.app_env = "development"

    if overrides:
        for key, val in overrides.items():
            setattr(settings, key, val)

    audit.settings = settings
    return audit


# ── check_jwt_configuration ───────────────────────────────────────────────────


def test_jwt_check_no_secret_adds_critical_finding():
    audit = _make_audit({"jwt_secret": ""})
    audit.check_jwt_configuration()
    criticals = [f for f in audit.findings if f["severity"] == "critical"]
    assert any("not configured" in f["title"].lower() for f in criticals)


def test_jwt_check_short_secret_adds_high_finding():
    audit = _make_audit({"jwt_secret": "tooshort"})
    audit.check_jwt_configuration()
    highs = [f for f in audit.findings if f["severity"] == "high"]
    assert any("too short" in f["title"].lower() for f in highs)


def test_jwt_check_weak_secret_adds_critical_finding():
    audit = _make_audit({"jwt_secret": "change-me-value-padding-for-length"})
    audit.check_jwt_configuration()
    criticals = [f for f in audit.findings if f["severity"] == "critical"]
    assert any(
        "weak" in f["title"].lower() or "default" in f["title"].lower()
        for f in criticals
    )


def test_jwt_check_strong_secret_no_finding():
    audit = _make_audit({"jwt_secret": "a" * 40})
    audit.check_jwt_configuration()
    assert audit.findings == []


def test_jwt_weak_words_detected():
    """Each known weak secret pattern must trigger a critical finding."""
    weak_patterns = ["change-me", "secret", "password", "jwt-secret"]
    for pattern in weak_patterns:
        padded = pattern + "x" * max(0, 32 - len(pattern))
        audit = _make_audit({"jwt_secret": padded})
        audit.check_jwt_configuration()
        criticals = [f for f in audit.findings if f["severity"] == "critical"]
        assert criticals, f"Pattern '{pattern}' should produce a critical finding"


# ── check_square_configuration ────────────────────────────────────────────────


def test_square_missing_token_logs_info_no_finding():
    """Missing Square membership record is development-expected; should not add a finding."""
    audit = _make_audit({"square_access_token": ""})
    audit.check_square_configuration()
    square_findings = [
        f for f in audit.findings if f["category"] == "SQUARE_ACCESS_TOKEN"
    ]
    assert square_findings == []


def test_square_short_token_adds_high_finding():
    audit = _make_audit({"square_access_token": "tiny"})
    audit.check_square_configuration()
    highs = [
        f
        for f in audit.findings
        if f["severity"] == "high" and "SQUARE" in f["category"]
    ]
    assert highs


def test_square_sig_verify_disabled_adds_medium_finding():
    audit = _make_audit({"square_webhook_verify_signature": False})
    audit.check_square_configuration()
    mediums = [f for f in audit.findings if f["severity"] == "medium"]
    assert any("webhook" in f["title"].lower() for f in mediums)


def test_square_valid_config_no_finding():
    audit = _make_audit()
    audit.check_square_configuration()
    assert audit.findings == []


# ── check_cors_configuration ──────────────────────────────────────────────────


def test_cors_wildcard_adds_medium_finding():
    audit = _make_audit({"cors_origins": "*"})
    audit.check_cors_configuration()
    mediums = [f for f in audit.findings if f["severity"] == "medium"]
    assert any("wildcard" in f["title"].lower() for f in mediums)


def test_cors_specific_origin_no_finding():
    audit = _make_audit({"cors_origins": "https://youandinotai.com"})
    audit.check_cors_configuration()
    cors_findings = [f for f in audit.findings if f["category"] == "CORS_ORIGINS"]
    assert cors_findings == []


def test_cors_wildcard_anywhere_in_origins_triggers_finding():
    """Even if wildcard is mixed with other origins, it should trigger."""
    audit = _make_audit({"cors_origins": "https://youandinotai.com,*"})
    audit.check_cors_configuration()
    mediums = [f for f in audit.findings if f["severity"] == "medium"]
    assert mediums


# ── check_environment_variables ───────────────────────────────────────────────


def test_debug_in_production_adds_high_finding():
    audit = _make_audit({"app_env": "production"})
    with patch.dict(os.environ, {"DEBUG": "true"}):
        audit.check_environment_variables()
    highs = [f for f in audit.findings if f["severity"] == "high"]
    assert any("debug" in f["title"].lower() for f in highs)


def test_debug_in_development_no_finding():
    audit = _make_audit({"app_env": "development"})
    with patch.dict(os.environ, {"DEBUG": "true"}):
        audit.check_environment_variables()
    assert audit.findings == []


def test_no_debug_in_production_no_finding():
    audit = _make_audit({"app_env": "production"})
    env = {k: v for k, v in os.environ.items() if k != "DEBUG"}
    env.pop("DEBUG", None)
    with patch.dict(os.environ, env, clear=True):
        audit.check_environment_variables()
    assert audit.findings == []


# ── check_file_permissions ────────────────────────────────────────────────────


def test_env_file_readable_no_finding(tmp_path, monkeypatch):
    """If .env is readable, no finding should be added."""
    env_file = tmp_path / ".env"
    env_file.write_text("JWT_SECRET=test")
    monkeypatch.chdir(tmp_path)

    audit = _make_audit()
    audit.check_file_permissions()
    assert audit.findings == []


def test_env_file_permission_error_adds_high_finding(tmp_path, monkeypatch):
    """PermissionError on .env read triggers a high-severity finding."""
    env_file = tmp_path / ".env"
    env_file.write_text("JWT_SECRET=test")
    monkeypatch.chdir(tmp_path)

    audit = _make_audit()
    with patch("builtins.open", side_effect=PermissionError("denied")):
        audit.check_file_permissions()

    highs = [f for f in audit.findings if f["severity"] == "high"]
    assert highs


def test_env_file_missing_no_finding(tmp_path, monkeypatch):
    """If .env doesn't exist at all, no finding is raised."""
    monkeypatch.chdir(tmp_path)
    audit = _make_audit()
    audit.check_file_permissions()
    assert audit.findings == []


def test_env_file_other_exception_no_finding(tmp_path, monkeypatch):
    """Non-PermissionError exceptions are swallowed with a warning log."""
    env_file = tmp_path / ".env"
    env_file.write_text("JWT_SECRET=test")
    monkeypatch.chdir(tmp_path)

    audit = _make_audit()
    with patch("builtins.open", side_effect=OSError("unexpected")):
        audit.check_file_permissions()  # should not raise

    # No high finding for generic errors
    highs = [f for f in audit.findings if f["severity"] == "high"]
    assert highs == []


# ── run_audit ─────────────────────────────────────────────────────────────────


def test_run_audit_resets_findings_between_calls():
    """Calling run_audit() twice should not accumulate findings."""
    audit = _make_audit({"jwt_secret": ""})
    result1 = audit.run_audit()
    result2 = audit.run_audit()
    assert result1["summary"]["total_findings"] == result2["summary"]["total_findings"]


def test_run_audit_summary_counts_match_findings():
    """Summary counts must equal lengths of per-severity lists."""
    audit = _make_audit(
        {
            "jwt_secret": "",  # critical
            "square_webhook_verify_signature": False,  # medium
        }
    )
    result = audit.run_audit()
    findings = result["findings"]
    summary = result["summary"]

    assert summary["total_findings"] == len(findings)
    assert summary["critical"] == sum(
        1 for f in findings if f["severity"] == "critical"
    )
    assert summary["medium"] == sum(1 for f in findings if f["severity"] == "medium")


def test_run_audit_has_timestamp():
    audit = _make_audit()
    result = audit.run_audit()
    assert "timestamp" in result
    assert result["timestamp"].endswith("Z")


def test_run_audit_clean_config_zero_findings(tmp_path, monkeypatch):
    """A properly configured system should produce zero findings."""
    # Use a strong JWT secret that contains no weak patterns
    audit = _make_audit({"app_env": "development", "jwt_secret": "Z" * 40})
    # Ensure DEBUG is not set and cwd has no .env
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("DEBUG", raising=False)
    result = audit.run_audit()
    assert result["summary"]["total_findings"] == 0


# ── _add_finding log level mapping ────────────────────────────────────────────


def test_add_finding_critical_logs_at_error(caplog):
    audit = _make_audit()
    with caplog.at_level(logging.ERROR, logger="youandinotai.security.audit"):
        audit._add_finding("critical", "TEST", "Critical thing", "Fix it")
    assert any(r.levelno == logging.ERROR for r in caplog.records)


def test_add_finding_high_logs_at_warning(caplog):
    audit = _make_audit()
    with caplog.at_level(logging.WARNING, logger="youandinotai.security.audit"):
        audit._add_finding("high", "TEST", "High thing", "Fix it too")
    assert any(r.levelno == logging.WARNING for r in caplog.records)


def test_add_finding_medium_logs_at_info(caplog):
    audit = _make_audit()
    with caplog.at_level(logging.INFO, logger="youandinotai.security.audit"):
        audit._add_finding("medium", "TEST", "Medium thing", "Maybe fix")
    assert any(r.levelno == logging.INFO for r in caplog.records)


def test_add_finding_appends_to_findings_list():
    audit = _make_audit()
    audit._add_finding("high", "CAT", "Title", "Desc")
    assert len(audit.findings) == 1
    assert audit.findings[0] == {
        "severity": "high",
        "category": "CAT",
        "title": "Title",
        "description": "Desc",
    }


# ── run_security_audit convenience wrapper ────────────────────────────────────


def test_run_security_audit_returns_dict():
    """The module-level convenience function returns a proper audit dict."""
    mock_settings = MagicMock()
    mock_settings.jwt_secret = "a" * 40
    mock_settings.square_access_token = "EAAA" + "x" * 60
    mock_settings.square_webhook_verify_signature = True
    mock_settings.cors_origins = "https://youandinotai.com"
    mock_settings.app_env = "development"

    with patch("app.security_audit.get_settings", return_value=mock_settings):
        from app.security_audit import run_security_audit

        result = run_security_audit()

    assert "summary" in result
    assert "findings" in result
    assert "timestamp" in result
