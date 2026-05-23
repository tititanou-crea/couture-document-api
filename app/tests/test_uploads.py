from pathlib import Path

from httpx import AsyncClient

from app.media.services.media_service import MediaService
from app.routes.uploads import get_media_service


async def test_upload_cover(client: AsyncClient, tmp_path: Path) -> None:
    def override_media_service() -> MediaService:
        return MediaService(storage_dir=tmp_path, base_url="/media/uploads")

    from app.main import app

    app.dependency_overrides[get_media_service] = override_media_service
    response = await client.post(
        "/api/v1/upload/cover",
        content=b"\x89PNG\r\n\x1a\nimage-bytes",
        headers={"content-type": "image/png", "X-Filename": "cover.png"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["url"].startswith("/media/uploads/")
    assert len(list(tmp_path.iterdir())) == 1


async def test_upload_cover_rejects_non_image(client: AsyncClient, tmp_path: Path) -> None:
    def override_media_service() -> MediaService:
        return MediaService(storage_dir=tmp_path, base_url="/media/uploads")

    from app.main import app

    app.dependency_overrides[get_media_service] = override_media_service
    response = await client.post(
        "/api/v1/upload/cover",
        content=b"not an image",
        headers={"content-type": "text/plain", "X-Filename": "cover.txt"},
    )

    assert response.status_code == 415
