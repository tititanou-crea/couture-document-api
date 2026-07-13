from urllib.parse import urlparse


def normalize_media_url(value: object) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()
    if not normalized:
        return None

    parsed = urlparse(normalized)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return normalized
    if normalized.startswith("/media/"):
        return normalized

    raise ValueError("URL media invalide")
