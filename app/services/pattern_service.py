import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models.pattern import Pattern
from app.repositories.pattern_repository import PatternRepository
from app.schemas.pattern import (
    PaginatedPatterns,
    PatternBase,
    PatternCreate,
    PatternUpdate,
    pattern_values_for_model,
)


class PatternService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = PatternRepository(session)

    async def list_patterns(self, *, limit: int, offset: int) -> PaginatedPatterns:
        patterns, total = await self.repository.list(limit=limit, offset=offset)
        return PaginatedPatterns(items=patterns, total=total, limit=limit, offset=offset)

    async def get_pattern(self, pattern_id: uuid.UUID) -> Pattern:
        pattern = await self.repository.get(pattern_id)
        if pattern is None:
            raise ResourceNotFoundError("Patron introuvable")
        return pattern

    async def create_pattern(self, payload: PatternCreate) -> Pattern:
        values = pattern_values_for_model(payload)
        pattern = Pattern(**values)
        try:
            created = await self.repository.create(pattern)
            await self.session.commit()
            return created
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError("Impossible de creer ce patron") from exc

    async def update_pattern(self, pattern_id: uuid.UUID, payload: PatternUpdate) -> Pattern:
        pattern = await self.get_pattern(pattern_id)
        values = pattern_values_for_model(payload, exclude_unset=True)
        self._validate_pattern_after_update(pattern, values)

        try:
            updated = await self.repository.update(pattern, values)
            await self.session.commit()
            return updated
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError("Impossible de modifier ce patron") from exc

    async def delete_pattern(self, pattern_id: uuid.UUID) -> None:
        pattern = await self.get_pattern(pattern_id)
        await self.repository.delete(pattern)
        await self.session.commit()

    async def search_patterns(self, *, query: str, limit: int, offset: int) -> PaginatedPatterns:
        patterns, total = await self.repository.search(query=query, limit=limit, offset=offset)
        return PaginatedPatterns(items=patterns, total=total, limit=limit, offset=offset)

    def _validate_pattern_after_update(
        self, pattern: Pattern, values: dict[str, object]
    ) -> None:
        merged = {
            "model_name": pattern.model_name,
            "designer_name": pattern.designer_name,
            "format": pattern.format,
            "description": pattern.description,
            "cover_url": pattern.cover_url,
            "difficulty_levels": pattern.difficulty_levels,
            "target_audiences": pattern.target_audiences,
            "main_categories": pattern.main_categories,
            "project_types": pattern.project_types,
            "status": pattern.status,
            "created_by": pattern.created_by,
            "validated_by": pattern.validated_by,
            "validated_at": pattern.validated_at,
        }
        merged.update(values)
        PatternBase.model_validate(merged)
