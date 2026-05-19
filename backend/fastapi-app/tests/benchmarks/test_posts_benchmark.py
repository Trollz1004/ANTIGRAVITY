"""Performance benchmarks for posts endpoints."""

import asyncio
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.models import User, Board, Post
from app.auth import hash_password
from tests.benchmarks.utils import measure_latency, assert_slo


async def _seed_user(db_session_factory) -> uuid.UUID:
    """Helper to seed a user for post benchmarks."""
    user_id = uuid.uuid4()
    async with db_session_factory() as session:
        session.add(
            User(
                id=user_id,
                email="post_user@example.com",
                password_hash=hash_password("password123"),
                display_name="Post User",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                is_active=True,
            )
        )
        await session.commit()
        await session.refresh(session.query(User).filter_by(id=user_id).first())
    return user_id


async def _seed_board(db_session_factory) -> uuid.UUID:
    """Helper to seed a board for post benchmarks."""
    board_id = uuid.uuid4()
    board_name = f"Test Board {uuid.uuid4().hex[:4]}"
    async with db_session_factory() as session:
        session.add(
            Board(
                id=board_id,
                name=board_name,
                description=f"Description for {board_name}.",
                slug=board_name.lower().replace(" ", "-"),
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()
        await session.refresh(session.query(Board).filter_by(id=board_id).first())
    return board_id


async def _seed_posts(db_session_factory, board_id: uuid.UUID, author_id: uuid.UUID, count: int) -> list[uuid.UUID]:
    """Helper to seed multiple posts."""
    post_ids = []
    async with db_session_factory() as session:
        for i in range(count):
            post_id = uuid.uuid4()
            session.add(
                Post(
                    id=post_id,
                    board_id=board_id,
                    author_id=author_id,
                    title=f"Test Post Title {i} {uuid.uuid4().hex[:4]}",
                    body=f"This is the body of a test post number {i}." * 5,  # Larger body for detail view
                    created_at=datetime.now(timezone.utc),
                )
            )
            post_ids.append(post_id)
        await session.commit()
    return post_ids


@pytest.fixture(scope="module")
def seeded_posts_data(db_session_factory):
    """Fixture to provide seeded posts and an access token."""
    user_id = asyncio.run(_seed_user(db_session_factory))
    board_id = asyncio.run(_seed_board(db_session_factory))
    post_ids = asyncio.run(_seed_posts(db_session_factory, board_id, user_id, 20))

    # Get an access token for the seeded user
    access_token = create_access_token(str(user_id))
    return {"board_id": board_id, "post_ids": post_ids, "access_token": access_token}


@pytest.mark.parametrize("n_requests", [50])
def test_posts_list_latency(benchmark_client: TestClient, seeded_posts_data, n_requests: int):
    """Benchmark GET /api/v1/posts for listing posts."""
    print(f"\nBenchmarking GET /api/v1/posts with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "GET",
        f"/api/v1/posts?board_id={seeded_posts_data['board_id']}",
        n=n_requests,
        headers={"Authorization": f"Bearer {seeded_posts_data['access_token']}"},
    )

    print(f"Posts List Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/posts (list)", p95_limit=200.0)
    assert not violations, "\n".join(violations)


@pytest.mark.parametrize("n_requests", [50])
def test_posts_detail_latency(benchmark_client: TestClient, seeded_posts_data, n_requests: int):
    """Benchmark GET /api/v1/posts/:id for a single post detail."""
    post_id = seeded_posts_data["post_ids"][0]  # Use the first seeded post
    print(f"\nBenchmarking GET /api/v1/posts/{post_id} with {n_requests} requests...")
    stats = measure_latency(
        benchmark_client,
        "GET",
        f"/api/v1/posts/{post_id}",
        n=n_requests,
        headers={"Authorization": f"Bearer {seeded_posts_data['access_token']}"},
    )

    print(f"Posts Detail Endpoint Latency (n={n_requests}):")
    print(f"  p50: {stats['p50']:.2f} ms")
    print(f"  p95: {stats['p95']:.2f} ms")
    print(f"  p99: {stats['p99']:.2f} ms")
    print(f"  Mean: {stats['mean']:.2f} ms")
    print(f"  Min: {stats['min']:.2f} ms")
    print(f"  Max: {stats['max']:.2f} ms")

    violations = assert_slo(stats, "/api/v1/posts/:id (detail)", p95_limit=100.0)
    assert not violations, "\n".join(violations)
