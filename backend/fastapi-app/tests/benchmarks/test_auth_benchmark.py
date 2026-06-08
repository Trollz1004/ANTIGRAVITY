"""Performance benchmarks for authentication endpoints."""

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.auth import _hash_token, create_refresh_token, hash_password
from app.config import get_settings
from app.models import RefreshToken, User
from tests.benchmarks.utils import assert_slo, measure_latency


async def _seed_user(db_session_factory) -> tuple[uuid.UUID, str]:
    """Helper to seed a user for auth benchmarks."""
    user_id = uuid.uuid4()
    password = "super-secret-password"
    async with db_session_factory() as session:
        session.add(
            User(
                id=user_id,
                email="benchmark@example.com",
                password_hash=hash_password(password),
                display_name="Benchmark User",
                date_of_birth=date(1990, 1, 1),
                adult_verified_at=datetime.now(timezone.utc),
                is_active=True,
            )
        )
        await session.commit()
    return user_id, password


async def _seed_refresh_token(db_session_factory, user_id: uuid.UUID) -> str:
    """Helper to seed a refresh token."""
    raw_token_value = create_refresh_token(str(user_id))
    token_hash = _hash_token(raw_token_value)
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    async with db_session_factory() as session:
        session.add(
            RefreshToken(
                id=uuid.uuid4(),
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires,
                ip_address="127.0.0.1",
                user_agent="BenchmarkAgent/1.0",
            )
        )
        await session.commit()
    return raw_token_value  # Return the raw token value for the client to use


@pytest.fixture(scope="module")
def seeded_auth_data(db_session_factory):
    """Fixture to provide seeded user and refresh token."""
    settings = get_settings()
    settings.auth_rate_limit_per_minute = 1_000
    user_id, password = asyncio.run(_seed_user(db_session_factory))
    refresh_token = asyncio.run(_seed_refresh_token(db_session_factory, user_id))
    return {"user_id": user_id, "password": password, "refresh_token": refresh_token}


@pytest.mark.parametrize("n_requests", [50])
def test_auth_login_latency(
    benchmark_client: TestClient, seeded_auth_data, n_requests: int
):
    """Benchmark POST /api/v1/auth/login."""
    print(f"\nBenchmarking POST /api/v1/auth/login with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "POST",
        "/api/v1/auth/login",
        n=n_requests,
        json={
            "email": "benchmark@example.com",
            "password": seeded_auth_data["password"],
        },
    )

    print(f"Login Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/auth/login", p95_limit=600.0)
    assert not violations, "\n".join(violations)


@pytest.mark.parametrize("n_requests", [50])
def test_auth_me_latency(
    benchmark_client: TestClient, seeded_auth_data, n_requests: int
):
    """Benchmark GET /api/v1/auth/me."""
    # First, get a valid access token
    login_response = benchmark_client.post(
        "/api/v1/auth/login",
        json={
            "email": "benchmark@example.com",
            "password": seeded_auth_data["password"],
        },
    )
    access_token = login_response.json()["access_token"]

    print(f"\nBenchmarking GET /api/v1/auth/me with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "GET",
        "/api/v1/auth/me",
        n=n_requests,
        headers={"Authorization": f"Bearer {access_token}"},
    )

    print(f"Auth Me Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/auth/me", p95_limit=200.0)
    assert not violations, "\n".join(violations)


@pytest.mark.parametrize("n_requests", [50])
def test_auth_refresh_latency(
    benchmark_client: TestClient, seeded_auth_data, n_requests: int
):
    """Benchmark POST /api/v1/auth/refresh."""
    print(f"\nBenchmarking POST /api/v1/auth/refresh with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "POST",
        "/api/v1/auth/refresh",
        n=n_requests,
        json={"refresh_token": seeded_auth_data["refresh_token"]},
    )

    print(f"Auth Refresh Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/auth/refresh", p95_limit=200.0)
    assert not violations, "\n".join(violations)
