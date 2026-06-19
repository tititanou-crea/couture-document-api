import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import DocumentStatus
from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models.book import Book
from app.models.pattern import Pattern
from app.repositories.book_repository import BookRepository
from app.schemas.book import (
    BookBase,
    BookCreate,
    BookUpdate,
    MagazinePatternCreate,
    PaginatedBooks,
)


def _to_model_values(
    payload: BookCreate | BookUpdate, *, exclude_unset: bool = False
) -> dict[str, object]:
    values = payload.model_dump(exclude_unset=exclude_unset, exclude={"magazine_patterns"})
    for url_field in ("cover_url", "pattern_sheet_url", "pattern_sheet_second_url"):
        if values.get(url_field) is not None:
            values[url_field] = str(values[url_field])
    return values


class BookService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = BookRepository(session)

    async def list_books(self, *, limit: int, offset: int) -> PaginatedBooks:
        books, total = await self.repository.list(limit=limit, offset=offset)
        return PaginatedBooks(items=books, total=total, limit=limit, offset=offset)

    async def get_book(self, book_id: uuid.UUID) -> Book:
        book = await self.repository.get(book_id)
        if book is None:
            raise ResourceNotFoundError("Livre introuvable")
        return book

    async def create_book(self, payload: BookCreate) -> Book:
        if payload.isbn is not None:
            existing = await self.repository.get_by_isbn(payload.isbn)
        else:
            existing = None
        if existing is not None:
            raise ConflictError("Un livre avec cet ISBN existe deja")
        if payload.ean is not None:
            existing = await self.repository.get_by_ean(payload.ean)
            if existing is not None:
                raise ConflictError("Un document avec cet EAN existe deja")

        values = _to_model_values(payload)
        if values.get("status") == DocumentStatus.VALIDATED and values.get("validated_at") is None:
            values["validated_at"] = datetime.now(UTC)

        book = Book(**values)
        try:
            created = await self.repository.create(book)
            await self._create_magazine_patterns(created, payload.magazine_patterns)
            await self.session.refresh(created, ["patterns"])
            await self.session.commit()
            return created
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError("Impossible de creer ce livre") from exc

    async def update_book(self, book_id: uuid.UUID, payload: BookUpdate) -> Book:
        book = await self.get_book(book_id)
        values = _to_model_values(payload, exclude_unset=True)

        if "isbn" in values and values["isbn"] != book.isbn:
            existing = await self.repository.get_by_isbn(str(values["isbn"]))
            if existing is not None:
                raise ConflictError("Un livre avec cet ISBN existe deja")
        if "ean" in values and values["ean"] != book.ean:
            existing = await self.repository.get_by_ean(str(values["ean"]))
            if existing is not None:
                raise ConflictError("Un document avec cet EAN existe deja")

        self._validate_book_after_update(book, values)
        if values.get("status") == DocumentStatus.VALIDATED and values.get("validated_at") is None:
            values["validated_at"] = datetime.now(UTC)

        try:
            updated = await self.repository.update(book, values)
            await self._create_magazine_patterns(updated, payload.magazine_patterns)
            await self.session.refresh(updated, ["patterns"])
            await self.session.commit()
            return updated
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError("Impossible de modifier ce livre") from exc

    async def delete_book(self, book_id: uuid.UUID) -> None:
        book = await self.get_book(book_id)
        await self.repository.delete(book)
        await self.session.commit()

    async def search_books(self, *, query: str, limit: int, offset: int) -> PaginatedBooks:
        books, total = await self.repository.search(query=query, limit=limit, offset=offset)
        return PaginatedBooks(items=books, total=total, limit=limit, offset=offset)

    def _validate_book_after_update(self, book: Book, values: dict[str, object]) -> None:
        merged = {
            "document_type": book.document_type,
            "isbn": book.isbn,
            "ean": book.ean,
            "issue_number": book.issue_number,
            "title": book.title,
            "subtitle": book.subtitle,
            "description": book.description,
            "authors": book.authors,
            "publisher": book.publisher,
            "published_date": book.published_date,
            "page_count": book.page_count,
            "language": book.language,
            "cover_url": book.cover_url,
            "categories": book.categories,
            "tags": book.tags,
            "difficulty_levels": book.difficulty_levels,
            "target_audiences": book.target_audiences,
            "main_categories": book.main_categories,
            "project_types": book.project_types,
            "techniques": book.techniques,
            "includes_patterns": book.includes_patterns,
            "pattern_sheet_url": book.pattern_sheet_url,
            "pattern_sheet_second_url": book.pattern_sheet_second_url,
            "status": book.status,
            "created_by": book.created_by,
            "validated_by": book.validated_by,
            "validated_at": book.validated_at,
        }
        merged.update(values)
        BookBase.model_validate(merged)

    async def _create_magazine_patterns(
        self, book: Book, pattern_payloads: list[MagazinePatternCreate]
    ) -> None:
        if book.document_type != "magazine" or not pattern_payloads:
            return

        fallback_designer = book.title or book.publisher
        for pattern_payload in pattern_payloads:
            pattern_values = pattern_payload.model_dump()
            if pattern_values.get("cover_url") is not None:
                pattern_values["cover_url"] = str(pattern_values["cover_url"])
            if pattern_values.get("designer_name") is None and fallback_designer:
                pattern_values["designer_name"] = fallback_designer
            if pattern_values.get("cover_url") is None:
                pattern_values["cover_url"] = (
                    book.pattern_sheet_url or book.pattern_sheet_second_url
                )
            pattern_values["source_magazine_id"] = book.id
            pattern_values["status"] = book.status
            pattern_values["created_by"] = book.created_by
            pattern = Pattern(**pattern_values)
            self.session.add(pattern)
        await self.session.flush()
