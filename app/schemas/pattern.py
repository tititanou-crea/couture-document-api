import uuid
from datetime import UTC, datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.enums import (
    DifficultyLevel,
    DocumentStatus,
    MainCategory,
    PatternFormat,
    ProjectType,
    TargetAudience,
)


class PatternBase(BaseModel):
    model_name: str | None = Field(default=None, min_length=1, max_length=255)
    designer_name: str | None = Field(default=None, min_length=1, max_length=180)
    format: PatternFormat | None = None
    description: str | None = Field(default=None, max_length=2000)
    cover_url: AnyHttpUrl | None = None
    difficulty_levels: list[DifficultyLevel] = Field(default_factory=list)
    target_audiences: list[TargetAudience] = Field(default_factory=list)
    main_categories: list[MainCategory] = Field(default_factory=list)
    project_types: list[ProjectType] = Field(default_factory=list)
    status: DocumentStatus = DocumentStatus.DRAFT
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None

    @field_validator("main_categories")
    @classmethod
    def reject_technique_category(cls, values: list[MainCategory]) -> list[MainCategory]:
        if MainCategory.TECHNIQUE in values:
            raise ValueError("La categorie technique n'est pas disponible pour les patrons")
        return values

    @model_validator(mode="after")
    def validate_required_fields_for_review(self) -> "PatternBase":
        if self.status is DocumentStatus.DRAFT:
            return self

        missing_fields = []
        if not self.model_name:
            missing_fields.append("model_name")
        if not self.designer_name:
            missing_fields.append("designer_name")
        if not self.format:
            missing_fields.append("format")
        if not self.description:
            missing_fields.append("description")
        if not self.cover_url:
            missing_fields.append("cover_url")
        if missing_fields:
            raise ValueError(
                "Les champs suivants sont requis hors brouillon : "
                + ", ".join(missing_fields)
            )
        return self


class PatternCreate(PatternBase):
    pass


class PatternUpdate(BaseModel):
    model_name: str | None = Field(default=None, min_length=1, max_length=255)
    designer_name: str | None = Field(default=None, min_length=1, max_length=180)
    format: PatternFormat | None = None
    description: str | None = Field(default=None, max_length=2000)
    cover_url: AnyHttpUrl | None = None
    difficulty_levels: list[DifficultyLevel] | None = None
    target_audiences: list[TargetAudience] | None = None
    main_categories: list[MainCategory] | None = None
    project_types: list[ProjectType] | None = None
    status: DocumentStatus | None = None
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None

    @field_validator("main_categories")
    @classmethod
    def reject_optional_technique_category(
        cls, values: list[MainCategory] | None
    ) -> list[MainCategory] | None:
        if values is not None and MainCategory.TECHNIQUE in values:
            raise ValueError("La categorie technique n'est pas disponible pour les patrons")
        return values


class PatternRead(PatternBase):
    id: uuid.UUID
    cover_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedPatterns(BaseModel):
    items: list[PatternRead]
    total: int
    limit: int
    offset: int


def pattern_values_for_model(
    payload: PatternCreate | PatternUpdate, *, exclude_unset: bool = False
) -> dict[str, object]:
    values = payload.model_dump(exclude_unset=exclude_unset)
    if values.get("cover_url") is not None:
        values["cover_url"] = str(values["cover_url"])
    if values.get("status") == DocumentStatus.VALIDATED and values.get("validated_at") is None:
        values["validated_at"] = datetime.now(UTC)
    return values
