"""Tests for the marketing content API — real database persistence, no mocks.

Endpoints covered:
- POST   /api/v1/marketing/content
- GET    /api/v1/marketing/content
- GET    /api/v1/marketing/content/{content_id}
- PUT    /api/v1/marketing/content/{content_id}
- PATCH  /api/v1/marketing/content/{content_id}
- POST   /api/v1/marketing/content/{content_id}/publish
- DELETE /api/v1/marketing/content/{content_id}

Every test seeds/reads a real SQLite database session — the API must never
fabricate content rows.
"""

import asyncio
import uuid
from datetime import datetime, timezone

from app.auth import get_current_user
from app.main import app
from app.models import User
from tests.helpers import override_user, seed


def _make_user(*, email: str = "marketing@example.com") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name="Marketing User",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _valid_payload(**overrides):
    payload = {
        "campaign_name": "SpringMemberLaunch",
        "objective": "Invite verified members to try local event planning",
        "audience": "Singles who prefer real-world plans",
        "platforms": ["instagram"],
        "core_message": "Meet verified members who want to make real plans offline.",
        "post_type": "story",
        "primary_caption": "Skip the bot noise. #YouAndINotAI #BotShield",
        "call_to_action": "Sign up now",
        "hashtag_block": [
            "#YouAndINotAI",
            "#BotShield",
            "#DateWithPurpose",
        ],
    }
    payload.update(overrides)
    return payload


# ── Auth boundary ────────────────────────────────────────────────────────────


def test_marketing_content_requires_auth(client):
    resp = client.post("/api/v1/marketing/content", json=_valid_payload())
    assert resp.status_code in (401, 403)


def test_marketing_list_requires_auth(client):
    resp = client.get("/api/v1/marketing/content")
    assert resp.status_code in (401, 403)


# ── POST /content ────────────────────────────────────────────────────────────


