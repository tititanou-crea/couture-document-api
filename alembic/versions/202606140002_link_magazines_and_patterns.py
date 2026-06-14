"""link magazines and patterns

Revision ID: 202606140002
Revises: 202606140001
Create Date: 2026-06-14 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202606140002"
down_revision: str | None = "202606140001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("books", sa.Column("pattern_sheet_url", sa.String(length=2048), nullable=True))
    op.add_column(
        "patterns", sa.Column("magazine_pattern_identifier", sa.String(length=80), nullable=True)
    )
    op.add_column(
        "patterns", sa.Column("source_magazine_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_index(
        op.f("ix_patterns_source_magazine_id"), "patterns", ["source_magazine_id"], unique=False
    )
    op.create_foreign_key(
        "fk_patterns_source_magazine_id_books",
        "patterns",
        "books",
        ["source_magazine_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_patterns_source_magazine_id_books", "patterns", type_="foreignkey")
    op.drop_index(op.f("ix_patterns_source_magazine_id"), table_name="patterns")
    op.drop_column("patterns", "source_magazine_id")
    op.drop_column("patterns", "magazine_pattern_identifier")
    op.drop_column("books", "pattern_sheet_url")
