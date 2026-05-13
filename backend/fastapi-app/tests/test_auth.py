"""Auth flow tests for YouAndINotAI backend.

Tests cover:
  - JWT token creation and decoding
  - JWT secret fail-fast validation
  - Password hashing and verification
  - Token expiry behavior
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from jose import jwt

# Ensure JWT_SECRET is set before importing app modules
os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)

from app.auth import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    """Test bcrypt password hashing and verification."""

    def test_hash_password_returns_hash(self):
        hashed = hash_password("secure_password_123")
        assert hashed != "secure_password_123"
        assert hashed.startswith("$2b$")

    def test_verify_password_correct(self):
        hashed = hash_password("my_password")
        assert verify_password("my_password", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("my_password")
        assert verify_password("wrong_password", hashed) is False

    def test_hash_password_unique_salts(self):
        hash1 = hash_password("same_password")
        hash2 = hash_password("same_password")
        assert hash1 != hash2  # Different salts

    def test_verify_password_invalid_hash_fails_closed(self):
        assert verify_password("anything", "not-a-bcrypt-hash") is False


class TestJWTTokens:
    """Test JWT token creation and decoding."""

    def test_create_access_token(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id)
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert "exp" in payload

    def test_create_refresh_token(self):
        user_id = str(uuid.uuid4())
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert payload.get("type") == "refresh"

    def test_decode_invalid_token_raises(self):
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid.token.here")
        assert exc_info.value.status_code == 401

    def test_decode_expired_token_raises(self):
        from fastapi import HTTPException

        user_id = str(uuid.uuid4())
        # Create a token that expired 1 hour ago
        expired_payload = {
            "sub": user_id,
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        secret = os.environ["JWT_SECRET"]
        expired_token = jwt.encode(expired_payload, secret, algorithm=ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            decode_token(expired_token)
        assert exc_info.value.status_code == 401

    def test_access_token_has_correct_expiry(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id, expires_minutes=60)
        payload = decode_token(token)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        # Should expire roughly 60 minutes from now (within 5 seconds tolerance)
        delta = (exp - now).total_seconds()
        assert 3595 < delta < 3605


class TestJWTSecretFailFast:
    """Test that the application refuses to start without a secure JWT secret.

    Iron Wall enforcement: No backdoors, no insecure defaults.
    """

    def test_empty_jwt_secret_raises(self):
        """App must crash if JWT_SECRET is empty."""
        from importlib import reload
        import app.config as config_module

        # Clear the lru_cache
        config_module.get_settings.cache_clear()

        with patch.dict(os.environ, {"JWT_SECRET": ""}, clear=False):
            with pytest.raises(RuntimeError, match="FATAL"):
                config_module.get_settings.cache_clear()
                config_module.get_settings()

        # Restore valid secret
        config_module.get_settings.cache_clear()

    def test_insecure_default_jwt_secret_raises(self):
        """App must crash if JWT_SECRET is the old insecure default."""
        from importlib import reload
        import app.config as config_module

        config_module.get_settings.cache_clear()

        with patch.dict(
            os.environ, {"JWT_SECRET": "change-me-in-production"}, clear=False
        ):
            with pytest.raises(RuntimeError, match="FATAL"):
                config_module.get_settings.cache_clear()
                config_module.get_settings()

        config_module.get_settings.cache_clear()

    def test_short_jwt_secret_raises(self):
        """App must crash if JWT_SECRET is less than 32 characters."""
        import app.config as config_module

        config_module.get_settings.cache_clear()

        with patch.dict(os.environ, {"JWT_SECRET": "too-short"}, clear=False):
            with pytest.raises(RuntimeError, match="at least 32 characters"):
                config_module.get_settings.cache_clear()
                config_module.get_settings()

        config_module.get_settings.cache_clear()

    def test_valid_jwt_secret_succeeds(self):
        """App should start successfully with a valid JWT secret."""
        import app.config as config_module

        config_module.get_settings.cache_clear()

        valid_secret = (
            "this-is-a-secure-jwt-secret-that-is-definitely-long-enough-for-production"
        )
        with patch.dict(os.environ, {"JWT_SECRET": valid_secret}, clear=False):
            config_module.get_settings.cache_clear()
            settings = config_module.get_settings()
            assert settings.jwt_secret == valid_secret

        config_module.get_settings.cache_clear()
