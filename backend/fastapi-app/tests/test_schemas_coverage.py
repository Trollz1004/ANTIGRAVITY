"""Tests for app.schemas — Pydantic request/response models.

Verifies that schema classes can be instantiated and validated correctly.
"""

import uuid
from datetime import datetime, timezone

from app.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    CommentCreateRequest,
    DiscoverProfileResponse,
    HealthResponse,
    MatchResponse,
    MessageResponse,
    MessageSendRequest,
    PostCreateRequest,
    PostResponse,
    ProfilePatchRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    SafetyBlockRequest,
    SafetyBlockResponse,
    SwipeRequest,
    SwipeResponse,
    UserMeResponse,
    WaitlistSignupRequest,
    WaitlistSignupResponse,
    WebhookAckResponse,
)


class TestAuthSchemas:
    def test_register_request(self):
        req = AuthRegisterRequest(
            email="test@example.com",
            password="securepass123",
            display_name="Tester",
        )
        assert req.email == "test@example.com"

    def test_login_request(self):
        req = AuthLoginRequest(email="test@example.com", password="pass123")
        assert req.email == "test@example.com"


class TestProfileSchemas:
    def test_update_request(self):
        req = ProfileUpdateRequest(bio="Hello world", age=25)
        assert req.bio == "Hello world"

    def test_patch_request_optional(self):
        req = ProfilePatchRequest()
        assert req.model_fields_set == set()

    def test_patch_request_partial(self):
        req = ProfilePatchRequest.model_validate({"bio": "new bio"})
        assert "bio" in req.model_fields_set

    def test_profile_response(self):
        uid = uuid.uuid4()
        resp = ProfileResponse(
            id=uid,
            user_id=uid,
            display_name="Tester",
            bio="Hello",
            age=25,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.display_name == "Tester"


class TestSwipeSchemas:
    def test_swipe_request(self):
        uid = uuid.uuid4()
        req = SwipeRequest(target_user_id=uid, direction="right")
        assert req.direction == "right"

    def test_swipe_response(self):
        resp = SwipeResponse(matched=True)
        assert resp.matched is True


class TestMatchSchemas:
    def test_match_response(self):
        uid_a = uuid.uuid4()
        uid_b = uuid.uuid4()
        resp = MatchResponse(
            id=uuid.uuid4(),
            user_a=uid_a,
            user_b=uid_b,
            status="active",
            created_at=datetime.now(timezone.utc),
        )
        assert resp.status == "active"


class TestMessageSchemas:
    def test_send_request(self):
        uid = uuid.uuid4()
        req = MessageSendRequest(match_id=uid, content="Hello!")
        assert req.content == "Hello!"

    def test_message_response(self):
        resp = MessageResponse(
            id=uuid.uuid4(),
            match_id=uuid.uuid4(),
            sender_id=uuid.uuid4(),
            content="Hi",
            created_at=datetime.now(timezone.utc),
        )
        assert resp.content == "Hi"


class TestSafetySchemas:
    def test_block_request(self):
        uid = uuid.uuid4()
        req = SafetyBlockRequest(blocked_user_id=uid)
        assert req.blocked_user_id == uid

    def test_block_response(self):
        resp = SafetyBlockResponse(
            id=uuid.uuid4(),
            blocker_id=uuid.uuid4(),
            blocked_id=uuid.uuid4(),
            created_at=datetime.now(timezone.utc),
        )
        assert resp.id is not None


class TestPostSchemas:
    def test_create_request(self):
        req = PostCreateRequest(title="My Post", content="Content here")
        assert req.title == "My Post"


class TestWaitlistSchemas:
    def test_signup_request(self):
        req = WaitlistSignupRequest(email="wait@example.com")
        assert req.email == "wait@example.com"


class TestHealthSchemas:
    def test_health_response(self):
        resp = HealthResponse(status="ok", version="1.0.0")
        assert resp.status == "ok"


class TestWebhookSchemas:
    def test_ack_response(self):
        resp = WebhookAckResponse(received=True)
        assert resp.received is True


class TestUserMeResponse:
    def test_basic(self):
        resp = UserMeResponse(
            id=uuid.uuid4(),
            email="test@example.com",
            display_name="Tester",
            bot_shield_verified=False,
            subscription_active=False,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.email == "test@example.com"
