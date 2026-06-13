"""create patterns table

Revision ID: 202606130001
Revises: 202605230002
Create Date: 2026-06-13 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202606130001"
down_revision: str | None = "202605230002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

document_status = postgresql.ENUM(
    "draft", "pending_validation", "validated", name="document_status", create_type=False
)
difficulty_level = postgresql.ENUM(
    "beginner", "intermediate", "advanced", name="difficulty_level", create_type=False
)
target_audience = postgresql.ENUM(
    "women", "men", "children", "baby", "plus_size", name="target_audience", create_type=False
)
main_category = postgresql.ENUM(
    "clothing",
    "accessories",
    "technique",
    "patternmaking",
    "embroidery",
    "patchwork",
    "upcycling",
    "alterations",
    name="main_category",
    create_type=False,
)
project_type = postgresql.ENUM(
    "dress",
    "skirt",
    "top",
    "pants",
    "jacket",
    "coat",
    "bag",
    "pouch",
    "hair_accessories",
    "textile_decoration",
    name="project_type",
    create_type=False,
)


def upgrade() -> None:
    op.create_table(
        "patterns",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("model_name", sa.String(length=255), nullable=True),
        sa.Column("designer_name", sa.String(length=180), nullable=True),
        sa.Column("format", sa.String(length=20), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.String(length=2048), nullable=True),
        sa.Column(
            "difficulty_levels",
            postgresql.ARRAY(difficulty_level),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "target_audiences",
            postgresql.ARRAY(target_audience),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "main_categories", postgresql.ARRAY(main_category), server_default="{}", nullable=False
        ),
        sa.Column(
            "project_types",
            postgresql.ARRAY(project_type),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "status",
            document_status,
            server_default="draft",
            nullable=False,
        ),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_patterns_created_by_users"),
        sa.ForeignKeyConstraint(
            ["validated_by"], ["users.id"], name="fk_patterns_validated_by_users"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_patterns_model_name"), "patterns", ["model_name"], unique=False)
    op.create_index(op.f("ix_patterns_designer_name"), "patterns", ["designer_name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_patterns_designer_name"), table_name="patterns")
    op.drop_index(op.f("ix_patterns_model_name"), table_name="patterns")
    op.drop_table("patterns")
