import json
import re
import urllib.error
import urllib.request
from typing import Any

from app.core.config import settings
from app.core.enums import DifficultyLevel, MainCategory, PatternFormat, ProjectType, TargetAudience
from app.schemas.metadata import (
    PatternPhotoMetadataResponse,
    PhotoMetadataImage,
    PhotoMetadataResponse,
)


class PhotoMetadataError(RuntimeError):
    pass


async def extract_book_metadata_from_photos(
    *, cover_photo: PhotoMetadataImage | None, back_photo: PhotoMetadataImage | None
) -> PhotoMetadataResponse:
    if not settings.OPENAI_API_KEY:
        raise PhotoMetadataError(
            "L'extraction photo n'est pas encore configurée. Ajoutez OPENAI_API_KEY côté API."
        )

    images: list[dict[str, str]] = []
    for image in (cover_photo, back_photo):
        if image is None:
            continue
        if image.data_url:
            images.append(
                {
                    "type": "input_image",
                    "image_url": image.data_url,
                    "detail": "high",
                }
            )

    if not images:
        raise PhotoMetadataError("Ajoutez au moins une photo à analyser.")

    payload = {
        "model": settings.OPENAI_VISION_MODEL,
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Analyse ces photos d'un livre de couture. Extrais uniquement les "
                            "informations visibles ou très probables sur la couverture et le dos. "
                            "Réponds en JSON strict avec les clés: title, subtitle, authors, "
                            "publisher, isbn, publishedYear, pageCount, description, "
                            "extractedText, confidence. authors est une liste. "
                            "pageCount est un nombre ou null. "
                            "confidence vaut high, medium ou low. N'invente pas une information "
                            "absente ou illisible."
                        ),
                    },
                    *images,
                ],
            }
        ],
        "max_output_tokens": 900,
    }

    response_data = _post_openai_response(payload)
    raw_text = _extract_output_text(response_data)
    parsed = _parse_json_object(raw_text)
    return PhotoMetadataResponse(
        title=_clean_text(parsed.get("title")),
        subtitle=_clean_text(parsed.get("subtitle")),
        authors=[
            author
            for author in (_clean_text(value) for value in parsed.get("authors", []))
            if author
        ],
        publisher=_clean_text(parsed.get("publisher")),
        isbn=_normalize_isbn(parsed.get("isbn")),
        published_year=_extract_year(parsed.get("publishedYear")),
        page_count=_parse_positive_int(parsed.get("pageCount")),
        description=_clean_text(parsed.get("description")),
        extracted_text=_clean_text(parsed.get("extractedText")) or raw_text,
        confidence=_clean_confidence(parsed.get("confidence")),
    )


async def extract_pattern_metadata_from_photo(
    *, photo: PhotoMetadataImage | None
) -> PatternPhotoMetadataResponse:
    if not settings.OPENAI_API_KEY:
        raise PhotoMetadataError(
            "L'extraction photo n'est pas encore configurée. Ajoutez OPENAI_API_KEY côté API."
        )

    if photo is None or not photo.data_url:
        raise PhotoMetadataError("Ajoutez une photo du patron à analyser.")

    payload = {
        "model": settings.OPENAI_VISION_MODEL,
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Analyse cette photo d'un patron de couture. Extrais uniquement les "
                            "informations visibles ou très probables. Réponds en JSON strict avec "
                            "les clés: modelName, designerName, format, description, "
                            "difficultyLevels, targetAudiences, mainCategories, projectTypes, "
                            "extractedText, confidence. format vaut physical, digital, both "
                            "ou null. "
                            "difficultyLevels contient uniquement beginner, intermediate, "
                            "advanced. "
                            "targetAudiences contient uniquement women, men, children, baby, "
                            "plus_size. "
                            "mainCategories contient uniquement clothing ou accessories. "
                            "projectTypes contient uniquement dress, skirt, top, pants, "
                            "jacket, coat, "
                            "bag, pouch, hair_accessories, textile_decoration. "
                            "confidence vaut high, medium ou low. N'invente pas une information "
                            "absente ou illisible."
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": photo.data_url,
                        "detail": "high",
                    },
                ],
            }
        ],
        "max_output_tokens": 900,
    }

    response_data = _post_openai_response(payload)
    raw_text = _extract_output_text(response_data)
    parsed = _parse_json_object(raw_text)
    return PatternPhotoMetadataResponse(
        model_name=_clean_text(parsed.get("modelName")),
        designer_name=_clean_text(parsed.get("designerName")),
        format=_clean_enum(parsed.get("format"), PatternFormat),
        description=_clean_text(parsed.get("description")),
        difficulty_levels=_clean_enum_list(parsed.get("difficultyLevels"), DifficultyLevel),
        target_audiences=_clean_enum_list(parsed.get("targetAudiences"), TargetAudience),
        main_categories=[
            category
            for category in _clean_enum_list(parsed.get("mainCategories"), MainCategory)
            if category in {MainCategory.CLOTHING, MainCategory.ACCESSORIES}
        ],
        project_types=_clean_enum_list(parsed.get("projectTypes"), ProjectType),
        extracted_text=_clean_text(parsed.get("extractedText")) or raw_text,
        confidence=_clean_confidence(parsed.get("confidence")),
    )


