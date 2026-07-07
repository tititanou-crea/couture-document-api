import re
import uuid
from datetime import date, datetime

from pydantic import (
    AliasChoices,
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.core.enums import (
    DifficultyLevel,
    DocumentStatus,
    DocumentType,
    MainCategory,
    PatternFormat,
    ProjectType,
    TargetAudience,
    Technique,
)

ISBN_PATTERN = re.compile(r"^(?:97[89][-\s]?)?\d[-\s]?\d{2,5}[-\s]?\d{2,7}[-\s]?[\dX]$", re.I)
EAN_PATTERN = re.compile(r"^[0-9][0-9\-\s]{6,16}[0-9]$")


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


def normalize_ean(value: str) -> str:
    return re.sub(r"[\s-]", "", value)


def is_valid_ean(value: str) -> bool:
    normalized = normalize_ean(value)
    if len(normalized) not in {8, 13} or not normalized.isdigit():
        return False

    digits = [int(char) for char in normalized]
    check_digit = digits[-1]
    payload = digits[:-1]
    if len(normalized) == 8:
        weights = [3, 1, 3, 1, 3, 1, 3]
    else:
        weights = [1, 3] * 6
    total = sum(digit * weight for digit, weight in zip(payload, weights, strict=True))
    return (10 - (total % 10)) % 10 == check_digit


def _clean_string_list(values: list[str]) -> list[str]:
    cleaned = [value.strip() for value in values if value.strip()]
    return list(dict.fromkeys(cleaned))


class BookBase(BaseModel):
    document_type: DocumentType = Field(
        default=DocumentType.BOOK,
        validation_alias=AliasChoices("document_type", "type"),
    )
    isbn: str | None = Field(default=None, min_length=10, max_length=17, examples=["9782842218232"])
    ean: str | None = Field(default=None, min_length=8, max_length=17, examples=["3781479505405"])
    issue_number: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    authors: list[str] = Field(default_factory=list)
    publisher: str | None = Field(default=None, max_length=180)
    published_date: date | None = None
    page_count: int | None = Field(default=None, ge=1)
    language: str = Field(default="fr", min_length=2, max_length=12)
    cover_url: AnyHttpUrl | None = None
    measurement_chart_url: AnyHttpUrl | None = None
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    difficulty_levels: list[DifficultyLevel] = Field(default_factory=list)
    target_audiences: list[TargetAudience] = Field(default_factory=list)
    main_categories: list[MainCategory] = Field(default_factory=list)
    project_types: list[ProjectType] = Field(default_factory=list)
    techniques: list[Technique] = Field(default_factory=list)
    available_sizes: list[str] = Field(default_factory=list)
    available_size_ranges: list[str] = Field(default_factory=list)
    includes_patterns: bool | None = None
    pattern_sheet_url: AnyHttpUrl | None = None
    pattern_sheet_second_url: AnyHttpUrl | None = None
    status: DocumentStatus = DocumentStatus.DRAFT
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None

    @field_validator("document_type", mode="before")
    @classmethod
    def normalize_document_type(cls, value: str | DocumentType) -> str | DocumentType:
        if value == "livre":
            return DocumentType.BOOK
        return value

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not ISBN_PATTERN.match(value) or not is_valid_isbn(value):
            raise ValueError("ISBN invalide")
        return normalize_isbn(value)

    @field_validator("ean")
    @classmethod
    def validate_ean(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not EAN_PATTERN.match(value) or not is_valid_ean(value):
            raise ValueError("EAN invalide")
        return normalize_ean(value)

    @field_validator(
        "authors",
        "categories",
        "tags",
        "available_sizes",
        "available_size_ranges",
    )
    @classmethod
    def normalize_string_list(cls, values: list[str]) -> list[str]:
        return _clean_string_list(values)

    @model_validator(mode="after")
    def validate_required_fields_for_review(self) -> "BookBase":
        if self.status is DocumentStatus.DRAFT:
            return self

        missing_fields = []
        if self.document_type is DocumentType.BOOK and not self.isbn:
            missing_fields.append("isbn")
        if not self.title:
            missing_fields.append("title")
        if self.document_type is DocumentType.BOOK and not self.authors:
            missing_fields.append("authors")
        if (
            self.document_type is DocumentType.MAGAZINE
            and not self.ean
            and not self.issue_number
            and not self.published_date
        ):
            missing_fields.append("ean, issue_number ou published_date")
        if missing_fields:
            raise ValueError(
                "Les champs suivants sont requis hors brouillon : "
                + ", ".join(missing_fields)
            )
        return self


class MagazinePatternCreate(BaseModel):
    model_name: str | None = Field(default=None, min_length=1, max_length=255)
    designer_name: str | None = Field(default=None, min_length=1, max_length=180)
    format: PatternFormat | None = PatternFormat.PHYSICAL
    description: str | None = Field(default=None, max_length=2000)
    cover_url: AnyHttpUrl | None = None
    second_cover_url: AnyHttpUrl | None = None
    measurement_chart_url: AnyHttpUrl | None = None
    magazine_pattern_identifier: str | None = Field(default=None, max_length=80)
    difficulty_levels: list[DifficultyLevel] = Field(default_factory=list)
    target_audiences: list[TargetAudience] = Field(default_factory=list)
    main_categories: list[MainCategory] = Field(default_factory=list)
    project_types: list[ProjectType] = Field(default_factory=list)
    available_sizes: list[str] = Field(default_factory=list)
    available_size_ranges: list[str] = Field(default_factory=list)

    @field_validator("main_categories")
    @classmethod
    def reject_technique_category(cls, values: list[MainCategory]) -> list[MainCategory]:
        if MainCategory.TECHNIQUE in values:
            raise ValueError("La categorie technique n'est pas disponible pour les patrons")
        return values


class BookCreate(BookBase):
    magazine_patterns: list[MagazinePatternCreate] = Field(default_factory=list)


class BookUpdate(BaseModel):
    document_type: DocumentType | None = Field(
        default=None,
        validation_alias=AliasChoices("document_type", "type"),
    )
    isbn: str | None = Field(default=None, min_length=10, max_length=17)
    ean: str | None = Field(default=None, min_length=8, max_length=17)
    issue_number: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subtitle: str | None = Field(default=None, max_length=255)
    description: str | None = None
    authors: list[str] | None = None
    publisher: str | None = Field(default=None, max_length=180)
    published_date: date | None = None
    page_count: int | None = Field(default=None, ge=1)
    language: str | None = Field(default=None, min_length=2, max_length=12)
    cover_url: AnyHttpUrl | None = None
    measurement_chart_url: AnyHttpUrl | None = None
    categories: list[str] | None = None
    tags: list[str] | None = None
    difficulty_levels: list[DifficultyLevel] | None = None
    target_audiences: list[TargetAudience] | None = None
    main_categories: list[MainCategory] | None = None
    project_types: list[ProjectType] | None = None
    techniques: list[Technique] | None = None
    available_sizes: list[str] | None = None
    available_size_ranges: list[str] | None = None
    includes_patterns: bool | None = None
    pattern_sheet_url: AnyHttpUrl | None = None
    pattern_sheet_second_url: AnyHttpUrl | None = None
    status: DocumentStatus | None = None
    created_by: uuid.UUID | None = None
    validated_by: uuid.UUID | None = None
    validated_at: datetime | None = None
    magazine_patterns: list[MagazinePatternCreate] = Field(default_factory=list)

    @field_validator("document_type", mode="before")
    @classmethod
    def normalize_optional_document_type(
        cls, value: str | DocumentType | None
    ) -> str | DocumentType | None:
        if value == "livre":
            return DocumentType.BOOK
        return value

    @field_validator("isbn")
    @classmethod
    def validate_optional_isbn(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not ISBN_PATTERN.match(value) or not is_valid_isbn(value):
            raise ValueError("ISBN invalide")
        return normalize_isbn(value)

    @field_validator("ean")
    @classmethod
    def validate_optional_ean(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not EAN_PATTERN.match(value) or not is_valid_ean(value):
            raise ValueError("EAN invalide")
        return normalize_ean(value)

    @field_validator(
        "authors",
        "categories",
        "tags",
        "available_sizes",
        "available_size_ranges",
    )
    @classmethod
    def normalize_optional_string_list(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return values
        return _clean_string_list(values)


class BookPatternSummary(BaseModel):
    id: uuid.UUID
    model_name: str | None = None
    designer_name: str | None = None
    magazine_pattern_identifier: str | None = None
    cover_url: str | None = None
    second_cover_url: str | None = None
    measurement_chart_url: str | None = None
    available_sizes: list[str] = Field(default_factory=list)
    available_size_ranges: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DocumentContributor(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class BookRead(BookBase):
    id: uuid.UUID
    cover_url: str | None = None
    measurement_chart_url: str | None = None
    pattern_sheet_url: str | None = None
    pattern_sheet_second_url: str | None = None
    patterns: list[BookPatternSummary] = Field(default_factory=list)
    creator: DocumentContributor | None = None
    last_modifier: DocumentContributor | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedBooks(BaseModel):
    items: list[BookRead]
    total: int
    limit: int
    offset: int
