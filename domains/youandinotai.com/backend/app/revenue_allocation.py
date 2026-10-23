"""Revenue ledger for completed platform payments."""

from __future__ import annotations

from typing import Dict, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.allocation_compat import ACCOUNTING_LANE_DEFAULT
from app.models import RevenueAllocation
from app.revenue_streams import RevenueStreamConfig

PLATFORM_RESERVE_PERCENT = 0
DEFAULT_ACCOUNTING_LANE = ACCOUNTING_LANE_DEFAULT

# Square payment IDs verified 2026-05-27 via Square Connect API (location
# LY5GN09F5AN83) as founder-test transactions — Joshua's own flow tests with
# email DB clears between runs, all source_type=CARD. These are kept separate
# from real customer revenue in reports.
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

# Two of the three outside payments on record (the third, receipt T14t on
# 2026-02-17 from a buyer Joshua does not know, stays 'customer'): two $1.00 Bot-Shield charges on
# 2026-09-17 evening Eastern (2026-09-18 UTC) from Heather, a friend Joshua asked
# to be the first customer (receipts v1nS, b3FM; docs/PAYMENTS-TRUTH.md). They
# are a real third-party card, so they are NOT founder tests, but they are not
# market demand either, so they get their own payer_type and stay out of
# customer_only until an independent buyer pays. Entries are the first twelve
# characters of the Square payment id; matching is by prefix.
FRIEND_FIRST_CUSTOMER_PAYMENT_IDS = frozenset(
    {
        "v1nSPYaBISd9",  # 2026-09-17 10:00 PM ET $1.00 Bot-Shield (receipt v1nS)
        "b3FMag1CSoyz",  # 2026-09-17 10:08 PM ET $1.00 Bot-Shield (receipt b3FM)
    }
)


# Mapping of revenue streams to internal product buckets for tracking.
REVENUE_STREAM_TO_BUCKET_MAPPING: Dict[str, int] = {
    "Security Cleanup": 1,
    "Agentic Workflows": 2,
    "Storefront Deployment": 5,  # Digital Storefront Accelerator → AI-Solutions Store (bucket 5)
    "Tech Debt Cleanup": 7,
    "API Management": 8,
}


def _matches_known_id(square_payment_id: str, known: frozenset) -> bool:
    """True when the id equals, or starts with, any entry in ``known``."""
    return any(square_payment_id.startswith(entry) for entry in known)


def classify_payer_type(square_payment_id: str) -> str:
    """Return 'founder_test', 'friend_first' or 'customer'.

    'founder_test' is a known test payment of Joshua's. 'friend_first' is one of
    the two charges from the friend who was the first outside customer (a real
    third-party card, never counted as independent demand). Anything else
    defaults to 'customer'. Dashboards sum payer_type='customer' for customer
    revenue and show the other two separately.
    """
    if not square_payment_id:
        return "customer"
    if _matches_known_id(square_payment_id, FOUNDER_TEST_PAYMENT_IDS):
        return "founder_test"
    if _matches_known_id(square_payment_id, FRIEND_FIRST_CUSTOMER_PAYMENT_IDS):
        return "friend_first"
    return "customer"


def calculate_platform_reserve_cents(
    gross_amount_cents: int,
    percent: int = PLATFORM_RESERVE_PERCENT,
) -> int:
    """Return an internal reserve amount, rounded up to whole cents."""
    if gross_amount_cents <= 0:
        return 0
    return (gross_amount_cents * percent + 99) // 100


def calculate_stream_allocation(
    gross_amount_cents: int,
    stream_name: str,
    stream_config: Optional[RevenueStreamConfig] = None,
) -> Dict[str, float]:
    """Calculate allocation breakdown for a specific revenue stream."""
    if gross_amount_cents <= 0:
        return {
            "platform_reserve": 0.0,
            "operating": 0.0,
            "setup_fee": 0.0,
            "recurring_fee": 0.0,
            "transaction_fee": 0.0,
            "sprint_fee": 0.0,
        }

    reserve_amount_cents = calculate_platform_reserve_cents(gross_amount_cents)
    operating_amount_cents = gross_amount_cents - reserve_amount_cents

    result = {
        "platform_reserve": reserve_amount_cents / 100.0,
        "operating": operating_amount_cents / 100.0,
        "setup_fee": 0.0,
        "recurring_fee": 0.0,
        "transaction_fee": 0.0,
        "sprint_fee": 0.0,
    }

    # Add stream-specific allocations
    if stream_config:
        if stream_config.setup_fee_usd:
            # Pro-rata allocation of setup fee (amount is in dollars)
            result["setup_fee"] = stream_config.setup_fee_usd

        if stream_config.monthly_recurring_usd:
            # Pro-rata allocation of recurring fee
            result["recurring_fee"] = stream_config.monthly_recurring_usd

        if (
            stream_config.transaction_fee_percent
            and stream_config.transaction_fee_percent > 0
        ):
            # Transaction fee allocation (e.g., 3% for storefront)
            result["transaction_fee"] = (
                gross_amount_cents * stream_config.transaction_fee_percent
            ) / 10000.0

        if stream_config.sprint_cost_usd:
            # Sprint fee allocation (for Tech Debt Cleanup)
            result["sprint_fee"] = stream_config.sprint_cost_usd

    return result


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
    """Create the internal ledger record for a completed Square payment.

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

    reserve_amount = calculate_platform_reserve_cents(amount)
    allocation = RevenueAllocation(
        user_id=user_id,
        source_event_id=source_event_id,
        square_payment_id=square_payment_id,
        payment_tier=payment_tier or "unknown",
        gross_amount_cents=amount,
        reserve_amount_cents=reserve_amount,
        operating_amount_cents=amount - reserve_amount,
        reserve_percent=PLATFORM_RESERVE_PERCENT,
        accounting_lane=DEFAULT_ACCOUNTING_LANE,
        status="reserved",
        payer_type=resolved_payer_type,
    )
    db.add(allocation)
    return allocation
