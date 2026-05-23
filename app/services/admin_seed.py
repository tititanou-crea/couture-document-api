from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.enums import UserRole
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import normalize_email


async def ensure_default_admin(session: AsyncSession) -> None:
    repository = UserRepository(session)
    email = normalize_email(settings.DEFAULT_ADMIN_EMAIL)
    existing_admin = await repository.get_by_email(email)

    if existing_admin is None:
        admin = User(
            first_name=settings.DEFAULT_ADMIN_FIRST_NAME,
            last_name=settings.DEFAULT_ADMIN_LAST_NAME,
            email=email,
            hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
        )
        await repository.create(admin)
    else:
        existing_admin.first_name = settings.DEFAULT_ADMIN_FIRST_NAME
        existing_admin.last_name = settings.DEFAULT_ADMIN_LAST_NAME
        existing_admin.hashed_password = hash_password(settings.DEFAULT_ADMIN_PASSWORD)
        existing_admin.role = UserRole.ADMIN
        existing_admin.is_active = True

    await session.commit()
