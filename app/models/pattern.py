from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import (
    DifficultyLevel,
    MainCategory,
    PatternFormat,
    ProjectType,
    TargetAudience,
)
from app.db.enum_types import EnumList
from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, ValidationWorkflowMixin


class Pattern(UUIDPrimaryKeyMixin, TimestampMixin, ValidationWorkflowMixin, Base):
    __tablename__ = "patterns"

    model_name: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    designer_name: Mapped[str | None] = mapped_column(String(180), index=True, nullable=True)
    format: Mapped[PatternFormat | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
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
