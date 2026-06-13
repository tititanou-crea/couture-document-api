from fastapi import APIRouter

from app.routes.auth import router as auth_router
from app.routes.books import router as books_router
from app.routes.metadata import router as metadata_router
from app.routes.patterns import router as patterns_router
from app.routes.uploads import router as uploads_router
from app.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(books_router)
api_router.include_router(patterns_router)
api_router.include_router(metadata_router)
api_router.include_router(uploads_router)
api_router.include_router(users_router)
