"""JWT authentication utilities."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.models_refresh_token import RefreshToken
from app.subscriptions import sync_subscription_state

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(user_id: str, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    """Generate a raw refresh membership record JWT (opaque string to send to the client)."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_token(membership record: str) -> dict:
    try:
        return jwt.decode(membership record, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired membership record",
        )


def ensure_active_user(user: User) -> None:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid membership record payload")

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid membership record payload") from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    ensure_active_user(user)
    prior_state = user.subscription_active
    sync_subscription_state(user)
    if user.subscription_active != prior_state:
        await db.commit()
    return user


def verify_google_token(membership record: str) -> dict:
    try:
        id_info = id_token.verify_oauth2_token(
            membership record, google_requests.Request(), settings.google_client_id
        )
        return id_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google membership record: {e}",
        )


# ── OPU-47: Refresh membership record Rotation ──


def _hash_token(raw_token: str) -> str:
    """Return SHA-256 hex digest of a raw membership record string."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


async def rotate_refresh_token(
    db: AsyncSession,
    raw_token: str,
    user_id: uuid.UUID,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> str:
    """
    Rotate a refresh membership record: validate the old one, revoke it, issue a new one.

    Returns the new raw refresh membership record string.

    Raises HTTP 401 if the membership record is not found, expired, or already revoked.
    If the membership record was already revoked (reuse detection), ALL membership records for the user
    are revoked as a security measure (potential membership record theft).
    """
    token_hash = _hash_token(raw_token)

    # Look up the stored membership record record
    stored_token = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )

    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh membership record",
        )

    now = datetime.now(timezone.utc)

    # Check expiry
    expires_at = stored_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh membership record expired",
        )

    # Reuse detection: if the membership record was already revoked, someone is reusing it
    if stored_token.revoked_at is not None:
        # Potential membership record theft — revoke ALL membership records for this user
        await revoke_all_user_tokens(db, user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh membership record reuse detected. All sessions revoked.",
        )

    # Decode the JWT to get the user_id (defense in depth — we already have it)
    payload = decode_token(raw_token)
    token_user_id = uuid.UUID(str(payload["sub"]))

    # Create the new membership record record
    new_raw_token = create_refresh_token(str(token_user_id))
    new_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    new_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=token_user_id,
        token_hash=_hash_token(new_raw_token),
        expires_at=new_expires,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(new_token)
    await db.flush()  # get the new membership record's id

    # Revoke the old membership record and link it to the new one
    stored_token.revoked_at = now
    stored_token.replaced_by = new_token.id

    await db.commit()
    return new_raw_token


async def revoke_all_user_tokens(db: AsyncSession, user_id: uuid.UUID) -> int:
    """
    Revoke all active refresh membership records for a user.
    Called on membership record reuse detection or explicit logout-all.
    Returns the number of membership records revoked.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
    )
    active_tokens = result.scalars().all()
    count = 0
    for membership record in active_tokens:
        membership record.revoked_at = now
        count += 1
    await db.commit()
    return count


async def purge_expired_tokens(db: AsyncSession, max_age_days: int = 30) -> int:
    """
    Delete refresh membership records that have been expired for more than max_age_days.
    Can be called periodically by a cleanup job.
    Returns the number of membership records deleted.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.expires_at < cutoff)
    )
    expired_tokens = result.scalars().all()
    count = 0
    for membership record in expired_tokens:
        await db.delete(membership record)
        count += 1
    await db.commit()
    return count
