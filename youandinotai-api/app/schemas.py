"""Pydantic schemas for request and response payloads."""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth ──

class AuthRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)
    date_of_birth: date
    accepted_terms: Literal[True]
    accepted_cookie_policy: Literal[True]
    confirmed_over_18: Literal[True]


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID


class AuthRefreshRequest(BaseModel):
    refresh_token: str


class UserMeResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    display_name: str
    bot_shield_verified: bool
    subscription_tier: str | None
    subscription_active: bool
    has_profile: bool
    adult_verified: bool
    model_config = ConfigDict(from_attributes=True)


# ── Profile ──

class ProfileUpdateRequest(BaseModel):
    bio: str | None = Field(None, max_length=500)
    age: int | None = Field(None, ge=18, le=120)
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=50)
    looking_for: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=200)
    interests: list[str] = Field(default_factory=list, max_length=20)


class ProfileResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    bio: str | None
    age: int | None
    gender: str | None
    looking_for: str | None
    location: str | None
    photos: list[str]
    interests: list[str]
    verified: bool
    model_config = ConfigDict(from_attributes=True)


# ── Swipe / Match ──

class SwipeRequest(BaseModel):
    target_id: uuid.UUID
    direction: str = Field(pattern="^(like|pass)$")


class SwipeResponse(BaseModel):
    matched: bool
    match_id: uuid.UUID | None = None


class MatchResponse(BaseModel):
    match_id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    photos: list[str]
    matched_at: datetime
    last_message_at: datetime | None
    verified: bool = False
    subscription_active: bool = False
    model_config = ConfigDict(from_attributes=True)


class DiscoverProfileResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    bio: str | None
    age: int | None
    photos: list[str]
    interests: list[str]
    location: str | None
    verified: bool = False
    subscription_active: bool = False
    model_config = ConfigDict(from_attributes=True)


# ── Messages ──

class MessageSendRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    read_at: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Webhooks ──

class WebhookAckResponse(BaseModel):
    received: bool = True
    event_id: str
    processed: bool
    duplicate: bool = False


# ── Health ──

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    square_connected: bool
    user_count: int
    model_config = ConfigDict(from_attributes=True)


# ── Boards ──

class PostCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=5000)


class PostResponse(BaseModel):
    id: uuid.UUID
    board_slug: str
    author_id: uuid.UUID
    author_name: str
    title: str
    body: str
    like_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CommentCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PostReportRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


# ── Events ──

class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    location: str | None = Field(None, max_length=300)
    event_date: datetime
    max_attendees: int | None = Field(None, ge=1)
    category: str = "general"


class EventResponse(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    organizer_name: str
    title: str
    description: str
    location: str | None
    event_date: datetime
    max_attendees: int | None
    attendee_count: int
    category: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventRSVPResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Volunteering ──

VOLUNTEER_CATEGORIES = [
    "general", "children", "elderly", "environment", "animals",
    "food_bank", "education", "healthcare", "disaster_relief", "community",
]


class VolunteerCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    organization: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    location: str | None = Field(None, max_length=300)
    category: str = "general"
    hours_estimate: float | None = Field(None, ge=0.5, le=100)
    event_date: datetime | None = None
    spots: int | None = Field(None, ge=1)


class VolunteerResponse(BaseModel):
    id: uuid.UUID
    created_by: uuid.UUID
    creator_name: str = ""
    title: str
    organization: str
    description: str
    location: str | None
    category: str = "general"
    hours_estimate: float | None = None
    event_date: datetime | None
    spots: int | None
    signup_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VolunteerImpactResponse(BaseModel):
    """Aggregate community impact — shown on the volunteering hub dashboard."""
    total_opportunities: int
    total_signups: int
    total_hours_committed: float
    unique_organizations: int
    unique_volunteers: int
    category_breakdown: dict[str, int]  # category → signup count
    top_organizations: list[dict]  # [{name, signups, hours}]
    local_opportunities: int  # filtered by location if provided


class MySignupResponse(BaseModel):
    signup_id: uuid.UUID
    opportunity_id: uuid.UUID
    title: str
    organization: str
    location: str | None
    category: str
    hours_estimate: float | None
    event_date: datetime | None
    signed_up_at: datetime


# ── Privacy ──

class PrivacyProfileSummary(BaseModel):
    bio: str | None
    age: int | None
    gender: str | None
    looking_for: str | None
    location: str | None
    interests: list[str]
    verified: bool
    location_enabled: bool


class PrivacyRequestResponse(BaseModel):
    id: uuid.UUID
    action: str
    status: str
    created_at: datetime
    scheduled_for: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class PrivacyMyDataResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    display_name: str
    created_at: datetime
    profile: PrivacyProfileSummary | None = None
    message_count: int
    match_count: int
    photos_count: int
    pending_requests: list[PrivacyRequestResponse]


class PrivacyActionResponse(BaseModel):
    status: str
    action: str
    request_id: uuid.UUID
    scheduled_for: datetime | None = None


# ── Video Calls ──

class VideoCallResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    initiator_id: uuid.UUID
    status: str
    duration_seconds: int | None = None
    started_at: datetime
    ended_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


# ── Double Dates ──

class DoubleDateParticipantResponse(BaseModel):
    user_id: uuid.UUID
    display_name: str
    photo_url: str | None = None
    model_config = ConfigDict(from_attributes=True)


class DoubleDateCoupleResponse(BaseModel):
    match_id: uuid.UUID
    members: list[DoubleDateParticipantResponse]


class DoubleDateSessionResponse(BaseModel):
    id: uuid.UUID
    match_a_id: uuid.UUID
    match_b_id: uuid.UUID
    status: str
    created_at: datetime
    accepted_match_ids: list[uuid.UUID] = Field(default_factory=list)
    couple_a: DoubleDateCoupleResponse | None = None
    couple_b: DoubleDateCoupleResponse | None = None
    model_config = ConfigDict(from_attributes=True)


class DoubleDateProposeRequest(BaseModel):
    match_a_id: uuid.UUID
    match_b_id: uuid.UUID


# ── User Registration ──

class UserRegisterRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)


class UserRegisterResponse(BaseModel):
    user_id: uuid.UUID
    session_token: str
