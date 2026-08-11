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
from app.models import Board, Comment, Post, User
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
    user.bot_shield_verified = True
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
    user.bot_shield_verified = True
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
    user.bot_shield_verified = True
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
    user.bot_shield_verified = True
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


def test_list_posts_excludes_unverified_author(client, db_session_factory):
    """A post from a legacy unverified author must not surface to a verified reader."""
    reader = _make_user(email="posts_reader@example.com")
    reader.bot_shield_verified = True
    unverified_author = _make_user(
        email="posts_unverified_author@example.com", display_name="Unverified Author"
    )
    seed(reader, unverified_author, db_session_factory=db_session_factory)

    board = Board(
        id=uuid.uuid4(), name="Legacy Board", slug="legacy-board", description=""
    )
    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=unverified_author.id,
        title="Legacy post",
        body="Posted before the gate",
    )
    seed(board, post, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(reader)
    try:
        resp = client.get("/api/v1/boards/legacy-board/posts")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /api/v1/boards/{slug}/posts/{post_id}/comments ───────────────────────


def test_list_comments_empty(client, db_session_factory):
    user = _make_user(email="comments_empty@example.com")
    user.bot_shield_verified = True
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


def test_list_comments_excludes_unverified_author(client, db_session_factory):
    """A comment from a legacy unverified author must not surface to a verified reader."""
    reader = _make_user(email="comments_reader@example.com")
    reader.bot_shield_verified = True
    verified_author = _make_user(
        email="comments_verified_author@example.com", display_name="Post Author"
    )
    verified_author.bot_shield_verified = True
    unverified_commenter = _make_user(
        email="comments_unverified_author@example.com",
        display_name="Unverified Commenter",
    )
    board = Board(id=uuid.uuid4(), name="C Board", slug="c-board", description="")
    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=verified_author.id,
        title="A verified post",
        body="Post body",
    )
    comment = Comment(
        id=uuid.uuid4(),
        post_id=post.id,
        author_id=unverified_commenter.id,
        body="Legacy comment",
    )
    seed(
        reader,
        verified_author,
        unverified_commenter,
        board,
        post,
        comment,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(reader)
    try:
        resp = client.get(f"/api/v1/boards/c-board/posts/{post.id}/comments")
        assert resp.status_code == 200
        assert resp.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /api/v1/boards/{slug}/posts/{post_id}/comments ──────────────────────


def test_create_comment_on_unverified_authors_post_returns_404(
    client, db_session_factory
):
    """Commenting on a legacy post by an unverified author must be rejected."""
    commenter = _make_user(email="commenter_verified@example.com")
    commenter.bot_shield_verified = True
    unverified_post_author = _make_user(
        email="post_author_unverified@example.com", display_name="Unverified Author"
    )
    board = Board(id=uuid.uuid4(), name="D Board", slug="d-board", description="")
    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=unverified_post_author.id,
        title="Legacy post",
        body="Posted before the gate",
    )
    seed(
        commenter,
        unverified_post_author,
        board,
        post,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(commenter)
    try:
        resp = client.post(
            f"/api/v1/boards/d-board/posts/{post.id}/comments",
            json={"body": "Trying to comment"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_comment_returns_201(client, db_session_factory):
    user = _make_user(email="comment_create@example.com", display_name="Bob")
    user.bot_shield_verified = True
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
    user.bot_shield_verified = True
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
    user.bot_shield_verified = True
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
