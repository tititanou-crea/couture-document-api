"""add second pattern photo

Revision ID: 202606190002
Revises: 202606190001
Create Date: 2026-06-19 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202606190002"
down_revision: str | None = "202606190001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "patterns",
        sa.Column("second_cover_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("patterns", "second_cover_url")
