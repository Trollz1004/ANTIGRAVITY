import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import DataPrivacyLog, Match, Message, Profile, User


def test_my_data_summary_and_delete_request(client, db_session_factory):
    primary_user = User(
        id=uuid.uuid4(),
        email="privacy@example.com",
        password_hash="hashed",
        display_name="Privacy User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    match_user = User(
        id=uuid.uuid4(),
        email="match@example.com",
        password_hash="hashed",
        display_name="Match User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    match_id = uuid.uuid4()

    async def seed_data():
        async with db_session_factory() as session:
            session.add_all(
                [
                    primary_user,
                    match_user,
                    Profile(
                        id=uuid.uuid4(),
                        user_id=primary_user.id,
                        bio="Privacy first",
                        interests=["volunteering", "meetups"],
                        photos=["/photos/1.jpg", "/photos/2.jpg"],
                        location_enabled=True,
                    ),
                    Match(
                        id=match_id,
                        user_a=primary_user.id,
                        user_b=match_user.id,
                        status="active",
                    ),
                    Message(
                        id=uuid.uuid4(),
                        match_id=match_id,
                        sender_id=primary_user.id,
                        content="hello there",
                    ),
                ]
            )
            await session.commit()

    asyncio.run(seed_data())

    async def override_current_user():
        return primary_user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/api/v1/privacy/my-data")
        assert response.status_code == 200
        payload = response.json()
        assert payload["email"] == primary_user.email
        assert payload["message_count"] == 1
        assert payload["match_count"] == 1
        assert payload["photos_count"] == 2
        assert payload["pending_requests"] == []

        delete_response = client.post("/api/v1/privacy/delete")
        assert delete_response.status_code == 202
        delete_payload = delete_response.json()
        assert delete_payload["action"] == "delete_requested"
        assert delete_payload["scheduled_for"] is not None

        refreshed = client.get("/api/v1/privacy/my-data")
        pending_requests = refreshed.json()["pending_requests"]
        assert len(pending_requests) == 1
        assert pending_requests[0]["action"] == "delete_requested"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
