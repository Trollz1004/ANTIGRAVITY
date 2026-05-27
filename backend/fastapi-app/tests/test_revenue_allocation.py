from uuid import uuid4

import pytest
from sqlalchemy import select

from app.models import RevenueAllocation
from app.revenue_allocation import (
    FOUNDER_TEST_PAYMENT_IDS,
    calculate_charitable_amount_cents,
    classify_payer_type,
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


def test_classify_payer_type_known_founder_test():
    # Sanity: every ID in the constant maps to founder_test
    assert FOUNDER_TEST_PAYMENT_IDS  # not empty
    for pid in FOUNDER_TEST_PAYMENT_IDS:
        assert classify_payer_type(pid) == "founder_test"


def test_classify_payer_type_defaults_to_customer():
    assert classify_payer_type("pay_some_real_customer_id_not_in_list") == "customer"
    assert classify_payer_type("") == "customer"


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_founder_test_classification(
    db_session_factory,
):
    """A known founder-test Square payment ID auto-classifies as founder_test."""
    known_test_id = next(iter(FOUNDER_TEST_PAYMENT_IDS))
    async with db_session_factory() as db:
        allocation = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id="evt_classify_founder_test",
            square_payment_id=known_test_id,
            payment_tier="bot_shield",
            gross_amount_cents=100,
        )
        await db.commit()
        assert allocation is not None
        assert allocation.payer_type == "founder_test"


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_customer_default(db_session_factory):
    """Unknown payment IDs classify as customer revenue."""
    async with db_session_factory() as db:
        allocation = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id="evt_classify_real_customer",
            square_payment_id="pay_real_customer_001",
            payment_tier="founding_member",
            gross_amount_cents=1499,
        )
        await db.commit()
        assert allocation is not None
        assert allocation.payer_type == "customer"


@pytest.mark.asyncio
async def test_reserve_revenue_allocation_explicit_payer_type_override(
    db_session_factory,
):
    """Explicit payer_type override (e.g. from reconcile) is honored."""
    async with db_session_factory() as db:
        allocation = await reserve_revenue_allocation(
            db,
            user_id=None,
            source_event_id="evt_explicit_override",
            square_payment_id="pay_explicit_override",
            payment_tier="test",
            gross_amount_cents=100,
            payer_type="founder_test",
        )
        await db.commit()
        assert allocation is not None
        assert allocation.payer_type == "founder_test"


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
