import re
import uuid
from datetime import date, datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.enums import (
    DifficultyLevel,
    DocumentStatus,
    MainCategory,
    ProjectType,
    TargetAudience,
    Technique,
)

ISBN_PATTERN = re.compile(r"^(?:97[89][-\s]?)?\d[-\s]?\d{2,5}[-\s]?\d{2,7}[-\s]?[\dX]$", re.I)


def normalize_isbn(value: str) -> str:
    return value.replace("-", "").replace(" ", "").upper()


def is_valid_isbn(value: str) -> bool:
    normalized = normalize_isbn(value)
    if len(normalized) == 10:
        total = 0
        for index, char in enumerate(normalized):
            digit = 10 if char == "X" and index == 9 else int(char) if char.isdigit() else -1
            if digit < 0:
                return False
            total += digit * (10 - index)
        return total % 11 == 0

    if len(normalized) == 13 and normalized.isdigit():
        total = sum(
            (1 if index % 2 == 0 else 3) * int(char)
            for index, char in enumerate(normalized)
        )
        return total % 10 == 0

    return False


def _clean_string_list(values: list[str]) -> list[str]:
    cleaned = [value.strip() for value in values if value.strip()]
    return list(dict.fromkeys(cleaned))


class BookBase(BaseModel):
    isbn: str | None = Field(default=None, min_length=10, max_length=17, examples=["9782842218232"])
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    authors: list[str] = Field(default_factory=list)
    publisher: str | None = Field(default=None, max_length=180)
    published_date: date | None = None
    page_count: int | None = Field(default=None, ge=1)
    language: str = Field(default="fr", min_length=2, max_length=12)
    cover_url: AnyHttpUrl | None = None
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    difficulty_levels: list[DifficultyLevel] = Field(default_factory=list)
    target_audiences: list[TargetAudience] = Field(default_factory=list)
    main_categories: list[MainCategory] = Field(default_factory=list)
    project_types: list[ProjectType] = Field(default_factory=list)
    techniques: list[Technique] = Field(default_factory=list)
    includes_patterns: bool | None = None
    status: DocumentStatus = DocumentStatus.DRAFT
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not ISBN_PATTERN.match(value) or not is_valid_isbn(value):
            raise ValueError("ISBN invalide")
        return normalize_isbn(value)

    @field_validator("authors", "categories", "tags")
    @classmethod
    def normalize_string_list(cls, values: list[str]) -> list[str]:
        return _clean_string_list(values)

    @model_validator(mode="after")
    def validate_required_fields_for_review(self) -> "BookBase":
        if self.status is DocumentStatus.DRAFT:
            return self

        missing_fields = []
        if not self.isbn:
            missing_fields.append("isbn")
        if not self.title:
            missing_fields.append("title")
        if not self.authors:
            missing_fields.append("authors")
        if missing_fields:
            raise ValueError(
                "Les champs suivants sont requis hors brouillon : "
                + ", ".join(missing_fields)
            )
        return self


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: str | None = Field(default=None, min_length=10, max_length=17)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    authors: list[str] | None = None
    publisher: str | None = Field(default=None, max_length=180)
    published_date: date | None = None
    page_count: int | None = Field(default=None, ge=1)
    language: str | None = Field(default=None, min_length=2, max_length=12)
    cover_url: AnyHttpUrl | None = None
    categories: list[str] | None = None
    tags: list[str] | None = None
    difficulty_levels: list[DifficultyLevel] | None = None
    target_audiences: list[TargetAudience] | None = None
    main_categories: list[MainCategory] | None = None
    project_types: list[ProjectType] | None = None
    techniques: list[Technique] | None = None
    includes_patterns: bool | None = None
    status: DocumentStatus | None = None
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None

    @field_validator("isbn")
    @classmethod
    def validate_optional_isbn(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not ISBN_PATTERN.match(value) or not is_valid_isbn(value):
            raise ValueError("ISBN invalide")
        return normalize_isbn(value)

    @field_validator("authors", "categories", "tags")
    @classmethod
    def normalize_optional_string_list(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return values
        return _clean_string_list(values)


class BookRead(BookBase):
    id: uuid.UUID
    cover_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedBooks(BaseModel):
    items: list[BookRead]
    total: int
    limit: int
    offset: int

