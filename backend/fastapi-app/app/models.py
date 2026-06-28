"""SQLAlchemy ORM models for the YouAndINotAI platform."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.allocation_compat import (
    ACCOUNTING_LANE_COLUMN,
    ACCOUNTING_LANE_DEFAULT,
    ACCOUNTING_RESERVE_CENTS_COLUMN,
    ACCOUNTING_RESERVE_PERCENT_COLUMN,
    ENGAGEMENT_SCORE_COLUMN,
    MEMBER_BADGE_COLUMN,
)
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    square_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    # DEPRECATED: stripe_customer_id removed — Square is sole payment processor
    bot_shield_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    subscription_tier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subscription_active: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    adult_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    engagement_score: Mapped[float] = mapped_column(
        ENGAGEMENT_SCORE_COLUMN, Float, default=0.0, nullable=False
    )
    member_badge: Mapped[str | None] = mapped_column(
        MEMBER_BADGE_COLUMN, String(50), nullable=True
    )

    profile: Mapped["Profile | None"] = relationship(
        back_populates="user", uselist=False
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    looking_for: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    photos: Mapped[list] = mapped_column(JSON, default=list)
    interests: Mapped[list] = mapped_column(JSON, default=list)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    location_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="profile")


class UserBlock(Base):
    __tablename__ = "user_blocks"
    __table_args__ = (
        UniqueConstraint(
            "blocker_id", "blocked_id", name="uq_user_blocks_blocker_blocked"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    blocker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    blocked_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Swipe(Base):
    __tablename__ = "swipes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    direction: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # 'like' or 'pass'
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_a: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    user_b: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    compatibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    breeze_bypass_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    matched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_source_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    event_source: Mapped[str] = mapped_column(
        String(50),
        default="square",
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    retry_parent_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class RevenueAllocation(Base):
    """Internal ledger for founder-directed platform revenue allocations."""

    __tablename__ = "revenue_allocations"
    __table_args__ = (
        UniqueConstraint(
            "source_event_id", name="uq_revenue_allocations_source_event_id"
        ),
        UniqueConstraint(
            "square_payment_id", name="uq_revenue_allocations_square_payment_id"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source: Mapped[str] = mapped_column(String(50), default="square", nullable=False)
    source_event_id: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    square_payment_id: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    payment_tier: Mapped[str] = mapped_column(
        String(50), default="unknown", nullable=False
    )
    gross_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    reserve_amount_cents: Mapped[int] = mapped_column(
        ACCOUNTING_RESERVE_CENTS_COLUMN, Integer, nullable=False
    )
    operating_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    reserve_percent: Mapped[int] = mapped_column(
        ACCOUNTING_RESERVE_PERCENT_COLUMN,
        Integer,
        default=0,
        nullable=False,
    )
    accounting_lane: Mapped[str] = mapped_column(
        ACCOUNTING_LANE_COLUMN,
        String(100),
        default=ACCOUNTING_LANE_DEFAULT,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(20), default="reserved", nullable=False)
    payer_type: Mapped[str] = mapped_column(
        String(20), default="customer", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    disbursed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    board_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("boards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    max_attendees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="going", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VolunteerOpportunity(Base):
    __tablename__ = "volunteer_opportunities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    organization: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    hours_estimate: Mapped[float | None] = mapped_column(Float, nullable=True)
    event_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    spots: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VolunteerSignup(Base):
    __tablename__ = "volunteer_signups"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("volunteer_opportunities.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VerificationEvent(Base):
    """Tracks liveness verification attempts and their outcomes."""

    __tablename__ = "verification_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    challenge_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'liveness', 'email', 'payment'
    challenge_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending, passed, failed, expired
    trust_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    square_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # DEPRECATED: stripe_checkout_id removed — Square is sole payment processor
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class DataPrivacyLog(Base):
    __tablename__ = "data_privacy_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_message: Mapped[str] = mapped_column(Text, nullable=False)
    bot_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    escalation_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transcript: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UserReport(Base):
    __tablename__ = "user_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reported_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="profile", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    support_ticket_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("support_tickets.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class VideoCall(Base):
    __tablename__ = "video_calls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )
    initiator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class DoubleDateSession(Base):
    __tablename__ = "double_date_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    match_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False
    )
    match_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class DoubleDateAcceptance(Base):
    __tablename__ = "double_date_acceptances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("double_date_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False
    )
    accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class TrackedMarketingLink(Base):
    __tablename__ = "tracked_marketing_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    surface_name: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="affiliate", nullable=False)
    medium: Mapped[str] = mapped_column(String(50), default="referral", nullable=False)
    campaign_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    referral_code: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    click_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_clicked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


# RefreshToken model for OPU-47 JWT refresh token rotation
from app.models_refresh_token import RefreshToken  # noqa: F401, E402

# Import webhook retry models for table creation and scheduler access
from app.webhook_retry import WebhookDeadLetter, WebhookRetryQueue  # noqa: F401, E402
