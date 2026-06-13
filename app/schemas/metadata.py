from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import (
    DifficultyLevel,
    MainCategory,
    PatternFormat,
    ProjectType,
    TargetAudience,
)


class MetadataLookupRequest(BaseModel):
    type: Literal["livre", "book", "magazine"]
    isbn: str | None = None
    ean: str | None = None
    title: str | None = None
    date_numero: str | None = Field(default=None, alias="dateNumero")

    model_config = ConfigDict(populate_by_name=True)


class MetadataLookupResponse(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    authors: list[str] = Field(default_factory=list)
    publisher: str | None = None
    isbn: str | None = None
    published_year: str | None = Field(default=None, alias="publishedYear")
    page_count: int | None = Field(default=None, alias="pageCount")
    description: str | None = None
    cover_url: str | None = Field(default=None, alias="coverUrl")
    extracted_text: str | None = Field(default=None, alias="extractedText")
    confidence: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PhotoMetadataResponse(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    authors: list[str] = Field(default_factory=list)
    publisher: str | None = None
    isbn: str | None = None
    published_year: str | None = Field(default=None, alias="publishedYear")
    page_count: int | None = Field(default=None, alias="pageCount")
    description: str | None = None
    extracted_text: str | None = Field(default=None, alias="extractedText")
    confidence: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PatternPhotoMetadataResponse(BaseModel):
    model_name: str | None = Field(default=None, alias="modelName")
    designer_name: str | None = Field(default=None, alias="designerName")
    format: PatternFormat | None = None
    description: str | None = None
    difficulty_levels: list[DifficultyLevel] = Field(
        default_factory=list, alias="difficultyLevels"
    )
    target_audiences: list[TargetAudience] = Field(default_factory=list, alias="targetAudiences")
    main_categories: list[MainCategory] = Field(default_factory=list, alias="mainCategories")
    project_types: list[ProjectType] = Field(default_factory=list, alias="projectTypes")
    extracted_text: str | None = Field(default=None, alias="extractedText")
    confidence: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PhotoMetadataImage(BaseModel):
    data_url: str = Field(alias="dataUrl")

    model_config = ConfigDict(populate_by_name=True)


class PhotoMetadataRequest(BaseModel):
    cover_photo: PhotoMetadataImage | None = Field(default=None, alias="coverPhoto")
    back_photo: PhotoMetadataImage | None = Field(default=None, alias="backPhoto")

    model_config = ConfigDict(populate_by_name=True)


class PatternPhotoMetadataRequest(BaseModel):
    photo: PhotoMetadataImage

    model_config = ConfigDict(populate_by_name=True)
