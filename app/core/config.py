import json
from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_CORS_ORIGIN_REGEX = (
    r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$"
    r"|^https://couture-document(-[a-z0-9-]+)?-tanou-projects\.vercel\.app$"
    r"|^https://couture-document-api\.vercel\.app$"
    r"|^https://couture-document\.vercel\.app$"
)


class Settings(BaseSettings):
    APP_NAME: str = "Couture Document API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://couture:couture@localhost:5432/couture_catalog"
    )
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl | str] = []
    BACKEND_CORS_ORIGIN_REGEX: str | None = DEFAULT_CORS_ORIGIN_REGEX
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    DEFAULT_ADMIN_EMAIL: str = "tania.rojasangele@gmail.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin123!"
    DEFAULT_ADMIN_FIRST_NAME: str = "Tania"
    DEFAULT_ADMIN_LAST_NAME: str = "Rojas Angele"
    FRONTEND_BASE_URL: str | None = None
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    MEDIA_STORAGE_DIR: Path = Path("media/uploads")
    MEDIA_BASE_URL: str = "/media/uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_IMAGE_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    OPENAI_API_KEY: str | None = None
    OPENAI_VISION_MODEL: str = "gpt-5.5"

    @field_validator("DATABASE_URL")
    @classmethod
    def use_async_postgres_driver(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return parsed if isinstance(parsed, list) else [str(parsed)]

    @field_validator("BACKEND_CORS_ORIGIN_REGEX", mode="before")
    @classmethod
    def use_default_cors_regex_when_empty(cls, value: str | None) -> str | None:
        if value == "":
            return DEFAULT_CORS_ORIGIN_REGEX
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
