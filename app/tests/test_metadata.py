from httpx import AsyncClient

from app.schemas.metadata import PatternPhotoMetadataResponse, PhotoMetadataResponse
from app.tests.test_books import BOOK_PAYLOAD, MAGAZINE_PAYLOAD
from app.tests.test_patterns import PATTERN_PAYLOAD


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
        "subtitle": BOOK_PAYLOAD["subtitle"],
        "authors": BOOK_PAYLOAD["authors"],
        "publisher": BOOK_PAYLOAD["publisher"],
        "isbn": BOOK_PAYLOAD["isbn"],
        "publishedYear": "2024",
        "pageCount": BOOK_PAYLOAD["page_count"],
        "description": BOOK_PAYLOAD["description"],
        "coverUrl": BOOK_PAYLOAD["cover_url"],
        "difficulty_levels": BOOK_PAYLOAD["difficulty_levels"],
        "target_audiences": BOOK_PAYLOAD["target_audiences"],
        "main_categories": BOOK_PAYLOAD["main_categories"],
        "project_types": BOOK_PAYLOAD["project_types"],
        "available_sizes": BOOK_PAYLOAD["available_sizes"],
        "includes_patterns": BOOK_PAYLOAD["includes_patterns"],
        "patterns": [],
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
    await client.post(
        "/api/v1/books",
        json={
            **MAGAZINE_PAYLOAD,
            "magazine_patterns": [
                {
                    "model_name": "Robe chemise",
                    "designer_name": "Burda",
                    "format": "physical",
                    "description": "Une robe chemise ceinturee.",
                    "cover_url": "https://example.com/covers/robe-chemise.jpg",
                    "second_cover_url": "https://example.com/covers/robe-chemise-dos.jpg",
                    "magazine_pattern_identifier": "102",
                    "difficulty_levels": ["intermediate"],
                    "target_audiences": ["women"],
                    "main_categories": ["clothing"],
                    "project_types": ["dress"],
                    "available_sizes": ["36", "38"],
                }
            ],
        },
    )
    client.headers.pop("Authorization")

    response = await client.post(
        "/api/v1/metadata",
        json={"type": "magazine", "ean": MAGAZINE_PAYLOAD["ean"]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == MAGAZINE_PAYLOAD["title"]
    assert response.json()["ean"] == MAGAZINE_PAYLOAD["ean"]
    assert response.json()["issueNumber"] == MAGAZINE_PAYLOAD["issue_number"]
    assert response.json()["difficulty_levels"] == MAGAZINE_PAYLOAD["difficulty_levels"]
    assert response.json()["target_audiences"] == MAGAZINE_PAYLOAD["target_audiences"]
    assert response.json()["main_categories"] == MAGAZINE_PAYLOAD["main_categories"]
    assert response.json()["project_types"] == MAGAZINE_PAYLOAD["project_types"]
    assert response.json()["includes_patterns"] is True
    assert response.json()["patterns"] == [
        {
            "model_name": "Robe chemise",
            "designer_name": "Burda",
            "format": "physical",
            "description": "Une robe chemise ceinturee.",
            "cover_url": "https://example.com/covers/robe-chemise.jpg",
            "second_cover_url": "https://example.com/covers/robe-chemise-dos.jpg",
            "magazine_pattern_identifier": "102",
            "difficulty_levels": ["intermediate"],
            "target_audiences": ["women"],
            "main_categories": ["clothing"],
            "project_types": ["dress"],
            "available_sizes": ["36", "38"],
        }
    ]


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
    assert response.json()["difficulty_levels"] == MAGAZINE_PAYLOAD["difficulty_levels"]
    assert response.json()["target_audiences"] == MAGAZINE_PAYLOAD["target_audiences"]
    assert response.json()["main_categories"] == MAGAZINE_PAYLOAD["main_categories"]
    assert response.json()["project_types"] == MAGAZINE_PAYLOAD["project_types"]
    assert response.json()["available_sizes"] == MAGAZINE_PAYLOAD["available_sizes"]


async def test_metadata_lookup_accepts_magazine_issue_number_alias(
    client: AsyncClient,
) -> None:
    await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/metadata",
        json={
            "type": "magazine",
            "title": MAGAZINE_PAYLOAD["title"],
            "issueNumber": MAGAZINE_PAYLOAD["issue_number"],
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == MAGAZINE_PAYLOAD["title"]
    assert response.json()["issueNumber"] == MAGAZINE_PAYLOAD["issue_number"]
    assert response.json()["difficulty_levels"] == MAGAZINE_PAYLOAD["difficulty_levels"]


async def test_metadata_lookup_finds_pattern_by_model_name(client: AsyncClient) -> None:
    await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)
    client.headers.pop("Authorization")

    response = await client.post(
        "/metadata",
        json={"type": "patron", "modelName": PATTERN_PAYLOAD["model_name"]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == PATTERN_PAYLOAD["model_name"]
    assert response.json()["description"] == PATTERN_PAYLOAD["description"]
    assert response.json()["coverUrl"] == PATTERN_PAYLOAD["cover_url"]
    assert response.json()["difficulty_levels"] == PATTERN_PAYLOAD["difficulty_levels"]
    assert response.json()["target_audiences"] == PATTERN_PAYLOAD["target_audiences"]
    assert response.json()["main_categories"] == PATTERN_PAYLOAD["main_categories"]
    assert response.json()["project_types"] == PATTERN_PAYLOAD["project_types"]
    assert response.json()["available_sizes"] == PATTERN_PAYLOAD["available_sizes"]
    assert response.json()["patterns"] == [
        {
            "model_name": PATTERN_PAYLOAD["model_name"],
            "designer_name": PATTERN_PAYLOAD["designer_name"],
            "format": PATTERN_PAYLOAD["format"],
            "description": PATTERN_PAYLOAD["description"],
            "cover_url": PATTERN_PAYLOAD["cover_url"],
            "second_cover_url": PATTERN_PAYLOAD["second_cover_url"],
            "difficulty_levels": PATTERN_PAYLOAD["difficulty_levels"],
            "target_audiences": PATTERN_PAYLOAD["target_audiences"],
            "main_categories": PATTERN_PAYLOAD["main_categories"],
            "project_types": PATTERN_PAYLOAD["project_types"],
            "available_sizes": PATTERN_PAYLOAD["available_sizes"],
        }
    ]


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
            available_sizes=["34", "36", "38"],
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
        "availableSizes": ["34", "36", "38"],
        "extractedText": "Robe Magnolia Atelier Couture",
        "confidence": "high",
    }
