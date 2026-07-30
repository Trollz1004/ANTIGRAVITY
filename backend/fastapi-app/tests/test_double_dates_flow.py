"""Full lifecycle tests for double-date proposals, acceptances, declines, and
squad recommendations."""

import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from app.auth import get_current_user
from app.main import app
from app.models import (
    DoubleDateAcceptance,
    DoubleDateSession,
    Match,
    Profile,
    User,
)


def _make_user(name: str) -> User:
    return User(
        id=uuid.uuid4(),
        email=f"dd-{name}-{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed",
        display_name=name.title(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_match(a: User, b: User, *, status: str = "active") -> Match:
    return Match(
        id=uuid.uuid4(),
        user_a=a.id,
        user_b=b.id,
        status=status,
        compatibility_score=0.8,
        matched_at=datetime.now(timezone.utc),
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


@pytest.fixture()
def couples(db_session_factory):
    """Two active couples: (alice+anna) and (bob+bruno)."""
    alice, anna, bob, bruno = (
        _make_user("alice"),
        _make_user("anna"),
        _make_user("bob"),
        _make_user("bruno"),
    )
    match_a = _make_match(alice, anna)
    match_b = _make_match(bob, bruno)
    _seed(alice, anna, bob, bruno, match_a, match_b, db_session_factory=db_session_factory)
    return {
        "alice": alice,
        "anna": anna,
        "bob": bob,
        "bruno": bruno,
        "match_a": match_a,
        "match_b": match_b,
    }


class TestPropose:
    def test_propose_success_records_initiator_acceptance(
        self, client, db_session_factory, couples
    ):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            )
            assert resp.status_code == 201, resp.text
            data = resp.json()
            assert data["status"] == "pending"
            assert data["accepted_match_ids"] == [str(couples["match_a"].id)]
            assert data["couple_a"]["members"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_propose_same_match_ids_400(self, client, couples):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_a"].id),
                },
            )
            assert resp.status_code == 400
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_propose_unknown_match_404(self, client, couples):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(uuid.uuid4()),
                },
            )
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_propose_inactive_match_404(self, client, db_session_factory, couples):
        other = _make_match(_make_user("x1"), _make_user("x2"), status="ended")
        _seed(
            other.user_a and other,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(other.id),
                },
            )
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_propose_as_outsider_403(self, client, db_session_factory):
        alice, anna, bob, bruno, eve = (
            _make_user("a1"),
            _make_user("a2"),
            _make_user("b1"),
            _make_user("b2"),
            _make_user("eve"),
        )
        match_a = _make_match(alice, anna)
        match_b = _make_match(bob, bruno)
        _seed(
            alice, anna, bob, bruno, eve, match_a, match_b,
            db_session_factory=db_session_factory,
        )
        app.dependency_overrides[get_current_user] = _override_user(eve)
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={"match_a_id": str(match_a.id), "match_b_id": str(match_b.id)},
            )
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_propose_conflict_409_both_directions(
        self, client, db_session_factory, couples
    ):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            first = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            )
            assert first.status_code == 201

            # Same ordering → 409
            again = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            )
            assert again.status_code == 409

            # Reversed ordering → still a 409
            reversed_resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_b"].id),
                    "match_b_id": str(couples["match_a"].id),
                },
            )
            assert reversed_resp.status_code == 409
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestList:
    def test_list_empty_and_populated(self, client, db_session_factory, couples):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            assert client.get("/api/v1/double-dates").json() == []

            client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            )
            listed = client.get("/api/v1/double-dates").json()
            assert len(listed) == 1
            assert listed[0]["status"] == "pending"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_list_for_user_without_matches(self, client, db_session_factory):
        lonely = _make_user("lonely")
        _seed(lonely, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(lonely)
        try:
            resp = client.get("/api/v1/double-dates")
            assert resp.status_code == 200
            assert resp.json() == []
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestAccept:
    def _propose(self, client, couples) -> str:
        resp = client.post(
            "/api/v1/double-dates/propose",
            json={
                "match_a_id": str(couples["match_a"].id),
                "match_b_id": str(couples["match_b"].id),
            },
        )
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_full_acceptance_activates_session(
        self, client, db_session_factory, couples
    ):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        session_id = self._propose(client, couples)
        app.dependency_overrides.pop(get_current_user, None)

        # Bob (couple B) accepts
        app.dependency_overrides[get_current_user] = _override_user(couples["bob"])
        try:
            resp = client.post(f"/api/v1/double-dates/{session_id}/accept")
            assert resp.status_code == 200, resp.text
            data = resp.json()
            assert data["status"] == "active"
            assert set(data["accepted_match_ids"]) == {
                str(couples["match_a"].id),
                str(couples["match_b"].id),
            }

            # Accepting again updates the existing acceptance row (idempotent)
            resp = client.post(f"/api/v1/double-dates/{session_id}/accept")
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_accept_unknown_session_404(self, client, db_session_factory):
        user = _make_user("u1")
        _seed(user, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.post(f"/api/v1/double-dates/{uuid.uuid4()}/accept")
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_accept_declined_session_409(self, client, db_session_factory, couples):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        session_id = self._propose(client, couples)
        client.post(f"/api/v1/double-dates/{session_id}/decline")
        resp = client.post(f"/api/v1/double-dates/{session_id}/accept")
        assert resp.status_code == 409
        app.dependency_overrides.pop(get_current_user, None)

    def test_accept_as_outsider_403(self, client, db_session_factory, couples):
        eve = _make_user("eve2")
        _seed(eve, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        session_id = self._propose(client, couples)
        app.dependency_overrides.pop(get_current_user, None)

        app.dependency_overrides[get_current_user] = _override_user(eve)
        try:
            resp = client.post(f"/api/v1/double-dates/{session_id}/accept")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestDecline:
    def test_decline_marks_session_declined(self, client, db_session_factory, couples):
        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            resp = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            )
            session_id = resp.json()["id"]

            # The other couple declines with no prior acceptance row
            app.dependency_overrides[get_current_user] = _override_user(couples["bob"])
            resp = client.post(f"/api/v1/double-dates/{session_id}/decline")
            assert resp.status_code == 200
            assert resp.json()["status"] == "declined"
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_decline_unknown_and_outsider(self, client, db_session_factory, couples):
        eve = _make_user("eve3")
        _seed(eve, db_session_factory=db_session_factory)
        app.dependency_overrides[get_current_user] = _override_user(eve)
        try:
            resp = client.post(f"/api/v1/double-dates/{uuid.uuid4()}/decline")
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        app.dependency_overrides[get_current_user] = _override_user(couples["alice"])
        try:
            session_id = client.post(
                "/api/v1/double-dates/propose",
                json={
                    "match_a_id": str(couples["match_a"].id),
                    "match_b_id": str(couples["match_b"].id),
                },
            ).json()["id"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        app.dependency_overrides[get_current_user] = _override_user(eve)
        try:
            resp = client.post(f"/api/v1/double-dates/{session_id}/decline")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestSquadRecommendations:
    def test_recommendations_include_profile_details(
        self, client, db_session_factory
    ):
        me, partner = _make_user("me"), _make_user("partner")
        match = _make_match(me, partner)
        profile = Profile(
            id=uuid.uuid4(),
            user_id=partner.id,
            bio="Loves hiking",
            photos=["https://cdn.example.com/photo1.jpg"],
            interests=["hiking"],
        )
        _seed(me, partner, match, profile, db_session_factory=db_session_factory)

        app.dependency_overrides[get_current_user] = _override_user(me)
        try:
            resp = client.get("/api/v1/double-dates/squad-recommendations")
            assert resp.status_code == 200, resp.text
            recs = resp.json()
            assert len(recs) == 1
            assert recs[0]["display_name"] == partner.display_name
            assert recs[0]["photo_url"] == "https://cdn.example.com/photo1.jpg"
            assert recs[0]["match_id"] == str(match.id)
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_recommendations_skip_missing_users_and_no_matches(
        self, client, db_session_factory
    ):
        me = _make_user("solo")
        stale_match = Match(
            id=uuid.uuid4(),
            user_a=me.id,
            user_b=uuid.uuid4(),  # partner no longer exists
            status="active",
            matched_at=datetime.now(timezone.utc),
        )
        _seed(me, stale_match, db_session_factory=db_session_factory)

        app.dependency_overrides[get_current_user] = _override_user(me)
        try:
            resp = client.get("/api/v1/double-dates/squad-recommendations")
            assert resp.status_code == 200
            assert resp.json() == []
        finally:
            app.dependency_overrides.pop(get_current_user, None)
