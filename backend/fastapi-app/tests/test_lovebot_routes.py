from app.auth import get_current_user
from app.main import app
from tests.conftest import make_user


def test_lovebot_requires_active_subscription(client):
    async def override_current_user():
        return make_user(subscription_active=False)

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/api/v1/lovebot/quotes")
        assert response.status_code == 403
        assert (
            "require a Founding Member or Premium subscription"
            in response.json()["detail"]
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_lovebot_compatibility_returns_score_for_premium_user(client):
    async def override_current_user():
        return make_user(
            display_name="Premium User",
            subscription_active=True,
            subscription_tier="founding_member",
        )

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.post(
            "/api/v1/lovebot/compatibility",
            json={"name1": "Avery", "name2": "Jordan"},
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert isinstance(payload["score"], int)
        assert 0 <= payload["score"] <= 100
        assert isinstance(payload["message"], str)
        assert payload["message"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_lovebot_tips_rejects_invalid_category(client):
    async def override_current_user():
        return make_user(subscription_active=True, subscription_tier="founding_member")

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/api/v1/lovebot/tips?category=unknown")
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid tip category"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_lovebot_gifts_returns_ideas_for_premium_user(client):
    async def override_current_user():
        return make_user(subscription_active=True, subscription_tier="founding_member")

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.get("/api/v1/lovebot/gifts?recipient=masculine")
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["recipient"] == "masculine"
        assert isinstance(payload["ideas"], list)
        assert len(payload["ideas"]) >= 3
    finally:
        app.dependency_overrides.pop(get_current_user, None)
