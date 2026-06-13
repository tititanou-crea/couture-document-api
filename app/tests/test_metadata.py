from httpx import AsyncClient

from app.schemas.metadata import PatternPhotoMetadataResponse, PhotoMetadataResponse
from app.tests.test_books import BOOK_PAYLOAD, MAGAZINE_PAYLOAD


async def test_metadata_lookup_finds_book_by_isbn(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/metadata",
        json={"type": "livre", "isbn": "978-2-84221-823-2"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "title": BOOK_PAYLOAD["title"],
        "authors": BOOK_PAYLOAD["authors"],
        "publisher": BOOK_PAYLOAD["publisher"],
        "description": BOOK_PAYLOAD["description"],
        "coverUrl": BOOK_PAYLOAD["cover_url"],
    }


async def test_metadata_lookup_is_available_under_api_v1(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/api/v1/metadata",
        json={"type": "book", "isbn": BOOK_PAYLOAD["isbn"]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == BOOK_PAYLOAD["title"]


async def test_metadata_lookup_finds_magazine_by_ean(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/api/v1/metadata",
        json={"type": "magazine", "ean": MAGAZINE_PAYLOAD["ean"]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == MAGAZINE_PAYLOAD["title"]
    assert response.json()["ean"] == MAGAZINE_PAYLOAD["ean"]
    assert response.json()["issueNumber"] == MAGAZINE_PAYLOAD["issue_number"]


async def test_metadata_lookup_finds_magazine_by_title_and_issue(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/metadata",
        json={
            "type": "magazine",
            "title": MAGAZINE_PAYLOAD["title"],
            "dateNumero": MAGAZINE_PAYLOAD["issue_number"],
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == MAGAZINE_PAYLOAD["title"]


async def test_metadata_lookup_returns_empty_response_when_not_found(
    client: AsyncClient,
) -> None:
    client.headers.pop("Authorization")

    response = await client.post(
        "/metadata",
        json={"type": "magazine", "ean": "1234567890123"},
    )

    assert response.status_code == 204
    assert response.content == b""


async def test_photo_metadata_extraction_prefills_book_fields(
    client: AsyncClient,
    monkeypatch,
) -> None:
    async def fake_extract_book_metadata_from_photos(*, cover_photo, back_photo):
        assert cover_photo.data_url.startswith("data:image/jpeg;base64,")
        assert back_photo.data_url.startswith("data:image/jpeg;base64,")
        return PhotoMetadataResponse(
            title="Couture facile",
            subtitle="20 projets pour débuter",
            authors=["Jeanne Martin"],
            publisher="Atelier fil",
            isbn="9782842218232",
            published_year="2024",
            page_count=128,
            description="Un livre de projets couture accessibles.",
            extracted_text="Couture facile Jeanne Martin",
            confidence="high",
        )

    monkeypatch.setattr(
        "app.routes.metadata.extract_book_metadata_from_photos",
        fake_extract_book_metadata_from_photos,
    )

    response = await client.post(
        "/api/v1/metadata/extract-from-photos",
        json={
            "coverPhoto": {"dataUrl": "data:image/jpeg;base64,abc"},
            "backPhoto": {"dataUrl": "data:image/jpeg;base64,def"},
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "title": "Couture facile",
        "subtitle": "20 projets pour débuter",
        "authors": ["Jeanne Martin"],
        "publisher": "Atelier fil",
        "isbn": "9782842218232",
        "publishedYear": "2024",
        "pageCount": 128,
        "description": "Un livre de projets couture accessibles.",
        "extractedText": "Couture facile Jeanne Martin",
        "confidence": "high",
    }


async def test_photo_metadata_extraction_prefills_pattern_fields(
    client: AsyncClient,
    monkeypatch,
) -> None:
    async def fake_extract_pattern_metadata_from_photo(*, photo):
        assert photo.data_url.startswith("data:image/jpeg;base64,")
        return PatternPhotoMetadataResponse(
            model_name="Robe Magnolia",
            designer_name="Atelier Couture",
            format="both",
            description="Une robe portefeuille fluide.",
            difficulty_levels=["intermediate"],
            target_audiences=["women"],
            main_categories=["clothing"],
            project_types=["dress"],
            extracted_text="Robe Magnolia Atelier Couture",
            confidence="high",
        )

    monkeypatch.setattr(
        "app.routes.metadata.extract_pattern_metadata_from_photo",
        fake_extract_pattern_metadata_from_photo,
    )

    response = await client.post(
        "/api/v1/metadata/extract-pattern-from-photo",
        json={"photo": {"dataUrl": "data:image/jpeg;base64,abc"}},
    )

    assert response.status_code == 200
    assert response.json() == {
        "modelName": "Robe Magnolia",
        "designerName": "Atelier Couture",
        "format": "both",
        "description": "Une robe portefeuille fluide.",
        "difficultyLevels": ["intermediate"],
        "targetAudiences": ["women"],
        "mainCategories": ["clothing"],
        "projectTypes": ["dress"],
        "extractedText": "Robe Magnolia Atelier Couture",
        "confidence": "high",
    }
