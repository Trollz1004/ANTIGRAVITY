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
from app.models import Board, Comment, Post, User, UserBlock
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


def test_list_boards_creates_usa_when_other_boards_already_exist(
    client, db_session_factory
):
    """When other boards exist and usa does not, GET /boards creates usa."""
    user = _make_user(email="boards_backfill_usa@example.com")
    existing_board = Board(
        id=uuid.uuid4(),
        name="General",
        slug="general",
        description="Chat about anything",
    )
    seed(user, existing_board, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get("/api/v1/boards")
        assert resp.status_code == 200
        boards = resp.json()
        by_slug = {b["slug"]: b for b in boards}
        assert "usa" in by_slug
        assert by_slug["usa"] == {
            "slug": "usa",
            "name": "USA Group Chat",
            "description": "Open to every verified member, anywhere in the country.",
        }
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_boards_orders_usa_first_then_by_name(client, db_session_factory):
    """GET /boards lists usa first, and the remaining boards sorted by name."""
    user = _make_user(email="boards_order_usa@example.com")
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get("/api/v1/boards")
        assert resp.status_code == 200
        boards = resp.json()
        assert boards[0]["slug"] == "usa"
        assert boards[0]["name"] == "USA Group Chat"
        rest_names = [b["name"] for b in boards[1:]]
        assert rest_names == sorted(rest_names)
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


def test_list_usa_posts_without_list_boards_returns_200_empty(
    client, db_session_factory
):
    """On a fresh database where GET /boards was never called, GET /boards/usa/posts answers 200 with []."""
    user = _make_user(email="usa_posts_fresh_get@example.com")
    user.bot_shield_verified = True
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get("/api/v1/boards/usa/posts")
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


def test_create_usa_post_without_list_boards_returns_201(client, db_session_factory):
    """On a fresh database where GET /boards was never called, POST /boards/usa/posts answers 201 for a checked member."""
    user = _make_user(email="usa_posts_fresh_post@example.com", display_name="Alice")
    user.bot_shield_verified = True
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(
            "/api/v1/boards/usa/posts",
            json={"title": "USA hello", "body": "First message in USA room"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["board_slug"] == "usa"
        assert data["title"] == "USA hello"
        assert data["body"] == "First message in USA room"
        assert data["author_name"] == "Alice"
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


def test_list_posts_pagination_does_not_hide_verified_post_behind_unverified(
    client, db_session_factory
):
    """Filtering must happen before offset/limit -- a newer unverified post
    must not push an older verified post off the page (neither board client
    advances `offset`, so a post pushed off is invisible for good)."""
    reader = _make_user(email="posts_pagination_reader@example.com")
    reader.bot_shield_verified = True
    unverified_author = _make_user(
        email="posts_pagination_unverified@example.com",
        display_name="Unverified Author",
    )
    verified_author = _make_user(
        email="posts_pagination_verified@example.com", display_name="Verified Author"
    )
    verified_author.bot_shield_verified = True

    board = Board(
        id=uuid.uuid4(),
        name="Pagination Board",
        slug="pagination-board",
        description="",
    )
    older_verified_post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=verified_author.id,
        title="Older verified post",
        body="Should still be visible",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    newer_unverified_post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=unverified_author.id,
        title="Newer legacy post",
        body="Should be excluded",
        created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
    )
    seed(
        reader,
        unverified_author,
        verified_author,
        board,
        older_verified_post,
        newer_unverified_post,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(reader)
    try:
        # limit=1: the naive newest-first-then-filter approach would fetch
        # only the newer unverified post, filter it out, and return [] --
        # hiding the older verified post entirely.
        resp = client.get("/api/v1/boards/pagination-board/posts?limit=1")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["title"] == "Older verified post"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_usa_posts_supports_order_asc_and_desc_default_desc(
    client, db_session_factory
):
    """GET /boards/usa/posts orders desc by default, supports order=asc and order=desc."""
    user = _make_user(email="usa_posts_order@example.com", display_name="Verified")
    user.bot_shield_verified = True
    usa_board = Board(
        id=uuid.uuid4(),
        name="USA Group Chat",
        slug="usa",
        description="Open to every verified member, anywhere in the country.",
    )
    older_post = Post(
        id=uuid.uuid4(),
        board_id=usa_board.id,
        author_id=user.id,
        title="First message",
        body="Older post in USA Group Chat",
        created_at=datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
    )
    newer_post = Post(
        id=uuid.uuid4(),
        board_id=usa_board.id,
        author_id=user.id,
        title="Second message",
        body="Newer post in USA Group Chat",
        created_at=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
    )
    seed(
        user,
        usa_board,
        older_post,
        newer_post,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        default_resp = client.get("/api/v1/boards/usa/posts")
        assert default_resp.status_code == 200
        assert [p["title"] for p in default_resp.json()] == [
            "Second message",
            "First message",
        ]

        desc_resp = client.get("/api/v1/boards/usa/posts?order=desc")
        assert desc_resp.status_code == 200
        assert [p["title"] for p in desc_resp.json()] == [
            "Second message",
            "First message",
        ]

        asc_resp = client.get("/api/v1/boards/usa/posts?order=asc")
        assert asc_resp.status_code == 200
        assert [p["title"] for p in asc_resp.json()] == [
            "First message",
            "Second message",
        ]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_usa_posts_refuses_invalid_order_and_limit_above_100(
    client, db_session_factory
):
    """GET /boards/usa/posts refuses order values other than asc/desc and limit > 100."""
    user = _make_user(email="usa_posts_validation@example.com")
    user.bot_shield_verified = True
    seed(user, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        client.get("/api/v1/boards")

        bad_order = client.get("/api/v1/boards/usa/posts?order=invalid")
        assert bad_order.status_code == 422

        bad_limit = client.get("/api/v1/boards/usa/posts?limit=101")
        assert bad_limit.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_posts_does_not_rerun_ensure_boards_select_once_default_boards_exist(
    client, db_session_factory
):
    """Once default boards exist, repeated GET /api/v1/boards/{slug}/posts calls must not re-run _ensure_boards SELECT queries."""
    from sqlalchemy import event

    user = _make_user(email="boards_seed_memo@example.com")
    user.bot_shield_verified = True
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    sync_engine = db_session_factory.kw["bind"].sync_engine
    statements: list[str] = []

    def record_sql(_conn, _cursor, statement, _parameters, _context, _executemany):
        statements.append(statement)

    try:
        # First call seeds the default boards.
        initial_resp = client.get("/api/v1/boards/usa/posts")
        assert initial_resp.status_code == 200

        event.listen(sync_engine, "before_cursor_execute", record_sql)
        try:
            second_resp = client.get("/api/v1/boards/usa/posts")
            third_resp = client.get("/api/v1/boards/general/posts")
        finally:
            event.remove(sync_engine, "before_cursor_execute", record_sql)

        assert second_resp.status_code == 200
        assert third_resp.status_code == 200

        ensure_boards_selects = [
            sql
            for sql in statements
            if "FROM boards" in sql and "WHERE" not in sql.upper()
        ]
        assert ensure_boards_selects == []
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


def test_list_posts_excludes_blocked_authors_in_both_directions(
    client, db_session_factory
):
    """Posts from authors in blocked_by_user_subquery or blocked_user_subquery must be hidden."""
    reader = _make_user(email="posts_block_reader@example.com", display_name="Reader")
    reader.bot_shield_verified = True

    blocked_by_reader = _make_user(
        email="posts_blocked_by_reader@example.com", display_name="Blocked By Reader"
    )
    blocked_by_reader.bot_shield_verified = True

    blocked_reader = _make_user(
        email="posts_blocked_reader@example.com", display_name="Blocked Reader"
    )
    blocked_reader.bot_shield_verified = True

    allowed_author = _make_user(
        email="posts_allowed_author@example.com", display_name="Allowed Author"
    )
    allowed_author.bot_shield_verified = True

    board = Board(
        id=uuid.uuid4(),
        name="Block Filter Board",
        slug="block-filter-board",
        description="",
    )
    post_blocked_by_me = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=blocked_by_reader.id,
        title="Post from user I blocked",
        body="Should be filtered out",
    )
    post_blocked_me = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=blocked_reader.id,
        title="Post from user who blocked me",
        body="Should also be filtered out",
    )
    post_allowed = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=allowed_author.id,
        title="Visible post",
        body="Should remain visible",
    )
    block_outbound = UserBlock(
        id=uuid.uuid4(),
        blocker_id=reader.id,
        blocked_id=blocked_by_reader.id,
    )
    block_inbound = UserBlock(
        id=uuid.uuid4(),
        blocker_id=blocked_reader.id,
        blocked_id=reader.id,
    )
    seed(
        reader,
        blocked_by_reader,
        blocked_reader,
        allowed_author,
        board,
        post_blocked_by_me,
        post_blocked_me,
        post_allowed,
        block_outbound,
        block_inbound,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(reader)
    try:
        resp = client.get("/api/v1/boards/block-filter-board/posts")
        assert resp.status_code == 200
        posts = resp.json()
        assert [p["title"] for p in posts] == ["Visible post"]
        assert [p["author_id"] for p in posts] == [str(allowed_author.id)]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_comments_excludes_blocked_authors_in_both_directions(
    client, db_session_factory
):
    """Comments from authors in blocked_by_user_subquery or blocked_user_subquery must be hidden."""
    reader = _make_user(
        email="comments_block_reader@example.com", display_name="Reader"
    )
    reader.bot_shield_verified = True

    post_author = _make_user(
        email="comments_block_post_author@example.com", display_name="Post Author"
    )
    post_author.bot_shield_verified = True

    blocked_by_reader = _make_user(
        email="comments_blocked_by_reader@example.com",
        display_name="Blocked By Reader",
    )
    blocked_by_reader.bot_shield_verified = True

    blocked_reader = _make_user(
        email="comments_blocked_reader@example.com", display_name="Blocked Reader"
    )
    blocked_reader.bot_shield_verified = True

    allowed_commenter = _make_user(
        email="comments_allowed_commenter@example.com",
        display_name="Allowed Commenter",
    )
    allowed_commenter.bot_shield_verified = True

    board = Board(
        id=uuid.uuid4(),
        name="Comment Block Board",
        slug="comment-block-board",
        description="",
    )
    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=post_author.id,
        title="Discussion post",
        body="Open thread",
    )
    comment_blocked_by_me = Comment(
        id=uuid.uuid4(),
        post_id=post.id,
        author_id=blocked_by_reader.id,
        body="Comment from user I blocked",
        created_at=datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
    )
    comment_blocked_me = Comment(
        id=uuid.uuid4(),
        post_id=post.id,
        author_id=blocked_reader.id,
        body="Comment from user who blocked me",
        created_at=datetime(2026, 1, 1, 11, 0, tzinfo=timezone.utc),
    )
    comment_allowed = Comment(
        id=uuid.uuid4(),
        post_id=post.id,
        author_id=allowed_commenter.id,
        body="Visible comment",
        created_at=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
    )
    block_outbound = UserBlock(
        id=uuid.uuid4(),
        blocker_id=reader.id,
        blocked_id=blocked_by_reader.id,
    )
    block_inbound = UserBlock(
        id=uuid.uuid4(),
        blocker_id=blocked_reader.id,
        blocked_id=reader.id,
    )
    seed(
        reader,
        post_author,
        blocked_by_reader,
        blocked_reader,
        allowed_commenter,
        board,
        post,
        comment_blocked_by_me,
        comment_blocked_me,
        comment_allowed,
        block_outbound,
        block_inbound,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = override_user(reader)
    try:
        resp = client.get(
            f"/api/v1/boards/comment-block-board/posts/{post.id}/comments"
        )
        assert resp.status_code == 200
        comments = resp.json()
        assert [c["body"] for c in comments] == ["Visible comment"]
        assert [c["author_id"] for c in comments] == [str(allowed_commenter.id)]
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
