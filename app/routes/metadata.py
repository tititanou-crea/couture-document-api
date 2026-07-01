from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.session import get_db_session
from app.repositories.book_repository import BookRepository
from app.repositories.pattern_repository import PatternRepository
from app.schemas.book import normalize_ean, normalize_isbn
from app.schemas.metadata import (
    MetadataLookupRequest,
    MetadataLookupResponse,
    PatternPhotoMetadataRequest,
    PatternPhotoMetadataResponse,
    PhotoMetadataRequest,
    PhotoMetadataResponse,
)
from app.services.metadata_lookup_cache import get_cached_metadata, set_cached_metadata
from app.services.photo_metadata_service import (
    PhotoMetadataError,
    extract_book_metadata_from_photos,
    extract_pattern_metadata_from_photo,
)

router = APIRouter(prefix="/metadata", tags=["Metadata"])
NO_METADATA = object()


@router.post(
    "",
    response_model=MetadataLookupResponse,
    response_model_by_alias=True,
    response_model_exclude_none=True,
    responses={204: {"description": "No metadata found"}},
)
async def lookup_metadata(
    payload: MetadataLookupRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MetadataLookupResponse | Response:
    cache_key = metadata_cache_key(payload)
    cached = get_cached_metadata(cache_key)
    if cached is NO_METADATA:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    if isinstance(cached, MetadataLookupResponse):
        return cached

    repository = BookRepository(session)
    if payload.type in {"livre", "book"} and payload.isbn:
        metadata = await repository.get_book_metadata_by_isbn(normalize_isbn(payload.isbn))
        if metadata is not None:
            set_cached_metadata(cache_key, metadata)
            return metadata

    if payload.type == "magazine":
        metadata = None
        if payload.ean:
            metadata = await repository.get_magazine_metadata_by_ean(normalize_ean(payload.ean))
        elif payload.title and metadata_issue_number(payload):
            metadata = await repository.get_magazine_metadata_by_title_and_issue(
                title=payload.title,
                issue=metadata_issue_number(payload),
            )
        if metadata is not None:
            set_cached_metadata(cache_key, metadata)
            return metadata

    if payload.type in {"patron", "pattern"}:
        pattern_repository = PatternRepository(session)
        metadata = None
        if payload.model_name:
            metadata = await pattern_repository.get_pattern_metadata_by_name(
                model_name=payload.model_name,
                designer_name=payload.designer_name,
            )
        elif payload.title:
            metadata = await pattern_repository.search_pattern_metadata(
                query=payload.title,
                designer_name=payload.designer_name,
            )
        if metadata is not None:
            set_cached_metadata(cache_key, metadata)
            return metadata

    set_cached_metadata(cache_key, NO_METADATA)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def metadata_cache_key(payload: MetadataLookupRequest) -> str:
    return "|".join(
        [
            payload.type,
            normalize_isbn(payload.isbn) if payload.isbn else "",
            normalize_ean(payload.ean) if payload.ean else "",
            payload.title.strip().casefold() if payload.title else "",
            payload.model_name.strip().casefold() if payload.model_name else "",
            payload.designer_name.strip().casefold() if payload.designer_name else "",
            metadata_issue_number(payload).strip().casefold()
            if metadata_issue_number(payload)
            else "",
        ]
    )


def metadata_issue_number(payload: MetadataLookupRequest) -> str | None:
    return payload.issue_number or payload.date_numero


@router.post(
    "/extract-from-photos",
    response_model=PhotoMetadataResponse,
    response_model_by_alias=True,
    response_model_exclude_none=True,
    dependencies=[Depends(get_current_user)],
)
async def extract_metadata_from_photos(
    payload: PhotoMetadataRequest,
) -> PhotoMetadataResponse:
    try:
        return await extract_book_metadata_from_photos(
            cover_photo=payload.cover_photo,
            back_photo=payload.back_photo,
        )
    except PhotoMetadataError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post(
    "/extract-pattern-from-photo",
    response_model=PatternPhotoMetadataResponse,
    response_model_by_alias=True,
    response_model_exclude_none=True,
    dependencies=[Depends(get_current_user)],
)
async def extract_pattern_metadata_from_photo_route(
    payload: PatternPhotoMetadataRequest,
) -> PatternPhotoMetadataResponse:
    try:
        return await extract_pattern_metadata_from_photo(photo=payload.photo)
    except PhotoMetadataError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
