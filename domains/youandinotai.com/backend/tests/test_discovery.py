"""Unit tests for discovery and matching router."""

import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, status
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.auth import get_current_user
from app.main import app
from app.models import Swipe, User
from app.routers import discovery
from tests.helpers import override_user, seed, verified_profile


def _make_user(*, email: str, display_name: str = "Test User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _discovery_router_client() -> TestClient:
    """Mount discovery.router directly so GET /api/v1/discover exercises
    app/routers/discovery.py instead of being shadowed by swipe.router."""
    sub_app = FastAPI()
    sub_app.include_router(discovery.router, prefix="/api/v1")
    sub_app.dependency_overrides = app.dependency_overrides
    return TestClient(sub_app)


def test_discovery_feed_empty(client: TestClient):
    """Test discovery feed returns empty list or valid profiles."""
    response = client.get(
        "/api/v1/discover",
    )
    # Auth required (the app's bearer dependency answers 401 for a missing token,
    # 403 for a present-but-rejected one) or 200
    assert response.status_code in [
        status.HTTP_200_OK,
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ]


def test_discovery_like_requires_auth(client: TestClient):
    """Test discovery like requires authentication."""
    target_id = str(uuid.uuid4())
    response = client.post(
        "/api/v1/discover/like",
        json={"target_id": target_id},
    )
    assert response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )


def test_discovery_preview_public(client: TestClient):
    """Test discovery preview is publicly accessible."""
    response = client.get("/api/v1/discover/preview")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)


def test_discover_unchecked_actor_returns_403(client: TestClient, db_session_factory):
    """An unchecked account cannot fetch GET /api/v1/discover in discovery.py."""
    actor = _make_user(email="unchecked_discover_actor@example.com")
    seed(
        actor,
        verified_profile(actor, verified=False),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        with _discovery_router_client() as router_client:
            resp = router_client.get("/api/v1/discover")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "verification" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_like_unchecked_actor_returns_403(
    client: TestClient, db_session_factory
):
    """An unchecked account cannot POST /api/v1/discover/like."""
    actor = _make_user(email="unchecked_like_actor@example.com")
    target = _make_user(email="checked_like_target@example.com")
    seed(
        actor,
        target,
        verified_profile(actor, verified=False),
        verified_profile(target),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/discover/like",
            json={"target_id": str(target.id)},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "verification" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_checked_actor_works(client: TestClient, db_session_factory):
    """A checked account can fetch GET /api/v1/discover in discovery.py."""
    actor = _make_user(email="checked_discover_actor@example.com")
    seed(
        actor,
        verified_profile(actor),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        with _discovery_router_client() as router_client:
            resp = router_client.get("/api/v1/discover")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_like_checked_actor_works(client: TestClient, db_session_factory):
    """A checked account can like another checked account on POST /api/v1/discover/like."""
    actor = _make_user(email="checked_liker@example.com")
    target = _make_user(email="checked_liked_target@example.com")
    seed(
        actor,
        target,
        verified_profile(actor),
        verified_profile(target),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/discover/like",
            json={"target_id": str(target.id)},
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["matched"] is False
        assert data["match_id"] is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_like_unchecked_target_returns_404(
    client: TestClient, db_session_factory
):
    """Liking an unchecked target on POST /api/v1/discover/like answers 404 and stores no swipe."""
    actor = _make_user(email="checked_actor_vs_unchecked@example.com")
    target = _make_user(email="unchecked_target_for_like@example.com")
    seed(
        actor,
        target,
        verified_profile(actor),
        verified_profile(target, verified=False),
        db_session_factory=db_session_factory,
    )
    app.dependency_overrides[get_current_user] = override_user(actor)
    try:
        resp = client.post(
            "/api/v1/discover/like",
            json={"target_id": str(target.id)},
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND

        async def _count_swipes():
            async with db_session_factory() as session:
                return (await session.scalars(select(Swipe))).all()

        assert asyncio.run(_count_swipes()) == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)
