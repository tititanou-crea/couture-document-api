from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, status
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.media.services.media_service import MediaService

router = APIRouter(prefix="/upload", tags=["Upload"], dependencies=[Depends(get_current_user)])


class UploadResponse(BaseModel):
    url: str


def get_media_service() -> MediaService:
    return MediaService()


@router.post("/cover", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_cover(
    request: Request,
    filename: Annotated[str, Header(alias="X-Filename")],
    service: Annotated[MediaService, Depends(get_media_service)],
) -> UploadResponse:
    content = await request.body()
    url = await service.save_cover(
        filename=filename,
        content_type=request.headers.get("content-type"),
        content=content,
    )
    return UploadResponse(url=url)
