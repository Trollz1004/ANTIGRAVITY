"""JWT authentication utilities."""

import hashlib
import secrets
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
from app.error_responses import ErrorCode, bad_request
from app.models import User
from app.models_password_reset import PasswordResetToken
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


PASSWORD_RESET_TOKEN_BYTES = 32
_password_reset_at_ts: dict[uuid.UUID, float] = {}


def create_access_token(
    user_id: str,
    expires_minutes: int | None = None,
    *,
    password_hash: str | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    claims: dict[str, object] = {
        "sub": user_id,
        "exp": expire,
        "iat_ts": now.timestamp(),
    }
    if password_hash:
        claims["pwd"] = hashlib.sha256(password_hash.encode()).hexdigest()[:16]
    return jwt.encode(
        claims,
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    """Generate a raw refresh token JWT (opaque string to send to the client)."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh", "jti": str(uuid.uuid4())},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
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
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        parsed_user_id = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload") from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    ensure_active_user(user)
    token_pwd = payload.get("pwd")
    user_pwd_hash = getattr(user, "password_hash", None)
    if (
        isinstance(token_pwd, str)
        and isinstance(user_pwd_hash, str)
        and user_pwd_hash
        and token_pwd != hashlib.sha256(user_pwd_hash.encode()).hexdigest()[:16]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired after password reset",
        )
    reset_cutoff = _password_reset_at_ts.get(parsed_user_id)
    if reset_cutoff is not None:
        token_iat_ts = payload.get("iat_ts")
        if (
            not isinstance(token_iat_ts, (int, float))
            or float(token_iat_ts) <= reset_cutoff
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired after password reset",
            )
    prior_state = user.subscription_active
    sync_subscription_state(user)
    if user.subscription_active != prior_state:
        await db.commit()
    return user


VERIFICATION_REQUIRED_DETAIL = (
    "Verification required — complete verification to browse, match, and message"
)


async def require_verified_profile(
    user: User = Depends(get_current_user),
) -> User:
    """Require the caller to be verified.

    Interaction endpoints (discover, swipe, send message) depend on this
    instead of ``get_current_user`` so unverified accounts cannot browse,
    match, or message.

    Checks ``User.bot_shield_verified`` — the canonical flag every
    verification path (``/verify/confirm``, beta-access grants) sets — not
    ``Profile.verified``, which is only a best-effort mirror of it: a user
    can be genuinely verified with no profile row yet (beta-access creates
    one with no profile), or verified before their profile existed (the
    mirror in ``promote_user_verification_if_ready`` only writes to a
    profile that already exists at promotion time). Gating on the mirror
    would 403 legitimately verified users.
    """
    if not user.bot_shield_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=VERIFICATION_REQUIRED_DETAIL,
        )
    return user


def is_founder_or_admin(user: User) -> bool:
    if getattr(user, "is_admin", False) is True:
        return True
    current_settings = get_settings()
    email = (getattr(user, "email", None) or "").strip().lower()
    return bool(email) and email in current_settings.support_operator_email_list


async def require_founder_or_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not is_founder_or_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Founder or admin access required",
        )
    return user


def verify_google_token(token: str) -> dict:
    try:
        id_info = id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.google_client_id
        )
        return id_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {e}",
        )


# ── OPU-47: Refresh Token Rotation ──


def _hash_token(raw_token: str) -> str:
    """Return SHA-256 hex digest of a raw token string."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


async def issue_refresh_token(
    db: AsyncSession,
    user_id: uuid.UUID | str,
    ip_address: str | None = None,
    user_agent: str | None = None,
    *,
    replaced_token: RefreshToken | None = None,
    revoked_at: datetime | None = None,
) -> str:
    """Create a raw refresh token and persist its RefreshToken row (hash, user, expiry)."""
    parsed_user_id = (
        user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))
    )
    new_raw_token = create_refresh_token(str(parsed_user_id))
    new_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    new_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=parsed_user_id,
        token_hash=_hash_token(new_raw_token),
        expires_at=new_expires,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(new_token)
    await db.flush()

    if replaced_token is not None:
        replaced_token.revoked_at = revoked_at or datetime.now(timezone.utc)
        replaced_token.replaced_by = new_token.id

    if hasattr(db, "sync_session"):
        db.sync_session.expire_on_commit = False
    await db.commit()
    return new_raw_token


