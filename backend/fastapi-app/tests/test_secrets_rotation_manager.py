"""Tests for the SecretsRotationManager operational utility.

Covers config loading (valid/missing/corrupt), rotation status expiry logic,
audit logging, simulated rotation, and the zero-downtime rotation pattern
including error handling.
"""

import json
import os
from datetime import datetime, timedelta

from app.secrets_rotation import SecretsRotationManager


def _write_config(base_dir, config: dict) -> None:
    with open(os.path.join(base_dir, SecretsRotationManager.CONFIG_FILE_NAME), "w") as f:
        json.dump(config, f)


def _make_manager(tmp_path, config: dict | None = None) -> SecretsRotationManager:
    if config is not None:
        _write_config(str(tmp_path), config)
    return SecretsRotationManager(base_dir=str(tmp_path))


class TestConfigLoading:
    def test_missing_config_file_initializes_empty(self, tmp_path):
        manager = SecretsRotationManager(base_dir=str(tmp_path))
        assert manager._secrets_config == {"secrets": []}
        assert manager.get_rotation_status() == []

    def test_corrupt_config_file_initializes_empty(self, tmp_path):
        path = tmp_path / SecretsRotationManager.CONFIG_FILE_NAME
        path.write_text("{ not json !!")
        manager = SecretsRotationManager(base_dir=str(tmp_path))
        assert manager._secrets_config == {"secrets": []}

    def test_valid_config_is_loaded(self, tmp_path):
        config = {
            "secrets": [
                {
                    "name": "jwt_secret",
                    "last_rotated": datetime.now().isoformat(),
                    "interval_days": 30,
                }
            ]
        }
        manager = _make_manager(tmp_path, config)
        status = manager.get_rotation_status()
        assert len(status) == 1
        assert status[0]["name"] == "jwt_secret"

    def test_default_base_dir_is_module_directory(self):
        manager = SecretsRotationManager()
        expected = os.path.dirname(os.path.abspath("app/secrets_rotation.py"))
        assert os.path.samefile(manager._base_dir, expected)
        # The repo ships a real config file next to the module.
        assert isinstance(manager._secrets_config, dict)


class TestRotationStatus:
    def test_recently_rotated_secret_is_not_expired(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {
                "secrets": [
                    {
                        "name": "fresh",
                        "last_rotated": datetime.now().isoformat(),
                        "interval_days": 90,
                    }
                ]
            },
        )
        (status,) = manager.get_rotation_status()
        assert status["is_expired"] is False

    def test_old_secret_is_expired(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {
                "secrets": [
                    {
                        "name": "stale",
                        "last_rotated": (
                            datetime.now() - timedelta(days=200)
                        ).isoformat(),
                        "interval_days": 90,
                    }
                ]
            },
        )
        (status,) = manager.get_rotation_status()
        assert status["is_expired"] is True

    def test_never_rotated_secret_is_expired(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {"secrets": [{"name": "never", "last_rotated": None}]},
        )
        (status,) = manager.get_rotation_status()
        assert status["is_expired"] is True
        # Missing interval falls back to the class default
        assert (
            status["interval_days"]
            == SecretsRotationManager.DEFAULT_ROTATION_INTERVAL_DAYS
        )

    def test_invalid_date_format_is_treated_as_unverifiable(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {"secrets": [{"name": "broken", "last_rotated": "yesterday"}]},
        )
        (status,) = manager.get_rotation_status()
        assert status["is_expired"] is False

    def test_check_expiry_returns_only_expired_names(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {
                "secrets": [
                    {
                        "name": "stale",
                        "last_rotated": (
                            datetime.now() - timedelta(days=400)
                        ).isoformat(),
                    },
                    {
                        "name": "fresh",
                        "last_rotated": datetime.now().isoformat(),
                    },
                    {"name": "never"},
                ]
            },
        )
        assert sorted(manager.check_expiry()) == ["never", "stale"]


class TestRotateSecret:
    def test_rotate_updates_timestamp_saves_config_and_audits(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {"secrets": [{"name": "api_key", "last_rotated": None}]},
        )
        assert manager.rotate_secret("api_key") is True

        # Config persisted with a fresh timestamp
        with open(manager._config_path) as f:
            saved = json.load(f)
        rotated = saved["secrets"][0]["last_rotated"]
        assert rotated is not None
        assert datetime.fromisoformat(rotated) is not None

        # After rotation the secret is no longer expired
        assert manager.check_expiry() == []

        # Audit trail written
        with open(manager._audit_log_path) as f:
            audit = f.read()
        assert "api_key" in audit
        assert "Rotation initiated" in audit

    def test_rotate_unknown_secret_returns_false(self, tmp_path):
        manager = _make_manager(
            tmp_path, {"secrets": [{"name": "known"}]}
        )
        assert manager.rotate_secret("unknown") is False


class TestZeroDowntimePattern:
    def test_successful_pattern_updates_timestamp_and_logs_all_steps(
        self, tmp_path
    ):
        manager = _make_manager(
            tmp_path,
            {"secrets": [{"name": "jwt_secret", "last_rotated": None}]},
        )
        result = manager.zero_downtime_rotation_pattern(
            "jwt_secret", lambda: "new-secret-value"
        )
        assert result is True

        with open(manager._audit_log_path) as f:
            audit = f.read()
        for action in (
            "Zero-downtime rotation start",
            "Generate New",
            "Provision Parallel",
            "Validate New",
            "Swap Active",
            "Cleanup Old",
            "Zero-downtime rotation end",
        ):
            assert action in audit

        # Rotation timestamp was refreshed
        assert manager.check_expiry() == []

    def test_generator_failure_is_logged_and_returns_false(self, tmp_path):
        manager = _make_manager(
            tmp_path,
            {"secrets": [{"name": "db_url", "last_rotated": None}]},
        )

        def boom():
            raise RuntimeError("KMS unavailable")

        result = manager.zero_downtime_rotation_pattern("db_url", boom)
        assert result is False

        with open(manager._audit_log_path) as f:
            audit = f.read()
        assert "Rotation Error" in audit
        assert "KMS unavailable" in audit


class TestAuditAndSaveResilience:
    def test_save_config_oserror_is_logged_not_raised(self, tmp_path, monkeypatch):
        manager = _make_manager(
            tmp_path, {"secrets": [{"name": "x"}]}
        )
        monkeypatch.setattr("os.makedirs", lambda *a, **k: (_ for _ in ()).throw(OSError("nope")))
        # Must not raise
        manager._save_config()

    def test_audit_log_oserror_is_logged_not_raised(self, tmp_path, monkeypatch):
        manager = _make_manager(
            tmp_path, {"secrets": [{"name": "x"}]}
        )
        monkeypatch.setattr(
            "builtins.open",
            lambda *a, **k: (_ for _ in ()).throw(OSError("nope")),
        )
        # Must not raise
        manager._log_audit("x", "action", "details")
