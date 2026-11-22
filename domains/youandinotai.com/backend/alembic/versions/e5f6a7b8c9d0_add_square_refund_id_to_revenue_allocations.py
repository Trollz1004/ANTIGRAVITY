"""add square_refund_id to revenue_allocations

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-11-20 22:10:00.000000

Adds the nullable ``square_refund_id`` (VARCHAR(255)) column to
``revenue_allocations`` so refunded payment allocations store the
Square refund identifier alongside ``verification_events``.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMN_NAME = "square_refund_id"
TABLE = "revenue_allocations"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME not in columns:
        op.add_column(TABLE, sa.Column(COLUMN_NAME, sa.String(255), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME in columns:
        op.drop_column(TABLE, COLUMN_NAME)
