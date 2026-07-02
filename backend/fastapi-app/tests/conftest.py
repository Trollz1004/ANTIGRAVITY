"""Shared test fixtures for YouAndINotAI backend tests.

These fixtures provide mock objects and utilities for testing
auth flows, verification flows, and webhook signature verification
without requiring a live database or external services.
"""

import asyncio
import base64
import hashlib
import hmac
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Set environment variables IMMEDIATELY
os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)
os.environ["METRICS_API_KEY"] = ""  # Use empty string so fallback to JWT_SECRET works in tests
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SQUARE_WEBHOOK_VERIFY_SIGNATURE"] = "true"
os.environ["SQUARE_BOT_SHIELD_PAYMENT_LINK"] = "https://square.link/u/Qc5mxUy7"
os.environ.setdefault("SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY", "test-square-signature")
os.environ.setdefault(
    "SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL",
    "http://testserver/api/v1/webhooks/square-payment",
)
os.environ.setdefault("SQUARE_BOOKING_WEBHOOK_SIGNATURE_KEY", "test-square-signature")
os.environ.setdefault(
    "SQUARE_BOOKING_WEBHOOK_NOTIFICATION_URL",
    "http://testserver/api/v1/webhooks/square-booking",
)
os.environ.setdefault("CORS_ORIGINS", "http://testserver")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402

get_settings.cache_clear()

from app import database  # noqa: E402

# Force the engine to use SQLite to prevent PG connection attempts during module-level init or lifespan
database.engine = create_async_engine("sqlite+aiosqlite:///:memory:")

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# ── Mock User Factory ──


def make_user(
    *,
    email: str = "test@example.com",
    display_name: str = "Test User",
    bot_shield_verified: bool = False,
    subscription_active: bool = False,
    subscription_tier: str | None = None,
    subscription_expires_at: datetime | None = None,
    square_customer_id: str | None = None,
) -> MagicMock:
    """Create a mock User object for testing."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = email
    user.display_name = display_name
    user.password_hash = "$2b$12$fakehash"
    user.bot_shield_verified = bot_shield_verified
    user.subscription_active = subscription_active
    user.subscription_tier = subscription_tier
    user.subscription_expires_at = subscription_expires_at
    user.square_customer_id = square_customer_id
    user.created_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
    user.updated_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
    user.profile = None
    return user


# ── Mock Verification Event Factory ──


def make_verification_event(
    *,
    user_id: uuid.UUID | None = None,
    challenge_type: str = "liveness",
    status: str = "passed",
    trust_score: float | None = 60.0,
    amount_cents: int | None = 100,
) -> MagicMock:
    """Create a mock VerificationEvent object for testing."""
    event = MagicMock()
    event.id = uuid.uuid4()
    event.user_id = user_id or uuid.uuid4()
    event.challenge_type = challenge_type
    event.status = status
    event.trust_score = trust_score
    event.amount_cents = amount_cents
    event.square_payment_id = None
    event.challenge_token = None
    event.created_at = datetime.now(timezone.utc)
    event.completed_at = None
    return event


# ── Square Webhook Signature Utilities ──


def generate_square_signature(
    payload: bytes,
    signature_key: str,
    notification_url: str,
) -> str:
    """Generate a valid Square HMAC-SHA256 signature for testing."""
    body_text = payload.decode("utf-8", errors="replace")
    signed_payload = (notification_url + body_text).encode("utf-8")
    digest = hmac.new(
        signature_key.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def make_square_payment_event(
    *,
    event_id: str | None = None,
    event_type: str = "payment.updated",
    amount_cents: int = 100,
    customer_id: str | None = None,
    buyer_email: str | None = None,
    note: str = "Bot-Shield Verification",
    payment_status: str = "COMPLETED",
) -> dict:
    """Create a mock Square payment webhook event payload."""
    return {
        "event_id": event_id or f"evt_{uuid.uuid4().hex[:20]}",
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "object": {
                "payment": {
                    "id": f"pay_{uuid.uuid4().hex[:20]}",
                    "status": payment_status,
                    "amount_money": {
                        "amount": amount_cents,
                        "currency": "USD",
                    },
                    "customer_id": customer_id,
                    "buyer_email_address": buyer_email,
                    "note": note,
                    "order_id": f"order_{uuid.uuid4().hex[:10]}",
                }
            }
        },
    }


def make_square_booking_event(
    *,
    event_id: str | None = None,
    booking_id: str | None = None,
    booking_status: str = "ACCEPTED",
    customer_email: str = "customer@example.com",
) -> dict:
    """Create a mock Square booking webhook event payload."""
    return {
        "event_id": event_id or f"evt_{uuid.uuid4().hex[:20]}",
        "type": "booking.created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "merchant_id": "MERCHANT123",
        "data": {
            "object": {
                "booking": {
                    "id": booking_id or f"bk_{uuid.uuid4().hex[:10]}",
                    "status": booking_status,
                    "start_at": "2026-04-04T10:00:00Z",
                    "location_id": "LOC123",
                    "customer_id": "CUST123",
                    "customer_details": {
                        "email_address": customer_email,
                        "phone": "+155****4567",
                    },
                    "customer_note": "E-waste pickup",
                }
            }
        },
    }


@pytest.fixture(scope="session")
async def db_session_factory():  # Changed to async
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def setup() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def teardown() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    await setup()

    yield session_factory

    await teardown()


@pytest.fixture()
def client(db_session_factory):
    session_maker = db_session_factory

    async def reset_db() -> None:
        engine = session_maker.kw["bind"]
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(reset_db())

    try:
        from app.rate_limit_redis import reset_test_rate_limits

        reset_test_rate_limits()
    except Exception:
        pass

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
async def isolated_db_session(db_session_factory):
    """
    Provides an isolated database session for each test using SAVEPOINTs.
    This fixture ensures that database changes made during a test are rolled back
    at the end of the test, preventing test pollution.
    """
    engine = db_session_factory.kw["bind"]

    connection = await engine.connect()
    transaction = await connection.begin()  # Outer transaction
    nested = await connection.begin_nested()  # SAVEPOINT

    # Create a session bound to this connection and transaction
    Session = async_sessionmaker(
        autocommit=False, autoflush=False, bind=connection, expire_on_commit=False
    )
    session = Session()

    try:
        yield session
    finally:
        if nested.is_active:
            await nested.rollback()
        if transaction.is_active:
            await transaction.rollback()  # Rollback outer transaction too
        await connection.close()
        await session.close()


@pytest.fixture()
def isolated_client(isolated_db_session: AsyncSession):
    """
    Provides a FastAPI TestClient that uses an isolated database session
    for each test. This client ensures that all requests made during a test
    are within a transaction that will be rolled back, providing full isolation.
    """

    async def override_get_db_isolated():
        yield isolated_db_session

    app.dependency_overrides[get_db] = override_get_db_isolated

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
