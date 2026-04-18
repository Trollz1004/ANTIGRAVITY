"""Metrics bridge API — anonymized aggregate data for the Admin Dashboard.

Security: NO PII exposed. Only aggregate counts and revenue totals.
The dashboard at aidoesitall.website consumes this via API key (not user JWT).
Current doctrine: revenue reporting follows the live LLC policy, not retired split-era labels.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
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
    RevenueAllocation,
    User,
    VerificationEvent,
    VolunteerOpportunity,
    VolunteerSignup,
    WebhookEvent,
)
from app.subscriptions import PREPAID_SUBSCRIPTION_DURATIONS, utc_now

router = APIRouter(prefix="/metrics")


class RevenuePolicyResponse(BaseModel):
    """Current founder-directed operating policy for LLC revenue."""
    total_revenue_cents: int
    reserve_cents: int  # 10% founder-directed reserve
    operating_cents: int  # 90% operations
    reserve_percent: int


class PlatformMetricsResponse(BaseModel):
    """Aggregate platform health metrics — zero PII."""
    generated_at: str
    revenue: RevenuePolicyResponse
    users: dict  # total, verified, with_profile, subscribers
    engagement: dict  # matches, messages, posts, events, volunteer_signups
    verification: dict  # total_checks, passed, failed, pending


def _calculate_revenue_policy(total_cents: int) -> RevenuePolicyResponse:
    """1-wallet model: 10% reserve, founder-directed. No automatic routing."""
    reserve = (total_cents * 10) // 100
    operating = total_cents - reserve
    return RevenuePolicyResponse(
        total_revenue_cents=total_cents,
        reserve_cents=reserve,
        operating_cents=operating,
        reserve_percent=10,
    )


def _verify_metrics_key(x_metrics_key: str | None = Header(default=None, alias="X-Metrics-Key")) -> str:
    """Simple API key auth for dashboard access. Not user JWT."""
    settings = get_settings()
    expected = settings.metrics_api_key or settings.jwt_secret  # prefer dedicated key, fallback to jwt
    if not x_metrics_key or x_metrics_key != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid metrics key")
    return x_metrics_key


@router.get("/impact", response_model=PlatformMetricsResponse)
@router.get("/charity", response_model=PlatformMetricsResponse, deprecated=True)
async def impact_metrics(
    _key: str = Depends(_verify_metrics_key),
    db: AsyncSession = Depends(get_db),
) -> PlatformMetricsResponse:
    """Aggregate anonymized platform metrics for the Admin Dashboard.

    Returns revenue splits, user counts, engagement totals.
    NO individual user data, emails, names, or payment details.
    """

    # Revenue: completed Square payments reserved into the internal allocation ledger.
    revenue_total = await db.scalar(
        select(func.coalesce(func.sum(RevenueAllocation.gross_amount_cents), 0))
        .where(RevenueAllocation.status.in_(["reserved", "disbursed"]))
    ) or 0

    # Also count subscription revenue from Square webhook events (payment.completed / payment.created)
    # We count unique processed payment events to avoid double-counting
    webhook_revenue = await db.scalar(
        select(func.count(WebhookEvent.id))
        .where(WebhookEvent.event_type.in_(["payment.completed", "payment.created"]))
        .where(WebhookEvent.processed == True)
    ) or 0

    # User metrics — counts only
    total_users = await db.scalar(select(func.count(User.id))) or 0
    verified_users = await db.scalar(
        select(func.count(User.id)).where(User.bot_shield_verified == True)
    ) or 0
    profiled_users = await db.scalar(select(func.count(Profile.id))) or 0
    subscriber_now = utc_now()
    prepaid_tiers = tuple(PREPAID_SUBSCRIPTION_DURATIONS.keys())
    subscribers = await db.scalar(
        select(func.count(User.id)).where(
            and_(
                User.subscription_active == True,
                or_(
                    User.subscription_tier.is_(None),
                    User.subscription_tier.notin_(prepaid_tiers),
                    and_(
                        User.subscription_expires_at.is_not(None),
                        User.subscription_expires_at > subscriber_now,
                    ),
                ),
            )
        )
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
        revenue=_calculate_revenue_policy(revenue_total),
        users={
            "total": total_users,
            "verified": verified_users,
            "with_profile": profiled_users,
            "subscribers": subscribers,
            "square_payments_processed": webhook_revenue,
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
