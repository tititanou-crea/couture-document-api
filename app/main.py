from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.session import AsyncSessionLocal
from app.routes.media import router as media_router
from app.routes.metadata import router as metadata_router
from app.services.admin_seed import ensure_default_admin


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    async with AsyncSessionLocal() as session:
        await ensure_default_admin(session)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    register_exception_handlers(app)
    app.include_router(metadata_router)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    app.include_router(media_router)
    settings.MEDIA_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.MEDIA_BASE_URL,
        StaticFiles(directory=settings.MEDIA_STORAGE_DIR),
        name="media",
    )

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
