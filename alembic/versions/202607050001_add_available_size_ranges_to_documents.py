"""add available size ranges to documents

Revision ID: 202607050001
Revises: 202607020001
Create Date: 2026-07-05 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202607050001"
down_revision: str | None = "202607020001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table_name in ("books", "patterns"):
        op.add_column(
            table_name,
            sa.Column(
                "available_size_ranges",
                postgresql.ARRAY(sa.String(length=40)),
                server_default="{}",
                nullable=False,
            ),
        )
        op.alter_column(table_name, "available_size_ranges", server_default=None)


def downgrade() -> None:
    for table_name in ("patterns", "books"):
        op.drop_column(table_name, "available_size_ranges")
