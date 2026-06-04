"""Tests for safety block/report routes and their downstream enforcement."""

import asyncio
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

from sqlalchemy import select

from app.auth import get_current_user
from app.main import app
from app.models import (
    Board,
    Match,
    Post,
    Profile,
    SupportTicket,
    User,
    UserBlock,
    UserReport,
)


def _make_user(*, email: str, display_name: str = "Safety User") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_profile(user: User, *, bio: str = "Ready to meet") -> Profile:
    return Profile(
        id=uuid.uuid4(),
        user_id=user.id,
        bio=bio,
        age=30,
        interests=["Music"],
        photos=[],
        verified=True,
    )


def _make_match(user_a: User, user_b: User, *, status: str = "active") -> Match:
    return Match(
        id=uuid.uuid4(),
        user_a=user_a.id,
        user_b=user_b.id,
        status=status,
    )


def _seed(*items, db_session_factory) -> None:
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _override_user(user: User):
    async def _dep():
        return user

    return _dep


def test_block_user_closes_match_and_hides_it_from_matches(client, db_session_factory):
    actor = _make_user(email="safety_actor@example.com", display_name="Actor")
    target = _make_user(email="safety_target@example.com", display_name="Target")
    match = _make_match(actor, target)
    _seed(actor, target, match, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = _override_user(actor)
    try:
        response = client.post(
            f"/api/v1/safety/users/{target.id}/block",
            json={"reason": "Unsafe conversation"},
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["status"] == "blocked"
        assert payload["blocked_user_id"] == str(target.id)
        assert payload["match_records_closed"] == 1

        matches_response = client.get("/api/v1/matches")
        assert matches_response.status_code == 200
        assert matches_response.json() == []

        async def fetch_state():
            async with db_session_factory() as session:
                block = await session.scalar(select(UserBlock))
                stored_match = await session.get(Match, match.id)
                return block, stored_match

        block, stored_match = asyncio.run(fetch_state())
        assert block is not None
        assert stored_match.status == "blocked"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_discover_excludes_blocked_users(client, db_session_factory):
    actor = _make_user(email="discover_actor_block@example.com", display_name="Actor")
    blocked_target = _make_user(
        email="blocked_target@example.com", display_name="Blocked Target"
    )
    visible_target = _make_user(
        email="visible_target@example.com", display_name="Visible Target"
    )
    actor_profile = _make_profile(actor)
    blocked_profile = _make_profile(blocked_target)
    visible_profile = _make_profile(visible_target)
    block = UserBlock(
        id=uuid.uuid4(),
        blocker_id=actor.id,
        blocked_id=blocked_target.id,
        reason="No contact",
    )
    _seed(
        actor,
        blocked_target,
        visible_target,
        actor_profile,
        blocked_profile,
        visible_profile,
        block,
        db_session_factory=db_session_factory,
    )

    app.dependency_overrides[get_current_user] = _override_user(actor)
    try:
        response = client.get("/api/v1/discover")
        assert response.status_code == 200, response.text
        user_ids = {item["user_id"] for item in response.json()}
        assert str(blocked_target.id) not in user_ids
        assert str(visible_target.id) in user_ids
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_blocked_match_rejects_message_access(client, db_session_factory):
    actor = _make_user(email="message_block_actor@example.com", display_name="Actor")
    target = _make_user(email="message_block_target@example.com", display_name="Target")
    match = _make_match(actor, target)
    block = UserBlock(
        id=uuid.uuid4(),
        blocker_id=actor.id,
        blocked_id=target.id,
        reason="Stop contact",
    )
    _seed(actor, target, match, block, db_session_factory=db_session_factory)

    app.dependency_overrides[get_current_user] = _override_user(actor)
    try:
        get_response = client.get(f"/api/v1/messages/{match.id}")
        assert get_response.status_code == 403
        assert "safety settings" in get_response.json()["detail"].lower()

        post_response = client.post(
            f"/api/v1/messages/{match.id}",
            json={"content": "Hello?"},
        )
        assert post_response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_report_user_creates_report_and_support_ticket(
    client, db_session_factory, monkeypatch
):
    from app.routers import safety as safety_router

    reporter = _make_user(email="reporter@example.com", display_name="Reporter")
    target = _make_user(email="report_target@example.com", display_name="Reported User")
    _seed(reporter, target, db_session_factory=db_session_factory)

    notify_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(safety_router, "notify_support_ticket", notify_mock)

    app.dependency_overrides[get_current_user] = _override_user(reporter)
    try:
        response = client.post(
            f"/api/v1/safety/users/{target.id}/report",
            json={
                "reason": "harassment",
                "details": "Threatening messages in chat",
                "source": "chat",
            },
        )
        assert response.status_code == 201, response.text
        payload = response.json()
        assert payload["status"] == "reported"
        assert payload["reported_user_id"] == str(target.id)
        assert payload["ticket_id"] is not None

        async def fetch_state():
            async with db_session_factory() as session:
                reports = (await session.scalars(select(UserReport))).all()
                tickets = (await session.scalars(select(SupportTicket))).all()
                return reports, tickets

        reports, tickets = asyncio.run(fetch_state())
        assert len(reports) == 1
        assert reports[0].reason == "harassment"
        assert len(tickets) == 1
        assert tickets[0].category == "safety"
        notify_mock.assert_awaited_once()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_report_board_post_creates_support_ticket(
    client, db_session_factory, monkeypatch
):
    from app.routers import boards as boards_router

    reporter = _make_user(email="board_reporter@example.com", display_name="Reporter")
    author = _make_user(email="board_author@example.com", display_name="Board Author")
    board = Board(
        id=uuid.uuid4(), name="General", description="General board", slug="general"
    )
    post = Post(
        id=uuid.uuid4(),
        board_id=board.id,
        author_id=author.id,
        title="Unsafe post",
        body="Bad content",
    )
    _seed(reporter, author, board, post, db_session_factory=db_session_factory)

    notify_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(boards_router, "notify_support_ticket", notify_mock)

    app.dependency_overrides[get_current_user] = _override_user(reporter)
    try:
        response = client.post(
            f"/api/v1/boards/posts/{post.id}/report",
            json={
                "reason": "Unsafe content",
                "details": "Reviewer saw harassment in the board lane",
            },
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["status"] == "reported"
        assert payload["post_id"] == str(post.id)

        async def fetch_state():
            async with db_session_factory() as session:
                return (await session.scalars(select(SupportTicket))).all()

        tickets = asyncio.run(fetch_state())
        assert len(tickets) == 1
        assert tickets[0].category == "safety"
        assert "board post report" in tickets[0].subject.lower()
        notify_mock.assert_awaited_once()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
