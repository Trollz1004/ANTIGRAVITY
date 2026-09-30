"""add referral_code to users

Revision ID: a1b2c3d4e5f6
Revises: 20260730_marketing_content
Create Date: 2026-09-30 09:05:00.000000

The register route already read ``payload.referral_code`` and the growth
engine already accepted ``referred_by``, but the column did not exist on
``users``. This adds it so influencer attribution survives registration.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "20260730_marketing_content"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("referral_code", sa.String(64), nullable=True))
    op.create_index("ix_users_referral_code", "users", ["referral_code"])


def downgrade() -> None:
    op.drop_index("ix_users_referral_code", table_name="users")
    op.drop_column("users", "referral_code")
