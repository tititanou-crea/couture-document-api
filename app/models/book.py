from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import (
    DifficultyLevel,
    DocumentType,
    MainCategory,
    ProjectType,
    TargetAudience,
    Technique,
)
from app.db.enum_types import EnumList
from app.db.session import Base
from app.db.types import StringList
from app.models.mixins import BaseDocumentMixin, ValidationWorkflowMixin

if TYPE_CHECKING:
    from app.models.pattern import Pattern


class Book(BaseDocumentMixin, ValidationWorkflowMixin, Base):
    __tablename__ = "books"

    document_type: Mapped[DocumentType] = mapped_column(
        String(20),
        nullable=False,
        default=DocumentType.BOOK,
        server_default=DocumentType.BOOK.value,
    )
    isbn: Mapped[str | None] = mapped_column(String(17), unique=True, index=True, nullable=True)
    ean: Mapped[str | None] = mapped_column(String(14), unique=True, index=True, nullable=True)
    issue_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    authors: Mapped[list[str]] = mapped_column(StringList(160), nullable=False, default=list)
    publisher: Mapped[str | None] = mapped_column(String(180), nullable=True)
    published_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
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
    techniques: Mapped[list[str]] = mapped_column(
        EnumList(Technique, "technique"), nullable=False, default=list
    )
    includes_patterns: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    pattern_sheet_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    patterns: Mapped[list[Pattern]] = relationship(
        back_populates="source_magazine",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
