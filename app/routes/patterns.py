import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.session import get_db_session
from app.schemas.pattern import PatternCreate, PatternRead, PatternUpdate, PaginatedPatterns
from app.services.pattern_service import PatternService

router = APIRouter(prefix="/patterns", tags=["Patterns"], dependencies=[Depends(get_current_user)])


async def get_pattern_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PatternService:
    return PatternService(session)


@router.get("", response_model=PaginatedPatterns)
async def list_patterns(
    service: Annotated[PatternService, Depends(get_pattern_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedPatterns:
    return await service.list_patterns(limit=limit, offset=offset)


@router.get("/search", response_model=PaginatedPatterns)
async def search_patterns(
    service: Annotated[PatternService, Depends(get_pattern_service)],
    q: Annotated[str, Query(min_length=1, max_length=120)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PaginatedPatterns:
    return await service.search_patterns(query=q, limit=limit, offset=offset)


@router.get("/{pattern_id}", response_model=PatternRead)
async def get_pattern(
    pattern_id: uuid.UUID,
    service: Annotated[PatternService, Depends(get_pattern_service)],
) -> PatternRead:
    return await service.get_pattern(pattern_id)


@router.post("", response_model=PatternRead, status_code=status.HTTP_201_CREATED)
async def create_pattern(
    payload: PatternCreate,
    service: Annotated[PatternService, Depends(get_pattern_service)],
) -> PatternRead:
    return await service.create_pattern(payload)


@router.put("/{pattern_id}", response_model=PatternRead)
async def update_pattern(
    pattern_id: uuid.UUID,
    payload: PatternUpdate,
    service: Annotated[PatternService, Depends(get_pattern_service)],
) -> PatternRead:
    return await service.update_pattern(pattern_id, payload)


@router.delete("/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pattern(
    pattern_id: uuid.UUID,
    service: Annotated[PatternService, Depends(get_pattern_service)],
) -> None:
    await service.delete_pattern(pattern_id)
