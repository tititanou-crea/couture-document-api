import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminPasswordResetRequest, UserCreateByAdmin


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = UserRepository(session)

    async def list_users(self) -> list[User]:
        return await self.repository.list()

    async def create_user(self, payload: UserCreateByAdmin) -> User:
        user = User(
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=True,
        )
        try:
            created = await self.repository.create(user)
            await self.session.commit()
            return created
        except IntegrityError as exc:
            await self.session.rollback()
            raise ConflictError("Un compte existe deja avec cet email") from exc

    async def reset_user_password(
        self, user_id: uuid.UUID, payload: AdminPasswordResetRequest
    ) -> User:
        user = await self.repository.get(user_id)
        if user is None:
            raise ResourceNotFoundError("Compte introuvable")

        updated = await self.repository.update_password(user, hash_password(payload.password))
        await self.session.commit()
        return updated
