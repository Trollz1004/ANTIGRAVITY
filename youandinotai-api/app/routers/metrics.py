"""Metrics bridge API — anonymized aggregate data for the Admin Dashboard.

Security: NO PII exposed. Only aggregate counts and revenue totals.
The dashboard at aidoesitall.website consumes this via API key (not user JWT).
Iron Wall: ENIGMA revenue data only — OMEGA stays completely separate.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import (
    Event,
    EventRSVP,
    Match,
    Message,
    Post,
    Profile,
    User,
    VerificationEvent,
    VolunteerOpportunity,
    VolunteerSignup,
    WebhookEvent,
)

router = APIRouter(prefix="/metrics")


class RevenueSplitResponse(BaseModel):
    """Protocol Omega: 60/30/10 split from day one."""
    total_revenue_cents: int
    shriners_children_cents: int  # 60%
    v8_infrastructure_cents: int  # 30%
    founder_operations_cents: int  # 10%
    remainder_to_charity_cents: int  # integer remainder


class PlatformMetricsResponse(BaseModel):
    """Aggregate platform health metrics — zero PII."""
    generated_at: str
    revenue: RevenueSplitResponse
    users: dict  # total, verified, with_profile, subscribers
    engagement: dict  # matches, messages, posts, events, volunteer_signups
    verification: dict  # total_checks, passed, failed, pending


def _calculate_split(total_cents: int) -> RevenueSplitResponse:
    """Protocol Omega: 60/30/10 contractual revenue disbursement — integer remainder to Shriners."""
    shriners = (total_cents * 60) // 100
    v8_infra = (total_cents * 30) // 100
    founder = (total_cents * 10) // 100
    remainder = total_cents - shriners - v8_infra - founder
    return RevenueSplitResponse(
        total_revenue_cents=total_cents,
        shriners_children_cents=shriners + remainder,
        v8_infrastructure_cents=v8_infra,
        founder_operations_cents=founder,
        remainder_to_charity_cents=remainder,
    )


def _verify_metrics_key(x_metrics_key: str | None = Header(default=None, alias="X-Metrics-Key")) -> str:
    """Simple API key auth for dashboard access. Not user JWT."""
    settings = get_settings()
    expected = settings.metrics_api_key or settings.jwt_secret  # prefer dedicated key, fallback to jwt
    if not x_metrics_key or x_metrics_key != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid metrics key")
    return x_metrics_key


@router.get("/charity", response_model=PlatformMetricsResponse)
async def charity_metrics(
    _key: str = Depends(_verify_metrics_key),
    db: AsyncSession = Depends(get_db),
) -> PlatformMetricsResponse:
    """Aggregate anonymized platform metrics for the Admin Dashboard.

    Returns revenue splits, user counts, engagement totals.
    NO individual user data, emails, names, or payment details.
    """

    # Revenue: sum amount_cents from successful verification events
    revenue_total = await db.scalar(
        select(func.coalesce(func.sum(VerificationEvent.amount_cents), 0))
        .where(VerificationEvent.status == "passed")
    ) or 0

    # Also count subscription revenue from webhook events (checkout.session.completed)
    # We count unique checkout events to avoid double-counting
    webhook_revenue = await db.scalar(
        select(func.count(WebhookEvent.id))
        .where(WebhookEvent.event_type == "checkout.session.completed")
        .where(WebhookEvent.processed == True)
    ) or 0

    # User metrics — counts only
    total_users = await db.scalar(select(func.count(User.id))) or 0
    verified_users = await db.scalar(
        select(func.count(User.id)).where(User.bot_shield_verified == True)
    ) or 0
    profiled_users = await db.scalar(select(func.count(Profile.id))) or 0
    subscribers = await db.scalar(
        select(func.count(User.id)).where(User.subscription_active == True)
    ) or 0

    # Engagement metrics — counts only
    total_matches = await db.scalar(select(func.count(Match.id))) or 0
    total_messages = await db.scalar(select(func.count(Message.id))) or 0
    total_posts = await db.scalar(select(func.count(Post.id))) or 0
    total_events = await db.scalar(select(func.count(Event.id))) or 0
    total_rsvps = await db.scalar(select(func.count(EventRSVP.id))) or 0
    total_vol_opps = await db.scalar(select(func.count(VolunteerOpportunity.id))) or 0
    total_vol_signups = await db.scalar(select(func.count(VolunteerSignup.id))) or 0

    # Verification metrics
    total_checks = await db.scalar(select(func.count(VerificationEvent.id))) or 0
    passed_checks = await db.scalar(
        select(func.count(VerificationEvent.id)).where(VerificationEvent.status == "passed")
    ) or 0
    failed_checks = await db.scalar(
        select(func.count(VerificationEvent.id)).where(VerificationEvent.status == "failed")
    ) or 0
    pending_checks = await db.scalar(
        select(func.count(VerificationEvent.id)).where(VerificationEvent.status == "pending")
    ) or 0

    return PlatformMetricsResponse(
        generated_at=datetime.now(timezone.utc).isoformat(),
        revenue=_calculate_split(revenue_total),
        users={
            "total": total_users,
            "verified": verified_users,
            "with_profile": profiled_users,
            "subscribers": subscribers,
        },
        engagement={
            "matches": total_matches,
            "messages": total_messages,
            "posts": total_posts,
            "events": total_events,
            "event_rsvps": total_rsvps,
            "volunteer_opportunities": total_vol_opps,
            "volunteer_signups": total_vol_signups,
        },
        verification={
            "total_checks": total_checks,
            "passed": passed_checks,
            "failed": failed_checks,
            "pending": pending_checks,
        },
    )
