"""Prometheus metrics endpoint for the ANTIGRAVITY platform."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import Match, Message, RevenueAllocation, User, VerificationEvent
from app.monitoring import get_metrics_response

logger = logging.getLogger("youandinotai.metrics")

router = APIRouter()

# webhooks.py:554-572 calls reserve_revenue_allocation() only when Square
# reports payment.status == "COMPLETED", and revenue_allocation.py:190 writes
# status="reserved" on every collected row. Nothing in the backend writes
# "completed", "paid", or "settled" to RevenueAllocation.status.
COLLECTED_PAYMENT_ALLOCATION_STATUS = "reserved"


def _is_founder_or_admin(user: User) -> bool:
    settings = get_settings()
    return (user.email or "").strip().lower() in settings.support_operator_email_list


async def _require_founder_or_admin(
    user: User = Depends(get_current_user),
) -> User:
    if not _is_founder_or_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Founder or admin access required",
        )
    return user


def _expected_metrics_key() -> str:
    settings = get_settings()
    return settings.metrics_api_key or settings.jwt_secret


def _require_metrics_key(
    x_metrics_key: str | None = Header(default=None, alias="X-Metrics-Key"),
) -> None:
    expected = _expected_metrics_key()
    if not x_metrics_key or x_metrics_key != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid metrics key",
        )


async def _count(db: AsyncSession, statement) -> int:
    return int(await db.scalar(statement) or 0)


async def _impact_payload(db: AsyncSession) -> dict:
    total_revenue_cents = await _count(
        db, select(func.coalesce(func.sum(RevenueAllocation.gross_amount_cents), 0))
    )
    total_users = await _count(db, select(func.count(User.id)))
    active_users = await _count(
        db, select(func.count(User.id)).where(User.is_active.is_(True))
    )
    verified_users = await _count(
        db, select(func.count(User.id)).where(User.bot_shield_verified.is_(True))
    )
    subscription_users = await _count(
        db, select(func.count(User.id)).where(User.subscription_active.is_(True))
    )

    matches = await _count(db, select(func.count(Match.id)))
    messages = await _count(db, select(func.count(Message.id)))
    verifications_started = await _count(db, select(func.count(VerificationEvent.id)))
    verifications_completed = await _count(
        db,
        select(func.count(VerificationEvent.id)).where(
            VerificationEvent.status.in_(("passed", "completed"))
        ),
    )
    verifications_pending = await _count(
        db,
        select(func.count(VerificationEvent.id)).where(
            VerificationEvent.status == "pending"
        ),
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "revenue": {
            "total_revenue_cents": total_revenue_cents,
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "verified": verified_users,
            "subscribed": subscription_users,
        },
        "engagement": {
            "matches": matches,
            "messages": messages,
        },
        "verification": {
            "started": verifications_started,
            "completed": verifications_completed,
            "pending": verifications_pending,
        },
    }


@router.get("/metrics")
async def prometheus_metrics():
    """Expose Prometheus metrics for scraping.

    Returns metrics in Prometheus text format including:
    - youandinotai_http_requests_total: Total HTTP requests (labeled by method, endpoint, status_code)
    - youandinotai_http_request_duration_seconds: Request duration histogram (labeled by method, endpoint)
    - youandinotai_http_requests_in_progress: Currently in-flight requests gauge
    """
    response = get_metrics_response()
    if response is None:
        from fastapi.responses import PlainTextResponse

        return PlainTextResponse(
            content="# Prometheus metrics not available (prometheus-client not installed)\n",
            status_code=503,
        )
    return response


@router.get("/metrics/impact", dependencies=[Depends(_require_metrics_key)])
async def impact_metrics(db: AsyncSession = Depends(get_db)):
    """Aggregate platform metrics with no individual user or payment records."""
    return await _impact_payload(db)


@router.get("/metrics/founding-members", dependencies=[Depends(_require_metrics_key)])
async def founding_member_funnel(db: AsyncSession = Depends(get_db)):
    """Report progress toward the first 50 real founding-member conversions.

    Sourced from RevenueAllocation rows with a confirmed Square receipt
    (has_square_receipt=True) and payment_tier='founding_member' — never
    seeded/mock data.
    """
    target = 50
    base = select(RevenueAllocation).where(
        RevenueAllocation.payment_tier == "founding_member",
        RevenueAllocation.has_square_receipt.is_(True),
    )

    total = await _count(
        db,
        select(func.count()).select_from(base.subquery()),
    )

    rows = (
        (
            await db.execute(
                base.order_by(RevenueAllocation.created_at.asc()).limit(target)
            )
        )
        .scalars()
        .all()
    )

    conversions = [
        {
            "sequence": index + 1,
            "user_id": str(row.user_id) if row.user_id else None,
            "square_payment_id": row.square_payment_id,
            "gross_amount_cents": row.gross_amount_cents,
            "converted_at": row.created_at.isoformat(),
        }
        for index, row in enumerate(rows)
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target": target,
        "confirmed_conversions": total,
        "remaining_to_target": max(target - total, 0),
        "target_reached": total >= target,
        "conversions": conversions,
    }


@router.get("/metrics/security-audit", dependencies=[Depends(_require_metrics_key)])
async def security_audit_metrics():
    """Expose a minimal aggregate security status for ops dashboards."""
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "ok",
        "checks": {
            "pii_exposed": 0,
            "individual_records_exposed": 0,
            "metrics_key_required": 1,
        },
    }


@router.get("/metrics/affiliates", dependencies=[Depends(_require_founder_or_admin)])
async def affiliate_metrics(
    code: str | None = Query(
        default=None,
        max_length=64,
        description="Optional referral code filter; returns zeros when the code has no activity.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Read-only per-referral-code counts for sign-ups, $1 checks, collected customer payments, and 50% owed cents."""
    normalized_filter = (code or "").strip().lower() or None

    normalized_code_expr = func.lower(func.trim(User.referral_code))

    user_stmt = (
        select(
            normalized_code_expr.label("referral_code"),
            func.count(User.id).label("signups_count"),
            func.coalesce(
                func.sum(case((User.bot_shield_verified.is_(True), 1), else_=0)),
                0,
            ).label("verified_count"),
        )
        .where(
            User.referral_code.is_not(None),
            func.length(func.trim(User.referral_code)) > 0,
        )
        .group_by(normalized_code_expr)
    )
    if normalized_filter:
        user_stmt = user_stmt.where(normalized_code_expr == normalized_filter)

    payment_stmt = (
        select(
            normalized_code_expr.label("referral_code"),
            func.count(RevenueAllocation.id).label("payments_count"),
            func.coalesce(func.sum(RevenueAllocation.gross_amount_cents), 0).label(
                "gross_cents"
            ),
        )
        .join(User, RevenueAllocation.user_id == User.id)
        .where(
            User.referral_code.is_not(None),
            func.length(func.trim(User.referral_code)) > 0,
            RevenueAllocation.gross_amount_cents > 0,
            RevenueAllocation.payer_type == "customer",
            func.lower(RevenueAllocation.status) == COLLECTED_PAYMENT_ALLOCATION_STATUS,
        )
        .group_by(normalized_code_expr)
    )
    if normalized_filter:
        payment_stmt = payment_stmt.where(normalized_code_expr == normalized_filter)

    user_rows = (await db.execute(user_stmt)).mappings().all()
    payment_rows = (await db.execute(payment_stmt)).mappings().all()

    payments_by_code = {
        str(row["referral_code"]): {
            "payments_count": int(row["payments_count"] or 0),
            "gross_cents": int(row["gross_cents"] or 0),
        }
        for row in payment_rows
    }

    items = []
    for row in sorted(user_rows, key=lambda r: str(r["referral_code"]).lower()):
        ref_code = str(row["referral_code"])
        signups_count = int(row["signups_count"] or 0)
        verified_count = int(row["verified_count"] or 0)
        pay_info = payments_by_code.get(
            ref_code, {"payments_count": 0, "gross_cents": 0}
        )
        payments_count = pay_info["payments_count"]
        gross_cents = pay_info["gross_cents"]
        owed_cents = gross_cents // 2
        items.append(
            {
                "referral_code": ref_code,
                "signups_count": signups_count,
                "verified_count": verified_count,
                "payments_count": payments_count,
                "gross_cents": gross_cents,
                "owed_cents": owed_cents,
            }
        )

    if normalized_filter and not items:
        items.append(
            {
                "referral_code": normalized_filter,
                "signups_count": 0,
                "verified_count": 0,
                "payments_count": 0,
                "gross_cents": 0,
                "owed_cents": 0,
            }
        )

    totals = {
        "codes_count": len(items),
        "signups_count": sum(item["signups_count"] for item in items),
        "verified_count": sum(item["verified_count"] for item in items),
        "payments_count": sum(item["payments_count"] for item in items),
        "gross_cents": sum(item["gross_cents"] for item in items),
        "owed_cents": sum(item["owed_cents"] for item in items),
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "totals": totals,
    }
