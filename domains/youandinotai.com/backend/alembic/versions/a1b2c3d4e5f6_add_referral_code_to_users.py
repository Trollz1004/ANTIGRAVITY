"""add referral_code to users

Revision ID: a1b2c3d4e5f6
Revises: 20260730_marketing_content
Create Date: 2026-09-30 09:05:00.000000

The register route already read ``payload.referral_code`` and the growth
engine already accepted ``referred_by``, but the column did not exist on
``users``. This adds it so influencer attribution survives registration.

This migration is guarded to be idempotent, matching
``app.database.reconcile_legacy_schema()``. Startup reconciliation backfills
this same column on every boot, so a manual ``alembic upgrade head`` against an
already-reconciled database would otherwise die on

    OperationalError: duplicate column name: referral_code

which was reproduced while auditing the deploy order. Deploy itself runs
alembic BEFORE uvicorn (see the Dockerfile CMD), so the normal path is
alembic-first and never hits that; the guard protects the manual-run case.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "20260730_marketing_content"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_users_referral_code"
COLUMN_NAME = "referral_code"
TABLE = "users"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME not in columns:
        op.add_column(TABLE, sa.Column(COLUMN_NAME, sa.String(64), nullable=True))

    indexes = {i["name"] for i in inspector.get_indexes(TABLE)}
    if INDEX_NAME not in indexes:
        op.create_index(INDEX_NAME, TABLE, [COLUMN_NAME])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    indexes = {i["name"] for i in inspector.get_indexes(TABLE)}
    if INDEX_NAME in indexes:
        op.drop_index(INDEX_NAME, table_name=TABLE)

    columns = {c["name"] for c in inspector.get_columns(TABLE)}
    if COLUMN_NAME in columns:
        op.drop_column(TABLE, COLUMN_NAME)
