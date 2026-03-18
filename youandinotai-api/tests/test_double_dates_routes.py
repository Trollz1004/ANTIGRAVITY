import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import Match, Profile, User


def test_propose_and_accept_double_date(client, db_session_factory):
    couple_a_user_1 = User(
        id=uuid.uuid4(),
        email="a1@example.com",
        password_hash="hashed",
        display_name="Alex",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    couple_a_user_2 = User(
        id=uuid.uuid4(),
        email="a2@example.com",
        password_hash="hashed",
        display_name="Jordan",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    couple_b_user_1 = User(
        id=uuid.uuid4(),
        email="b1@example.com",
        password_hash="hashed",
        display_name="Taylor",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    couple_b_user_2 = User(
        id=uuid.uuid4(),
        email="b2@example.com",
        password_hash="hashed",
        display_name="Morgan",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    match_a = Match(id=uuid.uuid4(), user_a=couple_a_user_1.id, user_b=couple_a_user_2.id, status="active")
    match_b = Match(id=uuid.uuid4(), user_a=couple_b_user_1.id, user_b=couple_b_user_2.id, status="active")

    async def seed_data():
        async with db_session_factory() as session:
            session.add_all(
                [
                    couple_a_user_1,
                    couple_a_user_2,
                    couple_b_user_1,
                    couple_b_user_2,
                    match_a,
                    match_b,
                    Profile(id=uuid.uuid4(), user_id=couple_a_user_1.id, photos=["/alex.jpg"]),
                    Profile(id=uuid.uuid4(), user_id=couple_a_user_2.id, photos=["/jordan.jpg"]),
                    Profile(id=uuid.uuid4(), user_id=couple_b_user_1.id, photos=["/taylor.jpg"]),
                    Profile(id=uuid.uuid4(), user_id=couple_b_user_2.id, photos=["/morgan.jpg"]),
                ]
            )
            await session.commit()

    asyncio.run(seed_data())

    async def override_initiator():
        return couple_a_user_1

    app.dependency_overrides[get_current_user] = override_initiator
    try:
        proposal_response = client.post(
            "/api/v1/double-dates/propose",
            json={"match_a_id": str(match_a.id), "match_b_id": str(match_b.id)},
        )
        assert proposal_response.status_code == 201
        proposal_payload = proposal_response.json()
        assert proposal_payload["status"] == "pending"
        assert proposal_payload["accepted_match_ids"] == [str(match_a.id)]
        assert proposal_payload["couple_a"]["members"][0]["display_name"] == "Alex"
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    session_id = proposal_payload["id"]

    async def override_second_couple():
        return couple_b_user_1

    app.dependency_overrides[get_current_user] = override_second_couple
    try:
        accept_response = client.post(f"/api/v1/double-dates/{session_id}/accept")
        assert accept_response.status_code == 200
        accept_payload = accept_response.json()
        assert accept_payload["status"] == "active"
        assert set(accept_payload["accepted_match_ids"]) == {str(match_a.id), str(match_b.id)}
    finally:
        app.dependency_overrides.pop(get_current_user, None)
