"""Revenue allocation ledger for completed platform payments."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RevenueAllocation

CHARITABLE_ALLOCATION_PERCENT = 10
DEFAULT_BENEFICIARY_LANE = "kids_support"

# Square payment IDs verified 2026-05-27 via Square Connect API (location
# LY5GN09F5AN83) as founder-test transactions — Joshua's own flow tests with
# email DB clears between runs, all source_type=CARD. These are NOT customer
# revenue and must never inflate the kids-mission earmark or the LLC's
# customer-only operating share. Real customer revenue starts at the first
# payment NOT in this list.
FOUNDER_TEST_PAYMENT_IDS = frozenset(
    {
        "rl8uAtocbU3d",  # 2026-05-02 $14.99 Founding Member
        "Bm9VgaV7qgJY",  # 2026-04-10 $1.00 Bot-Shield
        "j9gx4ngnmVlV",  # 2026-04-10 $1.00 Bot-Shield
        "39jrNE8LkBqS",  # 2026-04-10 $1.00 Bot-Shield
        "1w1bJLQ8BLzu",  # 2026-03-10 $1.00 Bot-Shield
        "9kBDU7FkAroz",  # 2026-03-05 $1.00 Bot-Shield
    }
)


def classify_payer_type(square_payment_id: str) -> str:
    """Return 'founder_test' for known test payment IDs, 'customer' otherwise.

    Real customer revenue defaults to 'customer'. Dashboards can sum
    payer_type='customer' to get the kids-moving number and payer_type IN
    ('customer','founder_test') to get the full audit number.
    """
    if not square_payment_id:
        return "customer"
    if square_payment_id in FOUNDER_TEST_PAYMENT_IDS:
        return "founder_test"
    return "customer"


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
    payer_type: str | None = None,
) -> RevenueAllocation | None:
    """Create the internal 10% allocation record for a completed Square payment.

    payer_type defaults to founder-test classification by square_payment_id
    lookup; explicit override (e.g. from a reconcile endpoint that's already
    decided) is honored.
    """
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

    resolved_payer_type = payer_type or classify_payer_type(square_payment_id)

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
        payer_type=resolved_payer_type,
    )
    db.add(allocation)
    return allocation
