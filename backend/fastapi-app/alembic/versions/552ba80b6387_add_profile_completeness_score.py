"""add_profile_completeness_score

Revision ID: 552ba80b6387
Revises: 20260628_tracked_marketing_links
Create Date: 2026-07-12 02:25:57.158147

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '552ba80b6387'
down_revision: Union[str, None] = '20260628_tracked_marketing_links'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column(
            "profile_completeness_score",
            sa.Float(),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
    )
    op.add_column(
        "support_tickets",
        sa.Column(
            "profile_completeness_score",
            sa.Float(),
            server_default=sa.text("0.0"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("support_tickets", "profile_completeness_score")
    op.drop_column("profiles", "profile_completeness_score")
