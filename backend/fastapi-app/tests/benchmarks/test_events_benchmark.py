"""Performance benchmarks for events endpoints."""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.auth import create_access_token, hash_password
from app.models import Event, User
from tests.benchmarks.utils import assert_slo, measure_latency


async def _seed_user(db_session_factory) -> uuid.UUID:
    """Helper to seed a user for event benchmarks."""
    user_id = uuid.uuid4()
    async with db_session_factory() as session:
        session.add(
            User(
                id=user_id,
                email="event_user@example.com",
                password_hash=hash_password("password123"),
                display_name="Event User",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True,
            )
        )
        await session.commit()
    return user_id


async def _seed_events(
    db_session_factory, organizer_id: uuid.UUID, count: int
) -> list[uuid.UUID]:
    """Helper to seed multiple events."""
    event_ids = []
    async with db_session_factory() as session:
        for i in range(count):
            event_id = uuid.uuid4()
            session.add(
                Event(
                    id=event_id,
                    organizer_id=organizer_id,
                    title=f"Test Event {i} {uuid.uuid4().hex[:4]}",
                    description=f"A wonderful test event number {i}." * 3,
                    location="Virtual",
                    event_date=datetime.now(timezone.utc) + timedelta(days=i),
                    max_attendees=100,
                    category="social",
                    created_at=datetime.now(timezone.utc),
                )
            )
            event_ids.append(event_id)
        await session.commit()
    return event_ids


@pytest.fixture(scope="module")
def seeded_events_data(db_session_factory):
    """Fixture to provide seeded events and an access token."""
    user_id = asyncio.run(_seed_user(db_session_factory))
    event_ids = asyncio.run(_seed_events(db_session_factory, user_id, 20))

    # Get an access token for the seeded user
    access_token = create_access_token(str(user_id))
    return {"event_ids": event_ids, "access_token": access_token}


@pytest.mark.parametrize("n_requests", [50])
def test_events_list_latency(
    benchmark_client: TestClient, seeded_events_data, n_requests: int
):
    """Benchmark GET /api/v1/events for listing events."""
    print(f"\nBenchmarking GET /api/v1/events with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "GET",
        "/api/v1/events",
        n=n_requests,
        headers={"Authorization": f"Bearer {seeded_events_data['access_token']}"},
    )

    print(f"Events List Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/events (list)", p95_limit=200.0)
    assert not violations, "\n".join(violations)


@pytest.mark.parametrize("n_requests", [50])
def test_events_detail_latency(
    benchmark_client: TestClient, seeded_events_data, n_requests: int
):
    """Benchmark GET /api/v1/events/:id for a single event detail."""
    event_id = seeded_events_data["event_ids"][0]  # Use the first seeded event
    print(f"\nBenchmarking GET /api/v1/events/{event_id} with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "GET",
        f"/api/v1/events/{event_id}",
        n=n_requests,
        headers={"Authorization": f"Bearer {seeded_events_data['access_token']}"},
    )

    print(f"Events Detail Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/events/:id (detail)", p95_limit=200.0)
    assert not violations, "\n".join(violations)
