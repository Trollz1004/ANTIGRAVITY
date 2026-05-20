
import strawberry
from typing import List, Optional
import uuid

from .types import (
    UserMeResponse,
    ProfileResponse,
    MatchResponse,
    DiscoverProfileResponse,
    MessageResponse,
    PostResponse,
    CommentResponse,
    EventResponse,
    VolunteerResponse,
)

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Hello from GraphQL!"

    @strawberry.field
    def me(self) -> UserMeResponse:
        # Placeholder for fetching current user data
        return UserMeResponse(
            user_id=uuid.UUID("a1a2a3a4-a5b6-c7d8-e9f0-a1b2c3d4e5f6"),
            email="test@example.com",
            display_name="Test User",
            bot_shield_verified=True,
            subscription_tier="premium",
            subscription_active=True,
            subscription_expires_at=None,
            has_profile=True,
            adult_verified=True,
            mission_impact_score=100.0,
            intent_badge="hero",
        )

    @strawberry.field
    def profiles(self, age: Optional[int] = None, location: Optional[str] = None) -> List[ProfileResponse]:
        # Placeholder for fetching profiles
        return [
            ProfileResponse(
                user_id=uuid.UUID("b1b2b3b4-b5b6-c7d8-e9f0-a1b2c3d4e5f6"),
                display_name="Profile 1",
                bio="A test bio for profile 1.",
                age=25,
                gender="Female",
                looking_for="Male",
                location="New York",
                photos=["http://example.com/photo1.jpg"],
                interests=["reading", "hiking"],
                verified=True,
            ),
            ProfileResponse(
                user_id=uuid.UUID("c1c2c3c4-c5c6-c7d8-e9f0-a1b2c3d4e5f6"),
                display_name="Profile 2",
                bio="Another test bio.",
                age=30,
                gender="Male",
                looking_for="Female",
                location="Los Angeles",
                photos=["http://example.com/photo2.jpg"],
                interests=["coding", "gaming"],
                verified=False,
            ),
        ]

