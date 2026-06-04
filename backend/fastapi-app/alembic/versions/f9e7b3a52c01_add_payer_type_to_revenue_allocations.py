"""add payer_type to revenue_allocations + backfill founder-test transactions

Distinguishes founder-test payments (Joshua's own flow tests with DB clears
between runs) from real customer revenue so dashboards can show two figures:
gross-with-test (full audit trail) vs gross customer-only (the number that
actually moves the mission).

Backfill list verified 2026-05-27 via Square Connect API at location
LY5GN09F5AN83. Six COMPLETED payments (one FAILED at 2026-05-02 02:24 is
not in revenue_allocations because failed payments don't create ledger rows).

Revision ID: f9e7b3a52c01
Revises: e8f2a1c9d440
Create Date: 2026-05-27 13:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "f9e7b3a52c01"
down_revision: Union[str, None] = "e8f2a1c9d440"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Square payment IDs verified 2026-05-27 as founder-test transactions
# (Joshua's flow-testing with email DB clears between runs, all source_type=CARD).
FOUNDER_TEST_PAYMENT_IDS = (
    "rl8uAtocbU3d",  # 2026-05-02 $14.99 Founding Member
    "Bm9VgaV7qgJY",  # 2026-04-10 $1.00 Bot-Shield
    "j9gx4ngnmVlV",  # 2026-04-10 $1.00 Bot-Shield
    "39jrNE8LkBqS",  # 2026-04-10 $1.00 Bot-Shield
    "1w1bJLQ8BLzu",  # 2026-03-10 $1.00 Bot-Shield
    "9kBDU7FkAroz",  # 2026-03-05 $1.00 Bot-Shield
)


def upgrade() -> None:
    # Add payer_type column. Default "customer" so any new payment is treated
    # as customer revenue unless explicitly marked otherwise.
    op.add_column(
        "revenue_allocations",
        sa.Column(
            "payer_type",
            sa.String(length=20),
            nullable=False,
            server_default="customer",
        ),
    )
    op.create_index(
        "ix_revenue_allocations_payer_type",
        "revenue_allocations",
        ["payer_type"],
    )

    # Backfill the 6 known founder-test transactions if they already exist
    # in the ledger. If they haven't been reconciled yet (allocations=[] as
    # of 2026-05-27), this UPDATE is a no-op and the next reconcile pass
    # will insert them with payer_type="founder_test" via the reconcile
    # endpoint logic, which checks this list at insert time.
    placeholders = ", ".join(f":pid{i}" for i in range(len(FOUNDER_TEST_PAYMENT_IDS)))
    params = {f"pid{i}": pid for i, pid in enumerate(FOUNDER_TEST_PAYMENT_IDS)}
    op.execute(
        sa.text(
            f"UPDATE revenue_allocations "
            f"SET payer_type = 'founder_test' "
            f"WHERE square_payment_id IN ({placeholders})"
        ).bindparams(**params)
    )


def downgrade() -> None:
    op.drop_index("ix_revenue_allocations_payer_type", table_name="revenue_allocations")
    op.drop_column("revenue_allocations", "payer_type")
