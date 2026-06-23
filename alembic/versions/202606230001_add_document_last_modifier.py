"""add document last modifier

Revision ID: 202606230001
Revises: 202606190002
Create Date: 2026-06-23 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202606230001"
down_revision: str | None = "202606190002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table_name in ("books", "patterns"):
        op.add_column(
            table_name,
            sa.Column("last_modified_by", postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            f"fk_{table_name}_last_modified_by_users",
            table_name,
            "users",
            ["last_modified_by"],
            ["id"],
        )


def downgrade() -> None:
    for table_name in ("patterns", "books"):
        op.drop_constraint(
            f"fk_{table_name}_last_modified_by_users",
            table_name,
            type_="foreignkey",
        )
        op.drop_column(table_name, "last_modified_by")
