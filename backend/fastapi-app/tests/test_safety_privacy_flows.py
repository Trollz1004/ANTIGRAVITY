"""Coverage for safety (block/report) and privacy (export/delete/location) flows."""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from app.auth import get_current_user
from app.main import app
from app.models import (
    DataPrivacyLog,
    Match,
    Profile,
    SupportTicket,
    User,
    UserBlock,
    UserReport,
)


def _make_user(name: str) -> User:
    return User(
        id=uuid.uuid4(),
        email=f"sp-{name}-{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed",
        display_name=name.title(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
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


# ── Safety ───────────────────────────────────────────────────────────────────


class TestBlocking:
    def test_block_lifecycle_closes_matches(self, client, db_session_factory):
        alice, bob = _make_user("alice"), _make_user("bob")
        match = Match(
            id=uuid.uuid4(),
            user_a=alice.id,
            user_b=bob.id,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        _seed(alice, bob, match, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            # Block bob → active match records are closed
            resp = client.post(
                f"/api/v1/safety/users/{bob.id}/block", json={"reason": "spam"}
            )
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["status"] == "blocked"
            assert data["blocked_user_id"] == str(bob.id)
            assert data["match_records_closed"] >= 1

            # Blocking again is a no-op and reports zero newly closed matches
            resp = client.post(
                f"/api/v1/safety/users/{bob.id}/block", json={"reason": "spam"}
            )
            assert resp.json()["match_records_closed"] == 0

            # The block shows up in the list with the target's display name
            listed = client.get("/api/v1/safety/blocks").json()
            assert len(listed) == 1
            assert listed[0]["blocked_user_id"] == str(bob.id)
            assert listed[0]["display_name"] == bob.display_name
            assert listed[0]["reason"] == "spam"

            # Unblock succeeds, then 404s when repeated
            resp = client.delete(f"/api/v1/safety/users/{bob.id}/block")
            assert resp.json()["status"] == "unblocked"
            resp = client.delete(f"/api/v1/safety/users/{bob.id}/block")
            assert resp.status_code == 404

            assert client.get("/api/v1/safety/blocks").json() == []
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_block_self_rejected(self, client, db_session_factory):
        alice = _make_user("selfy")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post(
                f"/api/v1/safety/users/{alice.id}/block", json={}
            )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_block_unknown_or_inactive_user_404(self, client, db_session_factory):
        alice = _make_user("blocker")
        ghost = uuid.uuid4()
        inactive = _make_user("inactive")
        _seed(alice, inactive, db_session_factory=db_session_factory)

        async def _deactivate():
            async with db_session_factory() as session:
                user = await session.get(User, inactive.id)
                user.is_active = False
                await session.commit()

        asyncio.run(_deactivate())

        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post(f"/api/v1/safety/users/{ghost}/block", json={})
            assert resp.status_code == 404
            resp = client.post(f"/api/v1/safety/users/{inactive.id}/block", json={})
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_list_blocks_skips_deleted_users(self, client, db_session_factory):
        alice, gone = _make_user("keeper"), _make_user("gone")
        _seed(alice, db_session_factory=db_session_factory)

        block = UserBlock(
            id=uuid.uuid4(),
            blocker_id=alice.id,
            blocked_id=gone.id,
            reason="old",
        )
        _seed(block, db_session_factory=db_session_factory)

        # Blocked user row is deleted → skipped in listing
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            assert client.get("/api/v1/safety/blocks").json() == []
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestReporting:
    def test_report_creates_ticket_and_report(self, client, db_session_factory):
        alice, bob = _make_user("reporter"), _make_user("reported")
        _seed(alice, bob, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            with patch(
                "app.routers.safety.notify_support_ticket", new=AsyncMock()
            ) as notify:
                resp = client.post(
                    f"/api/v1/safety/users/{bob.id}/report",
                    json={
                        "reason": "harassment",
                        "details": "Sent threats in chat",
                        "source": "chat",
                    },
                )
            assert resp.status_code == 201, resp.text
            data = resp.json()
            assert data["status"] == "reported"
            assert data["reported_user_id"] == str(bob.id)
            notify.assert_awaited_once()

            async def _rows():
                from sqlalchemy import select

                async with db_session_factory() as session:
                    reports = list((await session.scalars(select(UserReport))).all())
                    tickets = list((await session.scalars(select(SupportTicket))).all())
                    return reports, tickets

            reports, tickets = asyncio.run(_rows())
            assert len(reports) == 1
            assert reports[0].reason == "harassment"
            assert reports[0].source == "chat"
            assert len(tickets) == 1
            assert tickets[0].category == "safety"
            assert "Reported user" in tickets[0].transcript[1]["content"]
            assert reports[0].support_ticket_id == tickets[0].id
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_report_self_rejected(self, client, db_session_factory):
        alice = _make_user("selfreport")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post(
                f"/api/v1/safety/users/{alice.id}/report",
                json={"reason": "test"},
            )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── Privacy ──────────────────────────────────────────────────────────────────


class TestPrivacyActions:
    def test_export_request_created_and_idempotent(self, client, db_session_factory):
        alice = _make_user("exporter")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post("/api/v1/privacy/export")
            assert resp.status_code == 202, resp.text
            first = resp.json()
            assert first["status"] == "pending"
            assert first["action"] == "export_requested"
            assert first["scheduled_for"] is None

            # Second request returns the same pending record
            resp = client.post("/api/v1/privacy/export")
            assert resp.status_code == 202
            assert resp.json()["request_id"] == first["request_id"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_delete_request_scheduled_30_days_out(self, client, db_session_factory):
        alice = _make_user("deleter")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            before = datetime.now(timezone.utc)
            resp = client.post("/api/v1/privacy/delete")
            assert resp.status_code == 202, resp.text
            data = resp.json()
            assert data["action"] == "delete_requested"
            scheduled = datetime.fromisoformat(data["scheduled_for"])
            if scheduled.tzinfo is None:
                scheduled = scheduled.replace(tzinfo=timezone.utc)
            assert scheduled > before + timedelta(days=29)

            # Idempotent
            resp = client.post("/api/v1/privacy/delete")
            assert resp.json()["request_id"] == data["request_id"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_location_disable_updates_profile(self, client, db_session_factory):
        alice = _make_user("locator")
        profile = Profile(
            id=uuid.uuid4(),
            user_id=alice.id,
            location_enabled=True,
        )
        _seed(alice, profile, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post("/api/v1/privacy/location/disable")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["action"] == "location_disabled"
            assert data["status"] == "completed"

            async def _check():
                async with db_session_factory() as session:
                    refreshed = await session.get(Profile, profile.id)
                    logs = list(
                        (
                            await session.scalars(
                                __import__("sqlalchemy").select(DataPrivacyLog)
                            )
                        ).all()
                    )
                    return refreshed.location_enabled, logs

            enabled, logs = asyncio.run(_check())
            assert enabled is False
            assert any(log.action == "location_disabled" for log in logs)
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_location_disable_without_profile_404(self, client, db_session_factory):
        alice = _make_user("profileless")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post("/api/v1/privacy/location/disable")
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestMyData:
    def test_my_data_full_summary(self, client, db_session_factory):
        alice, bob = _make_user("data"), _make_user("partner")
        profile = Profile(
            id=uuid.uuid4(),
            user_id=alice.id,
            bio="Bio",
            age=31,
            gender="nonbinary",
            looking_for="friends",
            location="Orlando",
            interests=["climbing"],
            verified=True,
            location_enabled=True,
            photos=["p1.jpg", "p2.jpg"],
        )
        match = Match(
            id=uuid.uuid4(),
            user_a=alice.id,
            user_b=bob.id,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        from app.models import Message

        message = Message(
            id=uuid.uuid4(),
            match_id=match.id,
            sender_id=alice.id,
            content="hi",
            created_at=datetime.now(timezone.utc),
        )
        pending = DataPrivacyLog(
            id=uuid.uuid4(),
            user_id=alice.id,
            action="export_requested",
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        _seed(alice, bob, profile, match, message, pending, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.get("/api/v1/privacy/my-data")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["user_id"] == str(alice.id)
            assert data["match_count"] == 1
            assert data["message_count"] == 1
            assert data["photos_count"] == 2
            assert data["profile"]["bio"] == "Bio"
            assert data["profile"]["location_enabled"] is True
            assert any(
                log["action"] == "export_requested"
                for log in data["pending_requests"]
            )
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_my_data_without_profile(self, client, db_session_factory):
        alice = _make_user("naked")
        _seed(alice, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.get("/api/v1/privacy/my-data")
            assert resp.status_code == 200
            data = resp.json()
            assert data["profile"] is None
            assert data["match_count"] == 0
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ── Swipe router gap-fills ───────────────────────────────────────────────────


class TestSwipeGaps:
    def test_swipe_self_or_blocked_target(self, client, db_session_factory):
        from app.models import UserBlock as UB

        alice, bob = _make_user("swiper"), _make_user("target")
        block = UB(id=uuid.uuid4(), blocker_id=bob.id, blocked_id=alice.id)
        _seed(alice, bob, block, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.post(
                "/api/v1/swipe/",
                json={"target_id": str(alice.id), "direction": "like"},
            )
            assert resp.status_code == 400

            resp = client.post(
                "/api/v1/swipe/",
                json={"target_id": str(bob.id), "direction": "like"},
            )
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_get_match_blocked_or_missing_other(self, client, db_session_factory):
        from app.models import UserBlock as UB

        alice, bob = _make_user("ma"), _make_user("mb")
        match = Match(
            id=uuid.uuid4(),
            user_a=alice.id,
            user_b=bob.id,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        _seed(alice, bob, match, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            # Baseline fetch works
            resp = client.get(f"/api/v1/matches/{match.id}")
            assert resp.status_code == 200
            assert resp.json()["display_name"] == bob.display_name

            # Non-existent match id → 404
            resp = client.get(f"/api/v1/matches/{uuid.uuid4()}")
            assert resp.status_code == 404

            # Once blocked, the match is hidden as 404
            block = UB(id=uuid.uuid4(), blocker_id=bob.id, blocked_id=alice.id)
            _seed(block, db_session_factory=db_session_factory)
            resp = client.get(f"/api/v1/matches/{match.id}")
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_matches_list_skips_blocked_and_missing(self, client, db_session_factory):
        from app.models import UserBlock as UB

        alice, bob, ghost = _make_user("la"), _make_user("lb"), uuid.uuid4()
        match_ok = Match(
            id=uuid.uuid4(),
            user_a=alice.id,
            user_b=bob.id,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        match_blocked = Match(
            id=uuid.uuid4(),
            user_a=alice.id,
            user_b=ghost,
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        block = UB(id=uuid.uuid4(), blocker_id=alice.id, blocked_id=ghost)
        _seed(alice, bob, match_ok, match_blocked, block, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(alice)
        try:
            resp = client.get("/api/v1/matches")
            assert resp.status_code == 200
            matches = resp.json()
            assert len(matches) == 1
            assert matches[0]["user_id"] == str(bob.id)
        finally:
            app.dependency_overrides.pop(get_current_user, None)