def _post_openai_response(payload: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise PhotoMetadataError(_format_openai_http_error(exc)) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise PhotoMetadataError(
            "Le service d'extraction photo est momentanément indisponible."
        ) from exc


def _format_openai_http_error(exc: urllib.error.HTTPError) -> str:
    raw_detail = exc.read().decode("utf-8", errors="ignore")
    detail = _extract_openai_error_message(raw_detail)

    if exc.code == 400:
        return f"OpenAI a refuse la requete d'analyse photo : {detail}"
    if exc.code == 401:
        return "Cle OpenAI invalide ou expiree. Verifiez OPENAI_API_KEY cote API."
    if exc.code == 403:
        return (
            "Acces OpenAI refuse. Verifiez les permissions du projet et l'acces au modele "
            f"{settings.OPENAI_VISION_MODEL}."
        )
    if exc.code == 404:
        return (
            f"Modele OpenAI introuvable ou non disponible : {settings.OPENAI_VISION_MODEL}. "
            "Verifiez OPENAI_VISION_MODEL cote API."
        )
    if exc.code == 429:
        return "Quota ou limite OpenAI atteint. Verifiez la facturation et les limites du projet."

    return f"L'analyse photo a echoue cote OpenAI ({exc.code}) : {detail}"


def _extract_openai_error_message(raw_detail: str) -> str:
    if not raw_detail:
        return "aucun detail fourni."
    try:
        parsed = json.loads(raw_detail)
    except json.JSONDecodeError:
        return raw_detail[:300]

    error = parsed.get("error")
    if isinstance(error, dict):
        message = error.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()

    message = parsed.get("message")
    if isinstance(message, str) and message.strip():
        return message.strip()

    return raw_detail[:300]


def _extract_output_text(data: dict[str, Any]) -> str:
    parts: list[str] = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                parts.append(content["text"])
    if parts:
        return "\n".join(parts).strip()
    return str(data.get("output_text") or "").strip()


def _parse_json_object(text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.S)
        if not match:
            return {}
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}


def _clean_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    text = re.sub(r"\s+", " ", value).strip()
    return text or None


def _normalize_isbn(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    isbn = re.sub(r"[^0-9Xx]", "", value).upper()
    return isbn if len(isbn) in {10, 13} else None


def _extract_year(value: Any) -> str | None:
    if value is None:
        return None
    match = re.search(r"\d{4}", str(value))
    return match.group(0) if match else None


def _parse_positive_int(value: Any) -> int | None:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _clean_enum(value: Any, enum_class: type) -> Any | None:
    if not isinstance(value, str):
        return None
    try:
        return enum_class(value)
    except ValueError:
        return None


def _clean_enum_list(value: Any, enum_class: type) -> list[Any]:
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value:
        enum_value = _clean_enum(item, enum_class)
        if enum_value is not None and enum_value not in cleaned:
            cleaned.append(enum_value)
    return cleaned


def _clean_confidence(value: Any) -> str | None:
    return value if value in {"high", "medium", "low"} else None
