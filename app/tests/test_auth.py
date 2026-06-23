from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.enums import UserRole
from app.core.security import decode_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.admin_seed import ensure_default_admin


async def test_login_returns_token(client, session: AsyncSession) -> None:
    user = User(
        first_name="Tania",
        last_name="Rojas",
        email="admin@example.com",
        hashed_password=hash_password("strong-password"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(user)
    await session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "strong-password"},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"].count(".") == 2
    token_payload = decode_access_token(response.json()["access_token"])
    assert token_payload["exp"] - token_payload["iat"] == 3 * 60 * 60


async def test_refresh_returns_a_new_valid_session(client) -> None:
    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["user"]["email"] == "default-admin@example.com"
    token_payload = decode_access_token(response.json()["access_token"])
    assert token_payload["exp"] - token_payload["iat"] == 3 * 60 * 60


async def test_login_rejects_invalid_password(client, session: AsyncSession) -> None:
    user = User(
        first_name="Tania",
        last_name="Rojas",
        email="admin@example.com",
        hashed_password=hash_password("strong-password"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(user)
    await session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )

    assert response.status_code == 401


async def test_default_admin_seed_creates_expected_login(session: AsyncSession) -> None:
    await ensure_default_admin(session)

    user = await UserRepository(session).get_by_email(settings.DEFAULT_ADMIN_EMAIL)

    assert user is not None
    assert user.role == UserRole.ADMIN
    assert user.is_active is True
    assert user.hashed_password.startswith("$2")
    assert verify_password(settings.DEFAULT_ADMIN_PASSWORD, user.hashed_password)
