import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.session import get_db_session
from app.schemas.book import BookCreate, BookRead, BookUpdate, PaginatedBooks
from app.services.book_service import BookService

router = APIRouter(prefix="/books", tags=["Books"], dependencies=[Depends(get_current_user)])


async def get_book_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BookService:
    return BookService(session)


@router.get("", response_model=PaginatedBooks)
async def list_books(
    service: Annotated[BookService, Depends(get_book_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedBooks:
    return await service.list_books(limit=limit, offset=offset)


@router.get("/search", response_model=PaginatedBooks)
async def search_books(
    service: Annotated[BookService, Depends(get_book_service)],
    q: Annotated[str, Query(min_length=1, max_length=120)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedBooks:
    return await service.search_books(query=q, limit=limit, offset=offset)


@router.get("/{book_id}", response_model=BookRead)
async def get_book(
    book_id: uuid.UUID,
    service: Annotated[BookService, Depends(get_book_service)],
) -> BookRead:
    return await service.get_book(book_id)


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreate,
    service: Annotated[BookService, Depends(get_book_service)],
) -> BookRead:
    return await service.create_book(payload)


@router.put("/{book_id}", response_model=BookRead)
async def update_book(
    book_id: uuid.UUID,
    payload: BookUpdate,
    service: Annotated[BookService, Depends(get_book_service)],
) -> BookRead:
    return await service.update_book(book_id, payload)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: uuid.UUID,
    service: Annotated[BookService, Depends(get_book_service)],
) -> None:
    await service.delete_book(book_id)
