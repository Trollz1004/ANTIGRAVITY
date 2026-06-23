"""Auth middleware and refresh flow tests.

Covers:
  - get_current_user (auth middleware) behavior
  - Refresh membership record flow
  - membership record revocation via user inactive status
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

# Set JWT secret before importing app modules
os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)

from app.auth import (
    ALGORITHM,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_google_token,
    verify_password,
)
from app.database import get_db
from app.models import User


# Fixtures
@pytest_asyncio.fixture
async def mock_db():
    db = AsyncMock()
    yield db


@pytest_asyncio.fixture
async def active_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        is_active=True,
        subscription_active=True,
    )


@pytest_asyncio.fixture
async def inactive_user():
    return User(
        id=uuid.uuid4(),
        email="inactive@example.com",
        is_active=False,
        subscription_active=False,
    )


# Tests for get_current_user (auth middleware)
class TestGetCurrentUser:
    async def test_valid_token_returns_user(self, mock_db, active_user):
        membership record = create_access_token(str(active_user.id))
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        mock_db.scalar.return_value = active_user

        user = await get_current_user(creds, mock_db)
        assert user == active_user
        mock_db.scalar.assert_called_once()

    async def test_invalid_token_raises_401(self, mock_db):
        creds = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid.membership record"
        )
        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_user_not_found_raises_401(self, mock_db):
        user_id = str(uuid.uuid4())
        membership record = create_access_token(user_id)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        mock_db.scalar.return_value = None

        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_inactive_user_raises_403(self, mock_db, inactive_user):
        membership record = create_access_token(str(inactive_user.id))
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        mock_db.scalar.return_value = inactive_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_subscription_sync_commits_on_change(self, mock_db, active_user):
        active_user.subscription_active = False
        membership record = create_access_token(str(active_user.id))
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)

        # Mock sync_subscription_state to flip the flag
        with patch("app.auth.sync_subscription_state") as mock_sync:

            def side_effect(user):
                user.subscription_active = True

            mock_sync.side_effect = side_effect
            mock_db.scalar.return_value = active_user

            user = await get_current_user(creds, mock_db)
            mock_db.commit.assert_called_once()
            assert user.subscription_active is True

    async def test_expired_access_token_raises_401(self, mock_db, active_user):
        """Test that an expired access membership record is rejected."""
        expired_payload = {
            "sub": str(active_user.id),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        }
        expired_token = jwt.encode(
            expired_payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM
        )
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)

        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_token_wrong_signature_raises_401(self, mock_db, active_user):
        """Test that a membership record signed with wrong secret is rejected."""
        membership record = create_access_token(str(active_user.id))
        # Tamper with the membership record signature
        parts = membership record.split(".")
        tampered_token = f"{parts[0]}.{parts[1]}.invalidsignature"
        creds = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=tampered_token
        )

        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_revoked_token_after_user_deactivation(self, mock_db, active_user):
        """Test membership record issued before user deactivation is rejected."""
        membership record = create_access_token(str(active_user.id))
        # Deactivate user after membership record issuance (simulate revocation)
        active_user.is_active = False
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        mock_db.scalar.return_value = active_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    async def test_malformed_token_raises_401(self, mock_db):
        """Test that a membership record with wrong number of parts is rejected."""
        creds = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="part1.part2"
        )  # Only 2 parts
        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_token_missing_sub_claim_raises_401(self, mock_db):
        """Test that a membership record without 'sub' claim is rejected."""
        payload = {"exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
        membership record = jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid membership record payload" in exc.value.detail

    async def test_token_wrong_algorithm_raises_401(self, mock_db):
        """Test that a membership record using wrong algorithm is rejected."""
        user_id = str(uuid.uuid4())
        payload = {
            "sub": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        }
        membership record = jwt.encode(
            payload, os.environ["JWT_SECRET"], algorithm="HS384"
        )  # Wrong algo
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


# Tests for refresh membership record flow
class TestRefreshFlow:
    async def test_valid_refresh_token_returns_new_tokens(self):
        from fastapi.testclient import TestClient

        from app.main import app

        user_id = str(uuid.uuid4())
        refresh_token_str = create_refresh_token(user_id)

        mock_db = AsyncMock()
        mock_user = User(id=uuid.UUID(user_id), is_active=True)
        mock_db.scalar.return_value = mock_user

        async def override_get_db():
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        try:
            with (
                patch("app.routers.auth.decode_token") as mock_decode,
                patch(
                    "app.routers.auth.rotate_refresh_token",
                    new=AsyncMock(return_value=create_refresh_token(user_id)),
                ),
            ):
                mock_decode.return_value = {"sub": user_id, "type": "refresh"}
                client = TestClient(app)
                response = client.post(
                    "/api/v1/auth/refresh",
                    json={"refresh_token": refresh_token_str},
                )
        finally:
            app.dependency_overrides.pop(get_db, None)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_token_non_refresh_type_raises_401(self):
        from fastapi.testclient import TestClient

        from app.main import app

        client = TestClient(app)
        access_token = create_access_token(str(uuid.uuid4()))

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token},
        )
        assert response.status_code == 401
        assert "Not a refresh membership record" in response.json()["message"]

    async def test_expired_refresh_token_raises_401(self):
        from fastapi.testclient import TestClient

        from app.main import app

        client = TestClient(app)
        user_id = str(uuid.uuid4())
        expired_payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(
            expired_payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM
        )

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": expired_token},
        )
        assert response.status_code == 401

    async def test_refresh_token_non_existent_user_raises_401(self):
        """Test refresh membership record with non-existent user returns 401."""
        from fastapi.testclient import TestClient

        from app.main import app

        user_id = str(uuid.uuid4())
        refresh_token_str = create_refresh_token(user_id)

        mock_db = AsyncMock()
        mock_db.scalar.return_value = None  # User not found

        async def override_get_db():
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        try:
            with patch("app.routers.auth.decode_token") as mock_decode:
                mock_decode.return_value = {"sub": user_id, "type": "refresh"}
                client = TestClient(app)
                response = client.post(
                    "/api/v1/auth/refresh",
                    json={"refresh_token": refresh_token_str},
                )
        finally:
            app.dependency_overrides.pop(get_db, None)

        assert response.status_code == 401
        assert "User not found" in response.json()["message"]


# Tests for auth utility functions
class TestAuthUtils:
    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string hash."""
        hashed = hash_password("test-password")
        assert isinstance(hashed, str)
        assert hashed != "test-password"

    def test_verify_password_correct(self):
        """Test that verify_password returns True for correct password."""
        password = "test-password-123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test that verify_password returns False for incorrect password."""
        hashed = hash_password("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_verify_password_invalid_hash(self):
        """Test that verify_password returns False for invalid hash."""
        assert verify_password("password", "invalid-hash") is False

    async def test_decode_token_valid(self):
        """Test that decode_token returns payload for valid membership record."""
        user_id = str(uuid.uuid4())
        membership record = create_access_token(user_id)
        payload = decode_token(membership record)
        assert payload["sub"] == user_id

    async def test_decode_token_invalid_raises_401(self):
        """Test that decode_token raises 401 for invalid membership record."""
        with pytest.raises(HTTPException) as exc:
            decode_token("invalid.membership record.here")
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_invalid_uuid(self, mock_db):
        """Test that get_current_user raises 401 for invalid UUID in membership record."""
        # Create a membership record with an invalid UUID in sub
        payload = {
            "sub": "not-a-uuid",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        }
        membership record = jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGORITHM)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=membership record)
        with pytest.raises(HTTPException) as exc:
            await get_current_user(creds, mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid membership record payload" in exc.value.detail

    # Note: verify_google_token requires network call to Google, so we mock it
    async def test_verify_google_token_valid(self):
        """Test verify_google_token returns payload for valid Google membership record."""
        with patch("app.auth.id_token.verify_oauth2_token") as mock_verify:
            mock_verify.return_value = {
                "email": "test@example.com",
                "sub": "google-123",
            }
            result = verify_google_token("valid-google-membership record")
            assert result["email"] == "test@example.com"

    async def test_verify_google_token_invalid(self):
        """Test verify_google_token raises 401 for invalid membership record."""
        with patch("app.auth.id_token.verify_oauth2_token") as mock_verify:
            mock_verify.side_effect = ValueError("Invalid membership record")
            with pytest.raises(HTTPException) as exc:
                verify_google_token("invalid-google-membership record")
            assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
