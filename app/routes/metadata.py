from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.book_repository import BookRepository
from app.schemas.book import normalize_isbn
from app.schemas.metadata import MetadataLookupRequest, MetadataLookupResponse

router = APIRouter(prefix="/metadata", tags=["Metadata"])


@router.post(
    "",
    response_model=MetadataLookupResponse,
    response_model_by_alias=True,
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
