from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.session import get_db_session
from app.repositories.book_repository import BookRepository
from app.schemas.book import normalize_isbn
from app.schemas.metadata import (
    MetadataLookupRequest,
    MetadataLookupResponse,
    PatternPhotoMetadataRequest,
    PatternPhotoMetadataResponse,
    PhotoMetadataRequest,
    PhotoMetadataResponse,
)
from app.services.photo_metadata_service import (
    PhotoMetadataError,
    extract_book_metadata_from_photos,
    extract_pattern_metadata_from_photo,
)

router = APIRouter(prefix="/metadata", tags=["Metadata"])


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
    if payload.type in {"livre", "book"} and payload.isbn:
        book = await BookRepository(session).get_by_isbn(normalize_isbn(payload.isbn))
        if book is not None:
            return MetadataLookupResponse(
                title=book.title,
                authors=book.authors,
                publisher=book.publisher,
                description=book.description,
                cover_url=book.cover_url,
            )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
