"""Tests for app.secrets_rotation — SecretsRotationManager."""

import json
import os
import tempfile
from datetime import datetime, timedelta

import pytest

from app.secrets_rotation import SecretsRotationManager


@pytest.fixture
def tmp_dir():
    with tempfile.TemporaryDirectory() as d:
        yield d


@pytest.fixture
def manager_with_secrets(tmp_dir):
    """Create a manager with a pre-populated config file."""
    config = {
        "secrets": [
            {
                "name": "database_url",
                "last_rotated": datetime.now().isoformat(),
                "interval_days": 90,
            },
            {
                "name": "square_access_token",
                "last_rotated": (datetime.now() - timedelta(days=100)).isoformat(),
                "interval_days": 90,
            },
            {
                "name": "jwt_secret",
                "last_rotated": (datetime.now() - timedelta(days=50)).isoformat(),
                "interval_days": 60,
            },
            {"name": "no_date_secret", "last_rotated": None, "interval_days": 30},
        ]
    }
    config_path = os.path.join(tmp_dir, SecretsRotationManager.CONFIG_FILE_NAME)
    with open(config_path, "w") as f:
        json.dump(config, f)
    return SecretsRotationManager(base_dir=tmp_dir)


class TestInit:
    def test_missing_config_file(self, tmp_dir):
        mgr = SecretsRotationManager(base_dir=tmp_dir)
        assert mgr._secrets_config == {"secrets": []}

    def test_invalid_json(self, tmp_dir):
        config_path = os.path.join(tmp_dir, SecretsRotationManager.CONFIG_FILE_NAME)
        with open(config_path, "w") as f:
            f.write("not valid json {{")
        mgr = SecretsRotationManager(base_dir=tmp_dir)
        assert mgr._secrets_config == {"secrets": []}


class TestGetRotationStatus:
    def test_returns_all_secrets(self, manager_with_secrets):
        status = manager_with_secrets.get_rotation_status()
        assert len(status) == 4
        names = {s["name"] for s in status}
        assert "database_url" in names
        assert "jwt_secret" in names

    def test_recently_rotated_not_expired(self, manager_with_secrets):
        status = manager_with_secrets.get_rotation_status()
        db_url = next(s for s in status if s["name"] == "database_url")
        assert db_url["is_expired"] is False

    def test_old_secret_is_expired(self, manager_with_secrets):
        status = manager_with_secrets.get_rotation_status()
        square = next(s for s in status if s["name"] == "square_access_token")
        assert square["is_expired"] is True

    def test_no_date_is_expired(self, manager_with_secrets):
        status = manager_with_secrets.get_rotation_status()
        no_date = next(s for s in status if s["name"] == "no_date_secret")
        assert no_date["is_expired"] is True


class TestCheckExpiry:
    def test_returns_expired_names(self, manager_with_secrets):
        expired = manager_with_secrets.check_expiry()
        assert "square_access_token" in expired
        assert "no_date_secret" in expired
        assert "database_url" not in expired


class TestRotateSecret:
    def test_rotate_existing(self, manager_with_secrets):
        result = manager_with_secrets.rotate_secret("square_access_token")
        assert result is True
        # After rotation, should not be expired
        status = manager_with_secrets.get_rotation_status()
        square = next(s for s in status if s["name"] == "square_access_token")
        assert square["is_expired"] is False

    def test_rotate_nonexistent(self, manager_with_secrets):
        result = manager_with_secrets.rotate_secret("nonexistent_secret")
        assert result is False


class TestZeroDowntimeRotation:
    def test_successful_rotation(self, manager_with_secrets):
        result = manager_with_secrets.zero_downtime_rotation_pattern(
            "jwt_secret", lambda: "new-secret-value"
        )
        assert result is True

    def test_rotation_exception(self, manager_with_secrets):
        def bad_generator():
            raise RuntimeError("generation failed")

        result = manager_with_secrets.zero_downtime_rotation_pattern(
            "jwt_secret", bad_generator
        )
        assert result is False


class TestConstants:
    def test_default_interval(self):
        assert SecretsRotationManager.DEFAULT_ROTATION_INTERVAL_DAYS == 90

    def test_config_file_name(self):
        assert SecretsRotationManager.CONFIG_FILE_NAME == "secrets_rotation_config.json"
