import smtplib
from email.message import EmailMessage
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserRead,
)


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

    async def request_password_reset(self, payload: ForgotPasswordRequest) -> None:
        user = await self.repository.get_by_email(payload.email)
        if user is None or not user.is_active:
            return

        token = create_password_reset_token(user.id)
        await self._send_password_reset_email(user, token)

    async def reset_password(self, payload: ResetPasswordRequest) -> None:
        token_payload = decode_access_token(payload.token)
        if token_payload.get("typ") != "password_reset":
            raise UnauthorizedError("Lien de reinitialisation invalide")

        user_id = UUID(str(token_payload["sub"]))
        user = await self.repository.get(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Lien de reinitialisation invalide")

        await self.repository.update_password(user, hash_password(payload.password))
        await self.repository.session.commit()

    async def change_password(self, user: User, payload: ChangePasswordRequest) -> None:
        if not verify_password(payload.current_password, user.hashed_password):
            raise UnauthorizedError("Mot de passe actuel incorrect")

        await self.repository.update_password(user, hash_password(payload.new_password))
        await self.repository.session.commit()

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

    async def _send_password_reset_email(self, user: User, token: str) -> None:
        if not settings.FRONTEND_BASE_URL or not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
            return

        reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={token}"
        message = EmailMessage()
        message["Subject"] = "Réinitialisation de votre mot de passe BiblioCouture"
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = user.email
        message.set_content(
            "Bonjour,\n\n"
            "Vous pouvez choisir un nouveau mot de passe avec ce lien :\n"
            f"{reset_url}\n\n"
            f"Ce lien expire dans {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.\n"
            "Si vous n'avez rien demandé, ignorez ce message.\n"
        )

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
