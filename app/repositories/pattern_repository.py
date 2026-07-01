from __future__ import annotations

import uuid

from sqlalchemy import Select, String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book
from app.models.pattern import Pattern
from app.repositories.search_terms import expand_search_terms
from app.schemas.metadata import MetadataLookupResponse, MetadataPatternSummary


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
        search_patterns = [f"%{term}%" for term in expand_search_terms(query)]
        difficulty_levels_text = self._text_from_list_column(Pattern.difficulty_levels)
        target_audiences_text = self._text_from_list_column(Pattern.target_audiences)
        main_categories_text = self._text_from_list_column(Pattern.main_categories)
        project_types_text = self._text_from_list_column(Pattern.project_types)
        statement = select(Pattern).where(
            or_(
                *self._like_any(Pattern.model_name, search_patterns),
                *self._like_any(Pattern.designer_name, search_patterns),
                *self._like_any(Pattern.format, search_patterns),
                *self._like_any(Pattern.description, search_patterns),
                *self._like_any(Pattern.second_cover_url, search_patterns),
                *self._like_any(Pattern.magazine_pattern_identifier, search_patterns),
                *self._like_any(difficulty_levels_text, search_patterns),
                *self._like_any(target_audiences_text, search_patterns),
                *self._like_any(main_categories_text, search_patterns),
                *self._like_any(project_types_text, search_patterns),
                *[
                    Pattern.source_magazine.has(func.lower(Book.title).like(pattern))
                    for pattern in search_patterns
                ],
                *[
                    Pattern.source_magazine.has(func.lower(Book.subtitle).like(pattern))
                    for pattern in search_patterns
                ],
                *[
                    Pattern.source_magazine.has(func.lower(Book.description).like(pattern))
                    for pattern in search_patterns
                ],
                *[
                    Pattern.source_magazine.has(func.lower(Book.issue_number).like(pattern))
                    for pattern in search_patterns
                ],
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

    async def get_pattern_metadata_by_name(
        self, *, model_name: str, designer_name: str | None = None
    ) -> MetadataLookupResponse | None:
        statement = (
            select(Pattern)
            .options(selectinload(Pattern.source_magazine))
            .where(func.lower(Pattern.model_name) == model_name.lower())
            .limit(1)
        )
        if designer_name:
            statement = statement.where(func.lower(Pattern.designer_name) == designer_name.lower())

        result = await self.session.execute(statement)
        pattern = result.scalar_one_or_none()
        if pattern is None:
            return None
        return self._metadata_from_pattern(pattern)

    async def search_pattern_metadata(
        self, *, query: str, designer_name: str | None = None
    ) -> MetadataLookupResponse | None:
        search_patterns = [f"%{term}%" for term in expand_search_terms(query)]
        statement = (
            select(Pattern)
            .options(selectinload(Pattern.source_magazine))
            .where(
                or_(
                    *self._like_any(Pattern.model_name, search_patterns),
                    *self._like_any(Pattern.description, search_patterns),
                    *[
                        Pattern.source_magazine.has(func.lower(Book.title).like(pattern))
                        for pattern in search_patterns
                    ],
                )
            )
            .order_by(Pattern.updated_at.desc())
            .limit(1)
        )
        if designer_name:
            statement = statement.where(func.lower(Pattern.designer_name) == designer_name.lower())

        result = await self.session.execute(statement)
        pattern = result.scalar_one_or_none()
        if pattern is None:
            return None
        return self._metadata_from_pattern(pattern)

    def _metadata_from_pattern(self, pattern: Pattern) -> MetadataLookupResponse:
        summary = MetadataPatternSummary.model_validate(pattern, from_attributes=True)
        source_magazine = pattern.source_magazine
        return MetadataLookupResponse(
            title=pattern.model_name,
            authors=[pattern.designer_name] if pattern.designer_name else [],
            publisher=source_magazine.publisher if source_magazine else None,
            ean=source_magazine.ean if source_magazine else None,
            issue_number=source_magazine.issue_number if source_magazine else None,
            published_year=(
                str(source_magazine.published_date.year)
                if source_magazine and source_magazine.published_date
                else None
            ),
            page_count=source_magazine.page_count if source_magazine else None,
            description=pattern.description,
            cover_url=pattern.cover_url,
            difficulty_levels=pattern.difficulty_levels,
            target_audiences=pattern.target_audiences,
            main_categories=pattern.main_categories,
            project_types=pattern.project_types,
            includes_patterns=True,
            patterns=[summary],
        )

    async def _count(self, statement: Select[tuple[Pattern]]) -> int:
        count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        result = await self.session.execute(count_statement)
        return int(result.scalar_one())

    def _text_from_list_column(self, column: object) -> object:
        bind = self.session.get_bind()
        if bind.dialect.name == "postgresql":
            return func.array_to_string(column, " ")
        return cast(column, String)

    def _like_any(self, column: object, patterns: list[str]) -> list[object]:
        return [func.lower(column).like(pattern) for pattern in patterns]
