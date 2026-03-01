"""Pydantic schemas for request and response payloads."""

import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)


class UserRegisterResponse(BaseModel):
    user_id: uuid.UUID
    session_token: str


class WebhookAckResponse(BaseModel):
    received: bool = True
    event_id: str
    processed: bool
    duplicate: bool = False


class MatchPreferences(BaseModel):
    age_range: str | None = None
    interests: list[str] = Field(default_factory=list)
    location_radius: int | None = None


class MatchRequest(BaseModel):
    user_id: uuid.UUID
    preferences: MatchPreferences = Field(default_factory=MatchPreferences)


class MatchResult(BaseModel):
    user_id: uuid.UUID
    compatibility_score: float
    match_reason: str = Field(min_length=1, max_length=240)


class MatchResponse(BaseModel):
    matches: list[MatchResult]


class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    stripe_connected: bool
    user_count: int

    model_config = ConfigDict(from_attributes=True)
