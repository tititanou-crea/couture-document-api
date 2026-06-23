from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, TokenResponse, UserRead


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = UserRepository(session)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self.repository.get_by_email(payload.email)
        if user is None or not user.is_active:
            raise UnauthorizedError("Identifiants invalides")
        if not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Identifiants invalides")

        return self.create_session(user)

    def create_session(self, user: User) -> TokenResponse:
        token = create_access_token(
            user.id,
            {
                "role": user.role.value,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        )
        return TokenResponse(access_token=token, user=UserRead.model_validate(user))
