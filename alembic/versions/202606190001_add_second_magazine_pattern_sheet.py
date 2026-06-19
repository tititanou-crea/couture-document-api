"""add second magazine pattern sheet

Revision ID: 202606190001
Revises: 202606140002
Create Date: 2026-06-19 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202606190001"
down_revision: str | None = "202606140002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "books",
        sa.Column("pattern_sheet_second_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("books", "pattern_sheet_second_url")
