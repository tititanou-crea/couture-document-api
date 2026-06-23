from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ResourceNotFoundError
from app.db.session import get_db_session
from app.models.media_asset import MediaAsset

router = APIRouter(prefix=settings.MEDIA_BASE_URL, tags=["Media"])
CACHE_HEADERS = {"Cache-Control": "public, max-age=31536000, immutable"}


@router.get("/{filename}")
async def get_media_asset(
    filename: str,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    result = await session.execute(select(MediaAsset).where(MediaAsset.filename == filename))
    asset = result.scalar_one_or_none()
    if asset is not None:
        return Response(
            content=asset.content,
            media_type=asset.content_type,
            headers=CACHE_HEADERS,
        )

    file_path = settings.MEDIA_STORAGE_DIR / filename
    if Path(filename).name == filename and file_path.is_file():
        return FileResponse(file_path, headers=CACHE_HEADERS)

    raise ResourceNotFoundError("Image introuvable")
