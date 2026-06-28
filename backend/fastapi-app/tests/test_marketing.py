import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.auth import create_access_token
from app.models import TrackedMarketingLink, User


def _auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(user_id))}"}


def test_referral_kit_creates_tracked_links_and_tracks_clicks(
    client, db_session_factory
):
    async def seed_user() -> uuid.UUID:
        user_id = uuid.uuid4()
        async with db_session_factory() as session:
            session.add(
                User(
                    id=user_id,
                    email="marketing@youandinotai-test.com",
                    password_hash="hashed",
                    display_name="Marketing User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await session.commit()
        return user_id

    user_id = asyncio.run(seed_user())

    response = client.post(
        "/api/v1/marketing/referral-kit",
        headers=_auth_headers(user_id),
        json={
            "campaign_name": "SpringPartnerPush",
            "referral_code": "partner-42",
            "source": "affiliate",
            "medium": "referral",
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["campaign_name"] == "SpringPartnerPush"
    assert len(payload["links"]) == 5

    first_link = payload["links"][0]
    tracked_response = client.get(
        f"/api/v1/marketing/tracked-links/{first_link['slug']}",
        follow_redirects=False,
    )

    assert tracked_response.status_code == 307, tracked_response.text
    assert "utm_source=affiliate" in tracked_response.headers["location"]
    assert "utm_medium=referral" in tracked_response.headers["location"]
    assert "utm_campaign=SpringPartnerPush" in tracked_response.headers["location"]
    assert "ref=partner-42" in tracked_response.headers["location"]

    async def fetch_link() -> TrackedMarketingLink | None:
        async with db_session_factory() as session:
            return await session.scalar(
                select(TrackedMarketingLink).where(
                    TrackedMarketingLink.slug == first_link["slug"]
                )
            )

    tracked_link = asyncio.run(fetch_link())
    assert tracked_link is not None
    assert tracked_link.click_count == 1
    assert tracked_link.last_clicked_at is not None
