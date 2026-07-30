"""Tests for refresh-token rotation, revocation, purge, and Google verify."""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.auth import (
    _hash_token,
    create_refresh_token,
    purge_expired_tokens,
    revoke_all_user_tokens,
    rotate_refresh_token,
    verify_google_token,
)
from app.models_refresh_token import RefreshToken


@pytest.fixture()
def session(db_session_factory):
    engine = db_session_factory.kw["bind"]
    from app.database import Base

    async def _reset():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_reset())

    holder = {}

    async def _open():
        holder["session"] = db_session_factory()

    asyncio.run(_open())
    yield holder["session"]
    asyncio.run(holder["session"].close())


def _stored_token(
    user_id: uuid.UUID, raw_token: str, *, days_ahead: int = 7
) -> RefreshToken:
    return RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=days_ahead),
    )


@pytest.mark.asyncio
class TestRotateRefreshToken:
    async def test_unknown_token_raises_401(self, session):
        with pytest.raises(HTTPException) as excinfo:
            await rotate_refresh_token(session, "nope", uuid.uuid4())
        assert excinfo.value.status_code == 401
        assert excinfo.value.detail == "Invalid refresh token"

    async def test_expired_token_raises_401(self, session):
        user_id = uuid.uuid4()
        raw = create_refresh_token(str(user_id))
        session.add(_stored_token(user_id, raw, days_ahead=-1))
        await session.flush()

        with pytest.raises(HTTPException) as excinfo:
            await rotate_refresh_token(session, raw, user_id)
        assert "expired" in excinfo.value.detail

    async def test_token_reuse_revokes_all_sessions(self, session):
        user_id = uuid.uuid4()
        raw = create_refresh_token(str(user_id))
        stolen = _stored_token(user_id, raw)
        stolen.revoked_at = datetime.now(timezone.utc)

        # A second still-active session that must also be revoked on reuse
        other_raw = create_refresh_token(str(user_id))
        other = _stored_token(user_id, other_raw)

        session.add_all([stolen, other])
        await session.flush()

        with pytest.raises(HTTPException) as excinfo:
            await rotate_refresh_token(session, raw, user_id)
        assert "reuse detected" in excinfo.value.detail
        assert other.revoked_at is not None

    async def test_successful_rotation_issues_and_links(self, session):
        user_id = uuid.uuid4()
        raw = create_refresh_token(str(user_id))
        stored = _stored_token(user_id, raw)
        session.add(stored)
        await session.flush()

        new_raw = await rotate_refresh_token(
            session, raw, user_id, ip_address="10.0.0.1", user_agent="pytest"
        )
        # Tokens are deterministic JWTs; the important part is the chain record
        assert isinstance(new_raw, str)

        # Old token revoked and linked to its replacement
        assert stored.revoked_at is not None
        assert stored.replaced_by is not None

    async def test_naive_expiry_is_treated_as_utc(self, session):
        user_id = uuid.uuid4()
        raw = create_refresh_token(str(user_id))
        stored = _stored_token(user_id, raw)
        stored.expires_at = stored.expires_at.replace(tzinfo=None)
        session.add(stored)
        await session.flush()

        new_raw = await rotate_refresh_token(session, raw, user_id)
        assert isinstance(new_raw, str)


@pytest.mark.asyncio
class TestRevokeAllAndPurge:
    async def test_revoke_all_counts_active_only(self, session):
        user_id = uuid.uuid4()
        active = _stored_token(user_id, create_refresh_token(str(user_id)))
        already_revoked = _stored_token(user_id, create_refresh_token(str(user_id)))
        already_revoked.revoked_at = datetime.now(timezone.utc)
        expired = _stored_token(
            user_id, create_refresh_token(str(user_id)), days_ahead=-1
        )
        stranger = _stored_token(uuid.uuid4(), create_refresh_token(str(uuid.uuid4())))
        session.add_all([active, already_revoked, expired, stranger])
        await session.flush()

        count = await revoke_all_user_tokens(session, user_id)
        assert count == 1
        assert active.revoked_at is not None
        assert stranger.revoked_at is None

    async def test_purge_deletes_only_old_expired(self, session):
        old_expired = RefreshToken(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            token_hash=_hash_token("old"),
            expires_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        fresh = _stored_token(uuid.uuid4(), "fresh")
        session.add_all([old_expired, fresh])
        await session.flush()

        deleted = await purge_expired_tokens(session, max_age_days=30)
        assert deleted == 1
        assert fresh.id is not None


class TestGoogleTokenVerification:
    def test_invalid_google_token_raises_401(self):
        with patch("app.auth.id_token.verify_oauth2_token") as mock_verify:
            mock_verify.side_effect = ValueError("bad token")
            with pytest.raises(HTTPException) as excinfo:
                verify_google_token("fake-token")
        assert excinfo.value.status_code == 401
        assert "Invalid Google token" in excinfo.value.detail

    def test_valid_google_token_returns_claims(self):
        claims = {"sub": "google-123", "email": "user@gmail.com"}
        with patch(
            "app.auth.id_token.verify_oauth2_token", return_value=claims
        ) as mock_verify:
            result = verify_google_token("real-token")
        assert result == claims
        args, _ = mock_verify.call_args
        assert args[0] == "real-token"
