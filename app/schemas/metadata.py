from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MetadataLookupRequest(BaseModel):
    type: Literal["livre", "book", "magazine"]
    isbn: str | None = None
    ean: str | None = None
    title: str | None = None
    date_numero: str | None = Field(default=None, alias="dateNumero")

    model_config = ConfigDict(populate_by_name=True)


class MetadataLookupResponse(BaseModel):
    title: str | None = None
    authors: list[str] = Field(default_factory=list)
    publisher: str | None = None
    description: str | None = None
    cover_url: str | None = Field(default=None, alias="coverUrl")

    model_config = ConfigDict(populate_by_name=True)
