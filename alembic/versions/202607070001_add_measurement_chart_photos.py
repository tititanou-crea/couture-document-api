"""add measurement chart photos

Revision ID: 202607070001
Revises: 202607050001
Create Date: 2026-07-07 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "202607070001"
down_revision: str | None = "202607050001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "books", sa.Column("measurement_chart_url", sa.String(length=2048), nullable=True)
    )
    op.add_column(
        "patterns", sa.Column("measurement_chart_url", sa.String(length=2048), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("patterns", "measurement_chart_url")
    op.drop_column("books", "measurement_chart_url")