def test_create_content_persists_to_database(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post("/api/v1/marketing/content", json=_valid_payload())
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["campaign_name"] == "SpringMemberLaunch"
        assert data["title"] == "SpringMemberLaunch"
        assert data["content"] == _valid_payload()["primary_caption"]
        assert data["tags"] == _valid_payload()["hashtag_block"]
        assert data["published"] is False
        assert data["objective"] == _valid_payload()["objective"]
        assert data["audience"] == _valid_payload()["audience"]
        assert data["platforms"] == ["instagram"]
        assert data["core_message"] == _valid_payload()["core_message"]
        assert data["post_type"] == "story"
        assert data["call_to_action"] == "Sign up now"
        assert "id" in data and uuid.UUID(data["id"])
        assert "created_at" in data
        assert "updated_at" in data

        # The record must exist in the database — not just in the response.
        from app.models import MarketingContent

        async def _count():
            async with db_session_factory() as session:
                from sqlalchemy import func, select

                return await session.scalar(
                    select(func.count()).select_from(MarketingContent)
                )

        assert asyncio.run(_count()) == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_content_requires_branded_hashtag(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(
            "/api/v1/marketing/content",
            json=_valid_payload(hashtag_block=["#SomeOtherTag"]),
        )
        assert resp.status_code == 400
        assert "branded hashtag" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_content_rejects_too_many_hashtags_for_x(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post(
            "/api/v1/marketing/content",
            json=_valid_payload(
                platforms=["x"],
                hashtag_block=["#YouAndINotAI", "#BotShield", "#DateWithPurpose"],
            ),
        )
        assert resp.status_code == 400
        assert "maximum 2 hashtags" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_content_rejects_out_of_range_hashtags(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        # Instagram requires 3-7 hashtags
        resp = client.post(
            "/api/v1/marketing/content",
            json=_valid_payload(
                platforms=["instagram"], hashtag_block=["#YouAndINotAI"]
            ),
        )
        assert resp.status_code == 400
        assert "requires 3-7 hashtags" in resp.json()["detail"]

        # Unknown platforms are not limit-checked
        resp = client.post(
            "/api/v1/marketing/content",
            json=_valid_payload(platforms=["myspace"], hashtag_block=["#YouAndINotAI"]),
        )
        assert resp.status_code == 201, resp.text
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_create_content_missing_required_fields_returns_422(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.post("/api/v1/marketing/content", json={"campaign_name": "X"})
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /content (list) ──────────────────────────────────────────────────────


def test_list_content_returns_persisted_items(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        assert client.get("/api/v1/marketing/content").json() == []

        for index in range(3):
            client.post(
                "/api/v1/marketing/content",
                json=_valid_payload(campaign_name=f"Campaign{index}"),
            )

        resp = client.get("/api/v1/marketing/content")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 3
        names = {item["campaign_name"] for item in items}
        assert names == {"Campaign0", "Campaign1", "Campaign2"}

        # Pagination
        resp = client.get("/api/v1/marketing/content?limit=2&offset=2")
        assert len(resp.json()) == 1

        # Invalid pagination params
        assert client.get("/api/v1/marketing/content?limit=0").status_code == 422
        assert client.get("/api/v1/marketing/content?offset=-1").status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_list_content_filters_by_published_state(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        first = client.post("/api/v1/marketing/content", json=_valid_payload()).json()
        client.post(
            "/api/v1/marketing/content",
            json=_valid_payload(campaign_name="Second"),
        )
        client.post(f"/api/v1/marketing/content/{first['id']}/publish")

        published = client.get("/api/v1/marketing/content?published=true").json()
        assert len(published) == 1
        assert published[0]["id"] == first["id"]
        assert published[0]["published"] is True

        drafts = client.get("/api/v1/marketing/content?published=false").json()
        assert len(drafts) == 1
        assert drafts[0]["campaign_name"] == "Second"
        assert drafts[0]["published"] is False
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── GET /content/{id} ────────────────────────────────────────────────────────


def test_get_content_returns_stored_record(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        resp = client.get(f"/api/v1/marketing/content/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == content_id
        assert resp.json()["campaign_name"] == "SpringMemberLaunch"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_content_unknown_id_returns_404(client, db_session_factory):
    """No fabricated payloads — unknown IDs are 404."""
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.get(f"/api/v1/marketing/content/{uuid.uuid4()}")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Marketing content not found"

        resp = client.get("/api/v1/marketing/content/not-a-uuid")
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── PUT /content/{id} ────────────────────────────────────────────────────────


def test_put_content_full_replace_updates_database(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        replacement = _valid_payload(
            campaign_name="ReplacedCampaign",
            primary_caption="New caption #YouAndINotAI",
            hashtag_block=["#YouAndINotAI", "#VerifiedMembers", "#BotShield"],
        )
        resp = client.put(f"/api/v1/marketing/content/{content_id}", json=replacement)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["id"] == content_id
        assert data["campaign_name"] == "ReplacedCampaign"
        assert data["title"] == "ReplacedCampaign"
        assert data["content"] == "New caption #YouAndINotAI"
        assert data["tags"] == ["#YouAndINotAI", "#VerifiedMembers", "#BotShield"]
        # PUT does not publish by itself
        assert data["published"] is False

        # Verify persisted state
        fetched = client.get(f"/api/v1/marketing/content/{content_id}").json()
        assert fetched["campaign_name"] == "ReplacedCampaign"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_put_content_validates_hashtags_and_unknown_id(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        # Missing branded hashtag -> 400
        resp = client.put(
            f"/api/v1/marketing/content/{uuid.uuid4()}",
            json=_valid_payload(hashtag_block=["#Nope"]),
        )
        assert resp.status_code == 400

        # Valid payload but unknown id -> 404
        resp = client.put(
            f"/api/v1/marketing/content/{uuid.uuid4()}", json=_valid_payload()
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── PATCH /content/{id} ──────────────────────────────────────────────────────


def test_patch_content_partial_update(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        resp = client.patch(
            f"/api/v1/marketing/content/{content_id}",
            json={"campaign_name": "PatchedName"},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["campaign_name"] == "PatchedName"
        # Untouched fields keep persisted values
        assert data["primary_caption"] == _valid_payload()["primary_caption"]
        assert data["objective"] == _valid_payload()["objective"]
        assert data["published"] is False
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_content_can_update_all_fields(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        patch_payload = {
            "campaign_name": "Everything",
            "objective": "New objective",
            "audience": "New audience",
            "platforms": ["x"],
            "core_message": "New core message",
            "post_type": "announcement",
            "primary_caption": "New caption",
            "call_to_action": "Join now",
            "hashtag_block": ["#YouAndINotAI"],
            "published": True,
        }
        resp = client.patch(
            f"/api/v1/marketing/content/{content_id}", json=patch_payload
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        for key, value in patch_payload.items():
            assert data[key] == value
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_content_rejects_unbranded_hashtags(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        resp = client.patch(
            f"/api/v1/marketing/content/{content_id}",
            json={"hashtag_block": ["#NotBranded"]},
        )
        assert resp.status_code == 400
        assert "branded hashtag" in resp.json()["detail"]

        # Platform limit enforcement uses merged platform+hashtag state
        resp = client.patch(
            f"/api/v1/marketing/content/{content_id}",
            json={"platforms": ["x"]},
        )
        assert resp.status_code == 400
        assert "maximum 2 hashtags" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_patch_content_unknown_id_returns_404(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        resp = client.patch(
            f"/api/v1/marketing/content/{uuid.uuid4()}",
            json={"campaign_name": "Nobody"},
        )
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── POST /content/{id}/publish ───────────────────────────────────────────────


def test_publish_content_marks_published(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]
        assert created.json()["published"] is False

        resp = client.post(f"/api/v1/marketing/content/{content_id}/publish")
        assert resp.status_code == 200
        assert resp.json()["published"] is True

        # persisted
        fetched = client.get(f"/api/v1/marketing/content/{content_id}").json()
        assert fetched["published"] is True

        # Unknown id -> 404
        resp = client.post(f"/api/v1/marketing/content/{uuid.uuid4()}/publish")
        assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ── DELETE /content/{id} ─────────────────────────────────────────────────────


def test_delete_content_removes_record(client, db_session_factory):
    user = _make_user()
    seed(user, db_session_factory=db_session_factory)
    app.dependency_overrides[get_current_user] = override_user(user)
    try:
        created = client.post("/api/v1/marketing/content", json=_valid_payload())
        content_id = created.json()["id"]

        resp = client.delete(f"/api/v1/marketing/content/{content_id}")
        assert resp.status_code == 204

        # Gone from the database, not just from the API surface
        assert client.get(f"/api/v1/marketing/content/{content_id}").status_code == 404
        assert client.get("/api/v1/marketing/content").json() == []

        # Deleting again -> 404
        assert (
            client.delete(f"/api/v1/marketing/content/{content_id}").status_code == 404
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
