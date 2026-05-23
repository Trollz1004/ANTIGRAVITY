import uuid
from datetime import date
from typing import List, Optional

import strawberry

from .types import ProfileResponse


@strawberry.input
class ProfileCreateInput:
    display_name: str
    bio: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    looking_for: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_profile(self, profile_data: ProfileCreateInput) -> ProfileResponse:
        # Placeholder for creating a new profile
        return ProfileResponse(
            user_id=uuid.uuid4(),
            display_name=profile_data.display_name,
            bio=profile_data.bio,
            age=profile_data.age,
            gender=profile_data.gender,
            looking_for=profile_data.looking_for,
            location=profile_data.location,
            photos=[],  # New profile starts with no photos
            interests=profile_data.interests or [],
            verified=False,
        )

    @strawberry.mutation
    def update_profile(
        self, user_id: uuid.UUID, profile_data: ProfileCreateInput
    ) -> ProfileResponse:
        # Placeholder for updating an existing profile
        return ProfileResponse(
            user_id=user_id,
            display_name=profile_data.display_name,
            bio=profile_data.bio,
            age=profile_data.age,
            gender=profile_data.gender,
            looking_for=profile_data.looking_for,
            location=profile_data.location,
            photos=["http://example.com/updated_photo.jpg"],  # Placeholder
            interests=profile_data.interests or [],
            verified=True,
        )
