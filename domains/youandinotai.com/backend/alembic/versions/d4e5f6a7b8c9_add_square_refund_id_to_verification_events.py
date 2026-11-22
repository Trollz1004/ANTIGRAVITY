"""add square_refund_id to verification_events

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-11-20 18:50:00.000000

Adds the nullable ``square_refund_id`` (VARCHAR(255)) column to
``verification_events`` so refunded Bot-Shield payment events store the
Square refund identifier.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMN_NAME = "square_refund_id"
TABLE = "verification_events"


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
