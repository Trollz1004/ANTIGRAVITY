"""Revenue allocation ledger for completed platform payments."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RevenueAllocation

CHARITABLE_ALLOCATION_PERCENT = 10
DEFAULT_BENEFICIARY_LANE = "kids_support"


def calculate_charitable_amount_cents(
    gross_amount_cents: int,
    percent: int = CHARITABLE_ALLOCATION_PERCENT,
) -> int:
    """Return a no-less-than percentage allocation, rounded up to whole cents."""
    if gross_amount_cents <= 0:
        return 0
    return (gross_amount_cents * percent + 99) // 100


async def reserve_revenue_allocation(
    db: AsyncSession,
    *,
    user_id: UUID | None,
    source_event_id: str,
    square_payment_id: str,
    payment_tier: str | None,
    gross_amount_cents: int | None,
) -> RevenueAllocation | None:
    """Create the internal 10% allocation record for a completed Square payment."""
    amount = int(gross_amount_cents or 0)
    if amount <= 0 or not source_event_id or not square_payment_id:
        return None

    existing = await db.scalar(
        select(RevenueAllocation).where(
            or_(
                RevenueAllocation.source_event_id == source_event_id,
                RevenueAllocation.square_payment_id == square_payment_id,
            )
        )
    )
    if existing:
        return existing

    charitable_amount = calculate_charitable_amount_cents(amount)
    allocation = RevenueAllocation(
        user_id=user_id,
        source_event_id=source_event_id,
        square_payment_id=square_payment_id,
        payment_tier=payment_tier or "unknown",
        gross_amount_cents=amount,
        charitable_amount_cents=charitable_amount,
        operating_amount_cents=amount - charitable_amount,
        charitable_percent=CHARITABLE_ALLOCATION_PERCENT,
        beneficiary_lane=DEFAULT_BENEFICIARY_LANE,
        status="reserved",
    )
    db.add(allocation)
    return allocation
