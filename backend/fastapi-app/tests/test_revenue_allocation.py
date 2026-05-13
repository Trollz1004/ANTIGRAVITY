from uuid import uuid4

import pytest
from sqlalchemy import select

from app.models import RevenueAllocation
from app.revenue_allocation import (
    calculate_charitable_amount_cents,
    reserve_revenue_allocation,
)


def test_calculate_charitable_amount_cents():
    # 10% of 100 is 10
    assert calculate_charitable_amount_cents(100) == 10
    # 10% of 1000 is 100
    assert calculate_charitable_amount_cents(1000) == 100
    # 10% of 1 is 1 (rounded up)
    assert calculate_charitable_amount_cents(1) == 1
    # 0 or negative
    assert calculate_charitable_amount_cents(0) == 0
    assert calculate_charitable_amount_cents(-100) == 0
    # Custom percent
    assert calculate_charitable_amount_cents(100, 20) == 20


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_success(db_session_factory):
    async with db_session_factory() as db:
        user_id = uuid4()
        source_event_id = "evt_test_123"
        square_payment_id = "pay_test_456"

        allocation = await reserve_revenue_allocation(
            db,
            user_id=user_id,
            source_event_id=source_event_id,
            square_payment_id=square_payment_id,
            payment_tier="bot_shield",
            gross_amount_cents=100,
        )
        await db.commit()

        assert allocation is not None
        assert allocation.charitable_amount_cents == 10
        assert allocation.operating_amount_cents == 90
        assert allocation.status == "reserved"

        # Verify persistence
        result = await db.scalar(
            select(RevenueAllocation).where(
                RevenueAllocation.source_event_id == source_event_id
            )
        )
        assert result is not None
        assert result.id == allocation.id


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_duplicate(db_session_factory):
    async with db_session_factory() as db:
        source_event_id = "evt_dup"
        square_payment_id = "pay_dup"

        # First call
        first = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id=source_event_id,
            square_payment_id=square_payment_id,
            payment_tier="test",
            gross_amount_cents=100,
        )
        await db.commit()

        # Second call with same event_id
        second = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id=source_event_id,
            square_payment_id="pay_different",
            payment_tier="test",
            gross_amount_cents=100,
        )

        assert second.id == first.id


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_invalid_inputs(db_session_factory):
    async with db_session_factory() as db:
        # Zero amount
        res = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id="e",
            square_payment_id="p",
            payment_tier="t",
            gross_amount_cents=0,
        )
        assert res is None

        # Missing event_id
        res = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id="",
            square_payment_id="p",
            payment_tier="t",
            gross_amount_cents=100,
        )
        assert res is None
