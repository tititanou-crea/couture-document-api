"""add document workflow users and book taxonomy

Revision ID: 202605230002
Revises: 202605230001
Create Date: 2026-05-23 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "202605230002"
down_revision: str | None = "202605230001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

document_status = postgresql.ENUM(
    "draft", "pending_validation", "validated", name="document_status", create_type=False
)
user_role = postgresql.ENUM("admin", "volunteer", name="user_role", create_type=False)
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
technique = postgresql.ENUM(
    "jersey",
    "serger",
    "embroidery",
    "patchwork",
    "alterations",
    "patternmaking",
    name="technique",
    create_type=False,
)


def upgrade() -> None:
    _create_enum("document_status", ["draft", "pending_validation", "validated"])
    _create_enum("user_role", ["admin", "volunteer"])
    _create_enum("difficulty_level", ["beginner", "intermediate", "advanced"])
    _create_enum("target_audience", ["women", "men", "children", "baby", "plus_size"])
    _create_enum(
        "main_category",
        [
            "clothing",
            "accessories",
            "technique",
            "patternmaking",
            "embroidery",
            "patchwork",
            "upcycling",
            "alterations",
        ],
    )
    _create_enum(
        "project_type",
        [
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
        ],
    )
    _create_enum(
        "technique",
        ["jersey", "serger", "embroidery", "patchwork", "alterations", "patternmaking"],
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.alter_column("books", "isbn", existing_type=sa.String(length=17), nullable=True)
    op.alter_column("books", "title", existing_type=sa.String(length=255), nullable=True)
    op.add_column(
        "books",
        sa.Column(
            "difficulty_levels",
            postgresql.ARRAY(difficulty_level),
            server_default="{}",
            nullable=False,
        ),
    )
    op.add_column(
        "books",
        sa.Column(
            "target_audiences",
            postgresql.ARRAY(target_audience),
            server_default="{}",
            nullable=False,
        ),
    )
    op.add_column(
        "books",
        sa.Column(
            "main_categories", postgresql.ARRAY(main_category), server_default="{}", nullable=False
        ),
    )
    op.add_column(
        "books",
        sa.Column(
            "project_types",
            postgresql.ARRAY(project_type),
            server_default="{}",
            nullable=False,
        ),
    )
    op.add_column(
        "books",
        sa.Column("techniques", postgresql.ARRAY(technique), server_default="{}", nullable=False),
    )
    op.add_column("books", sa.Column("includes_patterns", sa.Boolean(), nullable=True))
    op.add_column(
        "books",
        sa.Column("status", document_status, server_default="draft", nullable=False),
    )
    op.add_column("books", sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("books", sa.Column("validated_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("books", sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_books_created_by_users", "books", "users", ["created_by"], ["id"])
    op.create_foreign_key("fk_books_validated_by_users", "books", "users", ["validated_by"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_books_validated_by_users", "books", type_="foreignkey")
    op.drop_constraint("fk_books_created_by_users", "books", type_="foreignkey")
    op.drop_column("books", "validated_at")
    op.drop_column("books", "validated_by")
    op.drop_column("books", "created_by")
    op.drop_column("books", "status")
    op.drop_column("books", "includes_patterns")
    op.drop_column("books", "techniques")
    op.drop_column("books", "project_types")
    op.drop_column("books", "main_categories")
    op.drop_column("books", "target_audiences")
    op.drop_column("books", "difficulty_levels")
    op.alter_column("books", "title", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("books", "isbn", existing_type=sa.String(length=17), nullable=False)

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    for enum_name in (
        "technique",
        "project_type",
        "main_category",
        "target_audience",
        "difficulty_level",
        "user_role",
        "document_status",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")


def _create_enum(name: str, values: list[str]) -> None:
    enum_values = ", ".join(f"'{value}'" for value in values)
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN
                CREATE TYPE {name} AS ENUM ({enum_values});
            END IF;
        END
        $$;
        """
    )
