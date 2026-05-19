"""Shared fixtures for benchmark tests.

Provides a FastAPI TestClient with an in-memory SQLite database,
mirroring the setup from the main test conftest but optimized for
benchmark isolation (no coverage overhead).
"""

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Set environment variables before any app imports
os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)
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

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402

get_settings.cache_clear()

from app import database  # noqa: E402

database.engine = create_async_engine("sqlite+aiosqlite:///:memory:")

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.rate_limit import reset_rate_limits  # noqa: E402


@pytest.fixture()
def db_session_factory(tmp_path):
    """Create a fresh async session factory backed by a temp SQLite file."""
    db_path = tmp_path / "bench.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path.as_posix()}")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def setup() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(setup())

    yield session_factory

    async def teardown() -> None:
        await engine.dispose()

    asyncio.run(teardown())


@pytest.fixture()
def client(db_session_factory):
    """Yield a FastAPI TestClient with DB dependency overridden."""
    async def override_get_db():
        async with db_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    reset_rate_limits()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    reset_rate_limits()


@pytest.fixture()
def benchmark_client(client):
    """Alias for client fixture — semantic clarity in benchmark tests."""
    return client
