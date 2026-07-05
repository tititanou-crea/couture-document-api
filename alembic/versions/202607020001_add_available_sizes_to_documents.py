"""add available sizes to documents

Revision ID: 202607020001
Revises: 202606230001
Create Date: 2026-07-02 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202607020001"
down_revision: str | None = "202606230001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table_name in ("books", "patterns"):
        op.add_column(
            table_name,
            sa.Column(
                "available_sizes",
                postgresql.ARRAY(sa.String(length=40)),
                server_default="{}",
                nullable=False,
            ),
        )
        op.alter_column(table_name, "available_sizes", server_default=None)


def downgrade() -> None:
    for table_name in ("patterns", "books"):
        op.drop_column(table_name, "available_sizes")
