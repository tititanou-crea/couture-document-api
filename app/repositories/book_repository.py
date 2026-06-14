from __future__ import annotations

import uuid

from sqlalchemy import Select, String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book
from app.models.pattern import Pattern


class BookRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self, *, limit: int, offset: int) -> tuple[list[Book], int]:
        total = await self._count(select(Book))
        result = await self.session.execute(
            select(Book)
            .options(selectinload(Book.patterns))
            .order_by(Book.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def get(self, book_id: uuid.UUID) -> Book | None:
        result = await self.session.execute(
            select(Book).options(selectinload(Book.patterns)).where(Book.id == book_id)
        )
        return result.scalar_one_or_none()

    async def get_by_isbn(self, isbn: str) -> Book | None:
        result = await self.session.execute(select(Book).where(Book.isbn == isbn))
        return result.scalar_one_or_none()

    async def get_by_ean(self, ean: str) -> Book | None:
        result = await self.session.execute(select(Book).where(Book.ean == ean))
        return result.scalar_one_or_none()

    async def get_magazine_by_title_and_issue(self, *, title: str, issue: str) -> Book | None:
        result = await self.session.execute(
            select(Book).where(
                Book.document_type == "magazine",
                func.lower(Book.title) == title.lower(),
                func.lower(Book.issue_number) == issue.lower(),
            )
        )
        return result.scalar_one_or_none()

    async def create(self, book: Book) -> Book:
        self.session.add(book)
        await self.session.flush()
        await self.session.refresh(book)
        return book

    async def update(self, book: Book, values: dict[str, object]) -> Book:
        for key, value in values.items():
            setattr(book, key, value)
        await self.session.flush()
        await self.session.refresh(book)
        return book

    async def delete(self, book: Book) -> None:
        await self.session.delete(book)
        await self.session.flush()

    async def search(self, *, query: str, limit: int, offset: int) -> tuple[list[Book], int]:
        pattern = f"%{query.lower()}%"
        authors_text = self._text_from_list_column(Book.authors)
        tags_text = self._text_from_list_column(Book.tags)
        categories_text = self._text_from_list_column(Book.categories)
        main_categories_text = self._text_from_list_column(Book.main_categories)
        project_types_text = self._text_from_list_column(Book.project_types)
        techniques_text = self._text_from_list_column(Book.techniques)
        statement = select(Book).where(
            or_(
                func.lower(Book.document_type).like(pattern),
                func.lower(Book.isbn).like(pattern),
                func.lower(Book.ean).like(pattern),
                func.lower(Book.issue_number).like(pattern),
                func.lower(Book.title).like(pattern),
                func.lower(Book.publisher).like(pattern),
                func.lower(Book.pattern_sheet_url).like(pattern),
                func.lower(authors_text).like(pattern),
                func.lower(tags_text).like(pattern),
                func.lower(categories_text).like(pattern),
                func.lower(main_categories_text).like(pattern),
                func.lower(project_types_text).like(pattern),
                func.lower(techniques_text).like(pattern),
                Book.patterns.any(func.lower(Pattern.model_name).like(pattern)),
                Book.patterns.any(func.lower(Pattern.magazine_pattern_identifier).like(pattern)),
            )
        )
        total = await self._count(statement)
        result = await self.session.execute(
            statement.options(selectinload(Book.patterns))
            .order_by(Book.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def _count(self, statement: Select[tuple[Book]]) -> int:
        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        result = await self.session.execute(count_statement)
        return int(result.scalar_one())

    def _text_from_list_column(self, column: object) -> object:
        bind = self.session.get_bind()
        if bind.dialect.name == "postgresql":
            return func.array_to_string(column, " ")
        return cast(column, String)
