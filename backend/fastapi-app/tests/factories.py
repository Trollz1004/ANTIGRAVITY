import uuid
from datetime import date, datetime, timedelta, timezone
from app.auth import hash_password

def UserFactory(**kwargs) -> dict:
    """Factory for User model."""
    defaults = {
        "id": uuid.uuid4(),
        "email": f"user_{uuid.uuid4().hex[:8]}@example.com",
        "password_hash": hash_password("password123"),
        "display_name": f"Test User {uuid.uuid4().hex[:4]}",
        "date_of_birth": date(1990, 1, 1),
        "square_customer_id": None,
        "google_id": None,
        "bot_shield_verified": False,
        "subscription_tier": None,
        "subscription_active": False,
        "subscription_expires_at": None,
        "adult_verified_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_active": True,
        "mission_impact_score": 0.0,
        "intent_badge": None,
    }
    defaults.update(kwargs)
    return defaults

def ProfileFactory(user_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Profile model."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id or uuid.uuid4(),
        "bio": "This is a test bio.",
        "age": 30,
        "gender": "non-binary",
        "looking_for": "friends",
        "location": "Test City, TS",
        "photos": [],
        "interests": ["coding", "reading"],
        "verified": False,
        "location_enabled": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def SwipeFactory(user_id: uuid.UUID | None = None, target_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Swipe model."""
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id or uuid.uuid4(),
        "target_id": target_id or uuid.uuid4(),
        "direction": "like",
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def MatchFactory(user_a: uuid.UUID | None = None, user_b: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Match model."""
    defaults = {
        "id": uuid.uuid4(),
        "user_a": user_a or uuid.uuid4(),
        "user_b": user_b or uuid.uuid4(),
        "compatibility_score": 0.85,
        "status": "active",
        "breeze_bypass_enabled": False,
        "matched_at": datetime.now(timezone.utc),
        "last_message_at": None,
    }
    defaults.update(kwargs)
    return defaults

def MessageFactory(match_id: uuid.UUID | None = None, sender_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Message model."""
    defaults = {
        "id": uuid.uuid4(),
        "match_id": match_id or uuid.uuid4(),
        "sender_id": sender_id or uuid.uuid4(),
        "content": "Hello from a test message!",
        "read_at": None,
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def BoardFactory(**kwargs) -> dict:
    """Factory for Board model."""
    board_name = f"Test Board {uuid.uuid4().hex[:4]}"
    defaults = {
        "id": uuid.uuid4(),
        "name": board_name,
        "description": f"Description for {board_name}.",
        "slug": board_name.lower().replace(" ", "-"),
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def PostFactory(board_id: uuid.UUID | None = None, author_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Post model."""
    defaults = {
        "id": uuid.uuid4(),
        "board_id": board_id or uuid.uuid4(),
        "author_id": author_id or uuid.uuid4(),
        "title": f"Test Post Title {uuid.uuid4().hex[:4]}",
        "body": "This is the body of a test post.",
        "like_count": 0,
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def CommentFactory(post_id: uuid.UUID | None = None, author_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Comment model."""
    defaults = {
        "id": uuid.uuid4(),
        "post_id": post_id or uuid.uuid4(),
        "author_id": author_id or uuid.uuid4(),
        "body": "This is a test comment.",
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def EventFactory(organizer_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for Event model."""
    defaults = {
        "id": uuid.uuid4(),
        "organizer_id": organizer_id or uuid.uuid4(),
        "title": f"Test Event {uuid.uuid4().hex[:4]}",
        "description": "A wonderful test event.",
        "location": "Virtual",
        "event_date": datetime(2026, 6, 1, 18, 0, 0, tzinfo=timezone.utc),
        "max_attendees": 100,
        "category": "social",
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def SupportTicketFactory(user_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for SupportTicket model."""
    email = f"customer_{uuid.uuid4().hex[:8]}@example.com"
    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id or uuid.uuid4(),
        "status": "open",
        "category": "billing",
        "subject": "Issue with my account",
        "customer_email": email,
        "customer_message": "I have an issue with my recent payment.",
        "bot_response": None,
        "escalation_reason": None,
        "transcript": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults

def RefreshTokenFactory(user_id: uuid.UUID | None = None, **kwargs) -> dict:
    """Factory for RefreshToken model."""
    import hashlib
    raw_token = f"refresh_token_{uuid.uuid4().hex}"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    defaults = {
        "id": uuid.uuid4(),
        "user_id": user_id or uuid.uuid4(),
        "token_hash": token_hash,
        "expires_at": expires,
        "revoked_at": None,
        "replaced_by": None,
        "created_at": datetime.now(timezone.utc),
        "ip_address": "127.0.0.1",
        "user_agent": "TestAgent/1.0",
    }
    defaults.update(kwargs)
    return defaults
