"""add magazine fields to books

Revision ID: 202605280001
Revises: 202606130001
Create Date: 2026-05-28 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202605280001"
down_revision: str | None = "202606130001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "books",
        sa.Column("document_type", sa.String(length=20), server_default="book", nullable=False),
    )
    op.add_column("books", sa.Column("ean", sa.String(length=14), nullable=True))
    op.add_column("books", sa.Column("issue_number", sa.String(length=80), nullable=True))
    op.create_index(op.f("ix_books_ean"), "books", ["ean"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_books_ean"), table_name="books")
    op.drop_column("books", "issue_number")
    op.drop_column("books", "ean")
    op.drop_column("books", "document_type")
