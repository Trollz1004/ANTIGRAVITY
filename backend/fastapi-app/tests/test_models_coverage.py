"""Tests for app.models — SQLAlchemy ORM model definitions.

Since models are primarily declarative, we verify table names, required columns,
and relationships are correctly defined.
"""

from app.database import Base
from app.models import (
    Board,
    Comment,
    DataPrivacyLog,
    DoubleDateAcceptance,
    DoubleDateSession,
    Event,
    EventRSVP,
    Match,
    Message,
    Post,
    Profile,
    RevenueAllocation,
    SupportTicket,
    Swipe,
    User,
    UserBlock,
    UserReport,
    VerificationEvent,
    VideoCall,
    VolunteerOpportunity,
    VolunteerSignup,
    WebhookEvent,
)


class TestUserModel:
    def test_tablename(self):
        assert User.__tablename__ == "users"

    def test_has_required_columns(self):
        cols = {c.name for c in User.__table__.columns}
        assert "id" in cols
        assert "email" in cols
        assert "display_name" in cols
        assert "password_hash" in cols
        assert "bot_shield_verified" in cols
        assert "created_at" in cols


class TestProfileModel:
    def test_tablename(self):
        assert Profile.__tablename__ == "profiles"

    def test_has_user_id(self):
        cols = {c.name for c in Profile.__table__.columns}
        assert "user_id" in cols


class TestUserBlockModel:
    def test_tablename(self):
        assert UserBlock.__tablename__ == "user_blocks"

    def test_columns(self):
        cols = {c.name for c in UserBlock.__table__.columns}
        assert "blocker_id" in cols
        assert "blocked_id" in cols


class TestSwipeModel:
    def test_tablename(self):
        assert Swipe.__tablename__ == "swipes"


class TestMatchModel:
    def test_tablename(self):
        assert Match.__tablename__ == "matches"

    def test_columns(self):
        cols = {c.name for c in Match.__table__.columns}
        assert "user_a" in cols
        assert "user_b" in cols
        assert "status" in cols


class TestMessageModel:
    def test_tablename(self):
        assert Message.__tablename__ == "messages"


class TestWebhookEventModel:
    def test_tablename(self):
        assert WebhookEvent.__tablename__ == "webhook_events"


class TestRevenueAllocationModel:
    def test_tablename(self):
        assert RevenueAllocation.__tablename__ == "revenue_allocations"

    def test_has_financial_columns(self):
        cols = {c.name for c in RevenueAllocation.__table__.columns}
        assert "amount_cents" in cols


class TestBoardModel:
    def test_tablename(self):
        assert Board.__tablename__ == "boards"


class TestPostModel:
    def test_tablename(self):
        assert Post.__tablename__ == "posts"


class TestCommentModel:
    def test_tablename(self):
        assert Comment.__tablename__ == "comments"


class TestEventModel:
    def test_tablename(self):
        assert Event.__tablename__ == "events"


class TestEventRSVPModel:
    def test_tablename(self):
        assert EventRSVP.__tablename__ == "event_rsvps"


class TestVolunteerOpportunityModel:
    def test_tablename(self):
        assert VolunteerOpportunity.__tablename__ == "volunteer_opportunities"


class TestVolunteerSignupModel:
    def test_tablename(self):
        assert VolunteerSignup.__tablename__ == "volunteer_signups"


class TestVerificationEventModel:
    def test_tablename(self):
        assert VerificationEvent.__tablename__ == "verification_events"


class TestDataPrivacyLogModel:
    def test_tablename(self):
        assert DataPrivacyLog.__tablename__ == "data_privacy_logs"


class TestSupportTicketModel:
    def test_tablename(self):
        assert SupportTicket.__tablename__ == "support_tickets"

    def test_columns(self):
        cols = {c.name for c in SupportTicket.__table__.columns}
        assert "status" in cols
        assert "priority" in cols


class TestUserReportModel:
    def test_tablename(self):
        assert UserReport.__tablename__ == "user_reports"


class TestVideoCallModel:
    def test_tablename(self):
        assert VideoCall.__tablename__ == "video_calls"


class TestDoubleDateSessionModel:
    def test_tablename(self):
        assert DoubleDateSession.__tablename__ == "double_date_sessions"


class TestDoubleDateAcceptanceModel:
    def test_tablename(self):
        assert DoubleDateAcceptance.__tablename__ == "double_date_acceptances"


class TestBaseInheritance:
    def test_all_models_inherit_base(self):
        models = [
            User, Profile, UserBlock, Swipe, Match, Message,
            WebhookEvent, RevenueAllocation, Board, Post, Comment,
            Event, EventRSVP, VolunteerOpportunity, VolunteerSignup,
            VerificationEvent, DataPrivacyLog, SupportTicket, UserReport,
            VideoCall, DoubleDateSession, DoubleDateAcceptance,
        ]
        for model in models:
            assert issubclass(model, Base)
