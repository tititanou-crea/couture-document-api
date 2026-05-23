from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_admin
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.user import UserCreateByAdmin, UserRead
from app.services.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(require_admin)],
)


async def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserService:
    return UserService(session)


@router.get("", response_model=list[UserRead])
async def list_users(
    service: Annotated[UserService, Depends(get_user_service)],
) -> list[User]:
    return await service.list_users()


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateByAdmin,
    service: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return await service.create_user(payload)
