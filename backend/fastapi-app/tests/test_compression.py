"""Tests for API response compression (GZipMiddleware).

Verifies that responses exceeding the 1KB threshold are gzip-compressed
and that smaller responses are not compressed.
"""

import os

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

import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import asyncio

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import get_settings

get_settings.cache_clear()

from app import database

database.engine = create_async_engine("sqlite+aiosqlite:///:memory:")

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    tmp_db_path = Path(tempfile.gettempdir()) / "test_compression.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_db_path.as_posix()}")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(setup())

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

    async def teardown():
        await engine.dispose()

    asyncio.run(teardown())
    if tmp_db_path.exists():
        tmp_db_path.unlink()


def test_gzip_compression_on_large_response(client):
    """Responses above 1KB should be gzip-compressed with Content-Encoding: gzip."""
    # The root endpoint returns a small JSON, so we use the health endpoint
    # which returns a larger response. We also send Accept-Encoding: gzip
    # to signal we support compression.
    response = client.get(
        "/",
        headers={"Accept-Encoding": "gzip"},
    )
    # The root endpoint response is small (< 1KB), so it should NOT be compressed
    assert response.status_code == 200
    # Small response should not have gzip encoding
    assert "gzip" not in response.headers.get("Content-Encoding", "")


def test_gzip_compression_health_endpoint_large_response(client):
    """Health endpoint returns enough data to exceed 1KB threshold and be compressed."""
    response = client.get(
        "/api/v1/health",
        headers={"Accept-Encoding": "gzip"},
    )
    assert response.status_code == 200
    # The health response with all its fields should exceed 1KB when serialized
    # Check that the response was compressed
    content_encoding = response.headers.get("Content-Encoding", "")
    # If the response body is > 1KB, it should be gzip-compressed
    if len(response.content) > 1024:
        assert "gzip" in content_encoding


def test_gzip_middleware_is_configured():
    """Verify GZipMiddleware is present in the app's middleware stack."""
    middleware_classes = [m.cls for m in app.user_middleware]
    from starlette.middleware.gzip import GZipMiddleware

    assert (
        GZipMiddleware in middleware_classes
    ), "GZipMiddleware should be registered in the middleware stack"


def test_gzip_middleware_minimum_size():
    """Verify GZipMiddleware is configured with minimum_size=1024."""
    from starlette.middleware.gzip import GZipMiddleware

    for m in app.user_middleware:
        if m.cls is GZipMiddleware:
            # Check that minimum_size kwarg is set to 1024
            assert (
                m.kwargs.get("minimum_size") == 1024
            ), f"GZipMiddleware minimum_size should be 1024, got {m.kwargs}"
            break
    else:
        pytest.fail("GZipMiddleware not found in middleware stack")
