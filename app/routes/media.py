from hashlib import sha256
from io import BytesIO
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ResourceNotFoundError
from app.db.session import get_db_session
from app.models.media_asset import MediaAsset

router = APIRouter(prefix=settings.MEDIA_BASE_URL, tags=["Media"])
CACHE_HEADERS = {"Cache-Control": "public, max-age=31536000, immutable"}
THUMBNAIL_HEADERS = {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Vary": "Accept",
}
MIN_THUMBNAIL_WIDTH = 80
MAX_THUMBNAIL_WIDTH = 1200


@router.get("/{filename}")
async def get_media_asset(
    filename: str,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    width: Annotated[
        int | None,
        Query(alias="w", ge=MIN_THUMBNAIL_WIDTH, le=MAX_THUMBNAIL_WIDTH),
    ] = None,
) -> Response:
    result = await session.execute(select(MediaAsset).where(MediaAsset.filename == filename))
    asset = result.scalar_one_or_none()
    if asset is not None:
        if width is not None:
            thumbnail = get_or_create_thumbnail(
                filename=filename,
                content=asset.content,
                width=width,
                source_updated_at=str(asset.updated_at.timestamp()),
            )
            if thumbnail is not None:
                return Response(
                    content=thumbnail,
                    media_type="image/webp",
                    headers=THUMBNAIL_HEADERS,
                )
        return Response(
            content=asset.content,
            media_type=asset.content_type,
            headers=CACHE_HEADERS,
        )

    file_path = settings.MEDIA_STORAGE_DIR / filename
    if Path(filename).name == filename and file_path.is_file():
        if width is not None:
            thumbnail_path = get_or_create_file_thumbnail(file_path=file_path, width=width)
            if thumbnail_path is not None:
                return FileResponse(
                    thumbnail_path,
                    media_type="image/webp",
                    headers=THUMBNAIL_HEADERS,
                )
        return FileResponse(file_path, headers=CACHE_HEADERS)

    raise ResourceNotFoundError("Image introuvable")


def get_or_create_file_thumbnail(*, file_path: Path, width: int) -> Path | None:
    cache_path = thumbnail_cache_path(
        filename=file_path.name,
        width=width,
        source_updated_at=str(file_path.stat().st_mtime_ns),
    )
    if cache_path.is_file():
        return cache_path

    content = file_path.read_bytes()
    thumbnail = get_or_create_thumbnail(
        filename=file_path.name,
        content=content,
        width=width,
        source_updated_at=str(file_path.stat().st_mtime_ns),
    )
    if thumbnail is None:
        return None
    return cache_path


def get_or_create_thumbnail(
    *,
    filename: str,
    content: bytes,
    width: int,
    source_updated_at: str,
) -> bytes | None:
    cache_path = thumbnail_cache_path(
        filename=filename,
        width=width,
        source_updated_at=source_updated_at,
    )
    if cache_path.is_file():
        return cache_path.read_bytes()

    thumbnail = resize_image_to_webp(content=content, width=width)
    if thumbnail is None:
        return None

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(thumbnail)
    return thumbnail


def thumbnail_cache_path(*, filename: str, width: int, source_updated_at: str) -> Path:
    safe_name = Path(filename).stem
    version = sha256(source_updated_at.encode("utf-8")).hexdigest()[:12]
    return settings.MEDIA_STORAGE_DIR / ".cache" / f"{safe_name}-{width}-{version}.webp"


def resize_image_to_webp(*, content: bytes, width: int) -> bytes | None:
    try:
        from PIL import Image, ImageOps, UnidentifiedImageError
    except ImportError:
        return None

    try:
        with Image.open(BytesIO(content)) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGB")
            output = BytesIO()
            image.save(output, format="WEBP", quality=72, method=6)
            return output.getvalue()
    except (OSError, UnidentifiedImageError):
        return None
