from __future__ import annotations

import uuid

from sqlalchemy import Select, String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book
from app.models.pattern import Pattern


class PatternRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(self, *, limit: int, offset: int) -> tuple[list[Pattern], int]:
        total = await self._count(select(Pattern))
        result = await self.session.execute(
            select(Pattern)
            .options(selectinload(Pattern.source_magazine))
            .order_by(Pattern.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def get(self, pattern_id: uuid.UUID) -> Pattern | None:
        result = await self.session.execute(
            select(Pattern)
            .options(selectinload(Pattern.source_magazine))
            .where(Pattern.id == pattern_id)
        )
        return result.scalar_one_or_none()

    async def create(self, pattern: Pattern) -> Pattern:
        self.session.add(pattern)
        await self.session.flush()
        await self.session.refresh(pattern)
        return pattern

    async def update(self, pattern: Pattern, values: dict[str, object]) -> Pattern:
        for key, value in values.items():
            setattr(pattern, key, value)
        await self.session.flush()
        await self.session.refresh(pattern)
        return pattern

    async def delete(self, pattern: Pattern) -> None:
        await self.session.delete(pattern)
        await self.session.flush()

    async def search(self, *, query: str, limit: int, offset: int) -> tuple[list[Pattern], int]:
        pattern = f"%{query.lower()}%"
        main_categories_text = self._text_from_list_column(Pattern.main_categories)
        project_types_text = self._text_from_list_column(Pattern.project_types)
        statement = select(Pattern).where(
            or_(
                func.lower(Pattern.model_name).like(pattern),
                func.lower(Pattern.designer_name).like(pattern),
                func.lower(Pattern.format).like(pattern),
                func.lower(Pattern.description).like(pattern),
                func.lower(Pattern.magazine_pattern_identifier).like(pattern),
                func.lower(main_categories_text).like(pattern),
                func.lower(project_types_text).like(pattern),
                Pattern.source_magazine.has(func.lower(Book.title).like(pattern)),
                Pattern.source_magazine.has(func.lower(Book.issue_number).like(pattern)),
            )
        )
        total = await self._count(statement)
        result = await self.session.execute(
            statement.options(selectinload(Pattern.source_magazine))
            .order_by(Pattern.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def _count(self, statement: Select[tuple[Pattern]]) -> int:
        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        result = await self.session.execute(count_statement)
        return int(result.scalar_one())

    def _text_from_list_column(self, column: object) -> object:
        bind = self.session.get_bind()
        if bind.dialect.name == "postgresql":
            return func.array_to_string(column, " ")
        return cast(column, String)
