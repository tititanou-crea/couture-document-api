from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import (
    DifficultyLevel,
    MainCategory,
    PatternFormat,
    ProjectType,
    TargetAudience,
)
from app.db.enum_types import EnumList
from app.db.session import Base
from app.db.types import StringList
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, ValidationWorkflowMixin

if TYPE_CHECKING:
    from app.models.book import Book


class Pattern(UUIDPrimaryKeyMixin, TimestampMixin, ValidationWorkflowMixin, Base):
    __tablename__ = "patterns"

    model_name: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    designer_name: Mapped[str | None] = mapped_column(String(180), index=True, nullable=True)
    format: Mapped[PatternFormat | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    second_cover_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    magazine_pattern_identifier: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source_magazine_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), index=True, nullable=True
    )
    source_magazine: Mapped[Book | None] = relationship(back_populates="patterns")
    difficulty_levels: Mapped[list[str]] = mapped_column(
        EnumList(DifficultyLevel, "difficulty_level"), nullable=False, default=list
    )
    target_audiences: Mapped[list[str]] = mapped_column(
        EnumList(TargetAudience, "target_audience"), nullable=False, default=list
    )
    main_categories: Mapped[list[str]] = mapped_column(
        EnumList(MainCategory, "main_category"), nullable=False, default=list
    )
    project_types: Mapped[list[str]] = mapped_column(
        EnumList(ProjectType, "project_type"), nullable=False, default=list
    )
    available_sizes: Mapped[list[str]] = mapped_column(
        StringList(40), nullable=False, default=list
    )