async def rotate_refresh_token(
    db: AsyncSession,
    raw_token: str,
    user_id: uuid.UUID,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> str:
    """
    Rotate a refresh token: validate the old one, revoke it, issue a new one.

    Returns the new raw refresh token string.

    Raises HTTP 401 if the token is not found, expired, or already revoked.
    If the token was already revoked (reuse detection), ALL tokens for the user
    are revoked as a security measure (potential token theft).
    """
    token_hash = _hash_token(raw_token)

    # Look up the stored token record
    stored_token = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )

    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(timezone.utc)

    # Check expiry
    expires_at = stored_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Reuse detection: if the token was already revoked, someone is reusing it
    if stored_token.revoked_at is not None:
        # Potential token theft — revoke ALL tokens for this user
        await revoke_all_user_tokens(db, user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected. All sessions revoked.",
        )

    # Decode the JWT to get the user_id (defense in depth — we already have it)
    payload = decode_token(raw_token)
    token_user_id = uuid.UUID(str(payload["sub"]))

    return await issue_refresh_token(
        db=db,
        user_id=token_user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        replaced_token=stored_token,
        revoked_at=now,
    )


async def revoke_all_user_tokens(db: AsyncSession, user_id: uuid.UUID) -> int:
    """
    Revoke all active refresh tokens for a user.
    Called on token reuse detection or explicit logout-all.
    Returns the number of tokens revoked.
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
    for token in active_tokens:
        token.revoked_at = now
        count += 1
    await db.commit()
    return count


async def purge_expired_tokens(db: AsyncSession, max_age_days: int = 30) -> int:
    """
    Delete refresh tokens that have been expired for more than max_age_days.
    Can be called periodically by a cleanup job.
    Returns the number of tokens deleted.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.expires_at < cutoff)
    )
    expired_tokens = result.scalars().all()
    count = 0
    for token in expired_tokens:
        await db.delete(token)
        count += 1
    await db.commit()
    return count


async def issue_password_reset_token(
    db: AsyncSession,
    user_id: uuid.UUID,
    ip_address: str | None = None,
) -> str:
    """Issue a single-use 30-minute password reset token and invalidate prior unused ones."""
    now = datetime.now(timezone.utc)
    current_settings = get_settings()

    existing_result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used_at.is_(None),
        )
    )
    for prior_token in existing_result.scalars().all():
        prior_token.used_at = now

    raw_token = secrets.token_urlsafe(PASSWORD_RESET_TOKEN_BYTES)
    reset_row = PasswordResetToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=_hash_token(raw_token),
        expires_at=now
        + timedelta(minutes=current_settings.password_reset_expire_minutes),
        ip_address=ip_address,
    )
    db.add(reset_row)
    await db.commit()
    return raw_token


async def consume_password_reset_token(
    db: AsyncSession,
    raw_token: str,
    new_password: str,
) -> User:
    """Validate and burn a password reset token, update password, and end all sessions."""
    cleaned_token = raw_token.strip()
    token_hash = _hash_token(cleaned_token)
    reset_row = await db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    now = datetime.now(timezone.utc)

    if reset_row is None or reset_row.used_at is not None:
        raise bad_request(
            message="This password reset link is invalid or has expired.",
            details={"code": ErrorCode.TOKEN_INVALID},
        )

    expires_at = reset_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise bad_request(
            message="This password reset link is invalid or has expired.",
            details={"code": ErrorCode.TOKEN_INVALID},
        )

    user = await db.scalar(select(User).where(User.id == reset_row.user_id))
    if not user:
        raise bad_request(
            message="This password reset link is invalid or has expired.",
            details={"code": ErrorCode.TOKEN_INVALID},
        )
    ensure_active_user(user)

    reset_row.used_at = now
    user.password_hash = hash_password(new_password)
    user.updated_at = now
    _password_reset_at_ts[user.id] = now.timestamp()
    await revoke_all_user_tokens(db, user.id)
    return user
