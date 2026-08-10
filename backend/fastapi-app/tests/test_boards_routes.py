"""Tests for social boards routes.

Endpoints covered:
- GET  /api/v1/boards
- GET  /api/v1/boards/{slug}/posts
- POST /api/v1/boards/{slug}/posts
- GET  /api/v1/boards/{slug}/posts/{post_id}/comments
- POST /api/v1/boards/{slug}/posts/{post_id}/comments
- POST /api/v1/boards/posts/{post_id}/report
"""

import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import User
from tests.helpers import override_user, seed


def _make_user(*, email: str, display_name: str = "Board User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── GET /api/v1/boards ────────────────────────────────────────────────────────


def test_list_boards_auto_creates_defaults(client, db_session_factory):
    user = _make_user(email="boards_list@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get("/api/v1/boards")
        assert resp.status_code == 200
        boards = resp.json()
        slugs = [b["slug"] for b in boards]
        assert "general" in slugs
        assert "dating-tips" in slugs
        assert "success-stories" in slugs
        assert "events" in slugs
        assert "volunteering" in slugs
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_boards_idempotent(client, db_session_factory):
    """Calling /boards twice should not duplicate the default boards."""
    user = _make_user(email="boards_idem@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp1 = client.get("/api/v1/boards")
        resp2 = client.get("/api/v1/boards")
        assert len(resp1.json()) == len(resp2.json())
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/boards/{slug}/posts ──────────────────────────────────────────


def test_list_posts_empty(client, db_session_factory):
    user = _make_user(email="posts_empty@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")  # ensure default boards exist
        resp = client.get("/api/v1/boards/general/posts")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_posts_unknown_board_returns_404(client, db_session_factory):
    user = _make_user(email="posts_404@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get("/api/v1/boards/nonexistent-board/posts")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/boards/{slug}/posts ─────────────────────────────────────────


def test_create_post_returns_201(client, db_session_factory):
    user = _make_user(email="post_create@example.com", display_name="Alice")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")  # ensure boards exist
        resp = client.post(
            "/api/v1/boards/general/posts",
            json={"title": "Hello World", "body": "This is my first post"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Hello World"
        assert data["author_name"] == "Alice"
        assert data["like_count"] == 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_post_unknown_board_returns_404(client, db_session_factory):
    user = _make_user(email="post_404@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(
            "/api/v1/boards/no-such-board/posts",
            json={"title": "Oops", "body": "Board missing"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/boards/{slug}/posts/{post_id}/comments ───────────────────────


def test_list_comments_empty(client, db_session_factory):
    user = _make_user(email="comments_empty@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")
        post_resp = client.post(
            "/api/v1/boards/general/posts",
            json={"title": "A post", "body": "Post body"},
        )
        post_id = post_resp.json()["id"]
        resp = client.get(f"/api/v1/boards/general/posts/{post_id}/comments")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/boards/{slug}/posts/{post_id}/comments ──────────────────────


def test_create_comment_returns_201(client, db_session_factory):
    user = _make_user(email="comment_create@example.com", display_name="Bob")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")
        post_resp = client.post(
            "/api/v1/boards/general/posts",
            json={"title": "My post", "body": "Post body"},
        )
        post_id = post_resp.json()["id"]

        resp = client.post(
            f"/api/v1/boards/general/posts/{post_id}/comments",
            json={"body": "Great post!"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["body"] == "Great post!"
        assert data["author_name"] == "Bob"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_comment_unknown_post_returns_404(client, db_session_factory):
    user = _make_user(email="comment_404@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")
        resp = client.post(
            f"/api/v1/boards/general/posts/{uuid.uuid4()}/comments",
            json={"body": "Comment on ghost post"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/boards/posts/{post_id}/report ───────────────────────────────


def test_report_post_returns_200(client, db_session_factory):
    user = _make_user(email="report_post@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")
        post_resp = client.post(
            "/api/v1/boards/general/posts",
            json={"title": "Spam post", "body": "Buy now!"},
        )
        post_id = post_resp.json()["id"]

        resp = client.post(
            f"/api/v1/boards/posts/{post_id}/report",
            json={"reason": "Spam content"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "reported"
        assert data["post_id"] == post_id
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_report_unknown_post_returns_404(client, db_session_factory):
    user = _make_user(email="report_404@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(
            f"/api/v1/boards/posts/{uuid.uuid4()}/report",
            json={"reason": "Spam"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)
