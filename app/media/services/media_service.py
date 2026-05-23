from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.core.exceptions import PayloadTooLargeError, UnsupportedMediaTypeError


class MediaService:
    def __init__(self, storage_dir: Path | None = None, base_url: str | None = None) -> None:
        self.storage_dir = storage_dir or settings.MEDIA_STORAGE_DIR
        self.base_url = (base_url or settings.MEDIA_BASE_URL).rstrip("/")
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        self.allowed_extensions = {
            extension.lower() for extension in settings.ALLOWED_IMAGE_EXTENSIONS
        }

    async def save_cover(self, *, filename: str, content_type: str | None, content: bytes) -> str:
        extension = Path(filename).suffix.lower()
        if extension not in self.allowed_extensions:
            raise UnsupportedMediaTypeError("Extension image non autorisee")
        if not content_type or not content_type.startswith("image/"):
            raise UnsupportedMediaTypeError("Le fichier doit etre une image")

        if len(content) > self.max_size_bytes:
            raise PayloadTooLargeError("Image trop volumineuse")
        if not self._has_valid_image_signature(content, extension):
            raise UnsupportedMediaTypeError("Signature image invalide")

        self.storage_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{extension}"
        destination = self.storage_dir / filename
        destination.write_bytes(content)
        return f"{self.base_url}/{filename}"

    def _has_valid_image_signature(self, content: bytes, extension: str) -> bool:
        if extension in {".jpg", ".jpeg"}:
            return content.startswith(b"\xff\xd8\xff")
        if extension == ".png":
            return content.startswith(b"\x89PNG\r\n\x1a\n")
        if extension == ".webp":
            return content.startswith(b"RIFF") and content[8:12] == b"WEBP"
        return False
