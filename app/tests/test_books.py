from httpx import AsyncClient

BOOK_PAYLOAD = {
    "isbn": "9782842218232",
    "title": "La couture pratique",
    "subtitle": "Techniques et finitions",
    "description": "Un ouvrage de reference pour progresser en couture.",
    "authors": ["Atelier Couture"],
    "publisher": "Editions Textile",
    "published_date": "2024-01-15",
    "page_count": 240,
    "language": "fr",
    "cover_url": "https://example.com/covers/couture-pratique.jpg",
    "categories": ["couture", "techniques"],
    "tags": ["finitions", "patronage"],
    "difficulty_levels": ["beginner", "intermediate"],
    "target_audiences": ["women"],
    "main_categories": ["clothing", "technique"],
    "project_types": ["dress", "skirt"],
    "techniques": ["patternmaking", "serger"],
    "available_sizes": ["34", "36", "38"],
    "available_size_ranges": ["34-46"],
    "includes_patterns": True,
    "status": "draft",
}

MAGAZINE_PAYLOAD = {
    "type": "magazine",
    "ean": "9771234567003",
    "issue_number": "Mars 2026",
    "title": "Burda Style",
    "subtitle": "Special couture printemps",
    "description": "Un numero consacre aux robes, vestes legeres et finitions couture.",
    "publisher": "Burda",
    "published_date": "2026-03-01",
    "page_count": 96,
    "language": "fr",
    "cover_url": "https://example.com/covers/burda-style-mars-2026.jpg",
    "categories": ["couture", "magazine"],
    "tags": ["robes", "printemps"],
    "difficulty_levels": ["intermediate"],
    "target_audiences": ["women"],
    "main_categories": ["clothing"],
    "project_types": ["dress", "jacket"],
    "techniques": ["serger"],
    "available_sizes": ["S", "M", "L"],
    "available_size_ranges": ["XS-XL"],
    "includes_patterns": True,
    "status": "draft",
}


async def test_create_and_get_book(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == BOOK_PAYLOAD["title"]
    assert created["isbn"] == "9782842218232"
    assert created["main_categories"] == ["clothing", "technique"]
    assert created["available_sizes"] == ["34", "36", "38"]
    assert created["available_size_ranges"] == ["34-46"]
    assert created["status"] == "draft"
    assert created["creator"]["first_name"] == "Tania"
    assert created["creator"]["last_name"] == "Rojas"
    assert created["last_modifier"] == created["creator"]

    get_response = await client.get(f"/api/v1/books/{created['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["id"] == created["id"]


async def test_book_update_keeps_auditable_contributors(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    created = create_response.json()

    update_response = await client.put(
        f"/api/v1/books/{created['id']}",
        json={"title": "La couture pratique, édition revue"},
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["creator"]["first_name"] == "Tania"
    assert updated["last_modifier"]["first_name"] == "Tania"
    assert updated["updated_at"] >= created["updated_at"]


async def test_create_magazine_with_ean_and_issue_number(client: AsyncClient) -> None:
    response = await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)

    assert response.status_code == 201
    created = response.json()
    assert created["document_type"] == "magazine"
    assert created["ean"] == MAGAZINE_PAYLOAD["ean"]
    assert created["issue_number"] == MAGAZINE_PAYLOAD["issue_number"]
    assert created["isbn"] is None


async def test_create_magazine_with_patterns(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/books",
        json={
            **MAGAZINE_PAYLOAD,
            "pattern_sheet_url": "https://example.com/covers/burda-style-models.jpg",
            "pattern_sheet_second_url": (
                "https://example.com/covers/burda-style-models-page-2.jpg"
            ),
            "magazine_patterns": [
                {
                    "model_name": "Jupe en jean",
                    "magazine_pattern_identifier": "M1",
                    "description": "Une jupe courte en jean.",
                    "second_cover_url": (
                        "https://example.com/covers/jupe-en-jean-detail.jpg"
                    ),
                    "difficulty_levels": ["beginner"],
                    "target_audiences": ["women"],
                    "main_categories": ["clothing"],
                    "project_types": ["skirt"],
                    "available_sizes": ["36", "38"],
                    "available_size_ranges": ["36-42"],
                }
            ],
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["pattern_sheet_url"] == "https://example.com/covers/burda-style-models.jpg"
    assert (
        created["pattern_sheet_second_url"]
        == "https://example.com/covers/burda-style-models-page-2.jpg"
    )
    assert len(created["patterns"]) == 1
    assert created["patterns"][0]["model_name"] == "Jupe en jean"
    assert created["patterns"][0]["magazine_pattern_identifier"] == "M1"
    assert (
        created["patterns"][0]["second_cover_url"]
        == "https://example.com/covers/jupe-en-jean-detail.jpg"
    )
    assert created["patterns"][0]["available_sizes"] == ["36", "38"]
    assert created["patterns"][0]["available_size_ranges"] == ["36-42"]

    patterns_response = await client.get("/api/v1/patterns/search?q=Burda")

    assert patterns_response.status_code == 200
    pattern = patterns_response.json()["items"][0]
    assert pattern["source_magazine"]["id"] == created["id"]
    assert pattern["designer_name"] == MAGAZINE_PAYLOAD["title"]

    magazines_response = await client.get("/api/v1/books/search?q=Jupe")

    assert magazines_response.status_code == 200
    assert magazines_response.json()["items"][0]["id"] == created["id"]


async def test_search_magazines_by_french_pattern_project_type(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/books",
        json={
            **MAGAZINE_PAYLOAD,
            "magazine_patterns": [
                {
                    "model_name": "Modele 22",
                    "magazine_pattern_identifier": "22",
                    "description": "Un modele simple.",
                    "difficulty_levels": ["beginner"],
                    "target_audiences": ["women"],
                    "main_categories": ["clothing"],
                    "project_types": ["skirt"],
                }
            ],
        },
    )
    created = response.json()
    unrelated_response = await client.post(
        "/api/v1/books",
        json={
            **MAGAZINE_PAYLOAD,
            "ean": "9771234567010",
            "issue_number": "Avril 2026",
            "title": "Couture Maison",
            "description": "Un numero consacre aux accessoires textiles.",
            "project_types": ["bag"],
            "magazine_patterns": [
                {
                    "model_name": "Sac cabas",
                    "magazine_pattern_identifier": "31",
                    "description": "Un grand sac double.",
                    "difficulty_levels": ["beginner"],
                    "target_audiences": ["women"],
                    "main_categories": ["accessories"],
                    "project_types": ["bag"],
                }
            ],
        },
    )
    unrelated = unrelated_response.json()

    search_response = await client.get("/api/v1/books/search?q=jupe")

    assert search_response.status_code == 200
    payload = search_response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == created["id"]
    assert unrelated["id"] not in {item["id"] for item in payload["items"]}


async def test_list_books_with_query_filters_results(client: AsyncClient) -> None:
    matching_response = await client.post(
        "/api/v1/books",
        json={**BOOK_PAYLOAD, "title": "Guide des jupes"},
    )
    unrelated_response = await client.post(
        "/api/v1/books",
        json={
            **BOOK_PAYLOAD,
            "isbn": "9782212678840",
            "title": "Sacs et pochettes",
            "description": "Des accessoires textiles pour la maison.",
            "project_types": ["bag", "pouch"],
        },
    )

    response = await client.get("/api/v1/books?q=jupe")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == matching_response.json()["id"]
    assert unrelated_response.json()["id"] not in {item["id"] for item in payload["items"]}


async def test_reject_invalid_magazine_ean(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/books",
        json={**MAGAZINE_PAYLOAD, "ean": "1234567890123"},
    )

    assert response.status_code == 422


async def test_reject_incomplete_magazine_pending_validation(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/books",
        json={"type": "magazine", "title": "Burda Style", "status": "pending_validation"},
    )

    assert response.status_code == 422


async def test_list_books_is_paginated(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    response = await client.get("/api/v1/books?limit=10&offset=0")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["limit"] == 10
    assert len(payload["items"]) == 1


async def test_list_books_can_filter_document_type(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    magazine_response = await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)

    response = await client.get("/api/v1/books?document_type=magazine")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == magazine_response.json()["id"]


async def test_reject_invalid_isbn(client: AsyncClient) -> None:
    response = await client.post("/api/v1/books", json={**BOOK_PAYLOAD, "isbn": "bad-isbn"})

    assert response.status_code == 422


async def test_reject_invalid_enum_value(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/books", json={**BOOK_PAYLOAD, "difficulty_levels": ["expert"]}
    )

    assert response.status_code == 422


async def test_allow_incomplete_draft(client: AsyncClient) -> None:
    response = await client.post("/api/v1/books", json={"status": "draft", "tags": ["a revoir"]})

    assert response.status_code == 201
    assert response.json()["isbn"] is None
    assert response.json()["status"] == "draft"


async def test_reject_incomplete_pending_validation(client: AsyncClient) -> None:
    response = await client.post("/api/v1/books", json={"status": "pending_validation"})

    assert response.status_code == 422


async def test_search_books(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    response = await client.get("/api/v1/books/search?q=serger")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["title"] == BOOK_PAYLOAD["title"]


async def test_search_books_by_available_size(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    response = await client.get("/api/v1/books/search?q=38")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["available_sizes"] == ["34", "36", "38"]


async def test_search_books_by_available_size_range(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    response = await client.get("/api/v1/books/search?q=34-46")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["available_size_ranges"] == ["34-46"]


async def test_update_book(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    book_id = create_response.json()["id"]

    response = await client.put(f"/api/v1/books/{book_id}", json={"title": "Couture avancee"})

    assert response.status_code == 200
    assert response.json()["title"] == "Couture avancee"


async def test_update_magazine_adds_new_pattern(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=MAGAZINE_PAYLOAD)
    magazine_id = create_response.json()["id"]

    response = await client.put(
        f"/api/v1/books/{magazine_id}",
        json={
            "pattern_sheet_second_url": (
                "https://example.com/covers/burda-double-page-droite.jpg"
            ),
            "magazine_patterns": [
                {
                    "model_name": "Veste courte",
                    "magazine_pattern_identifier": "104",
                    "cover_url": "https://example.com/covers/veste-courte.jpg",
                    "difficulty_levels": ["intermediate"],
                    "target_audiences": ["women"],
                    "main_categories": ["clothing"],
                    "project_types": ["jacket"],
                }
            ]
        },
    )

    assert response.status_code == 200
    updated = response.json()
    assert (
        updated["pattern_sheet_second_url"]
        == "https://example.com/covers/burda-double-page-droite.jpg"
    )
    assert len(updated["patterns"]) == 1
    assert updated["patterns"][0]["model_name"] == "Veste courte"
    assert updated["patterns"][0]["magazine_pattern_identifier"] == "104"

    patterns_response = await client.get("/api/v1/patterns/search?q=Veste")
    assert patterns_response.status_code == 200
    assert patterns_response.json()["items"][0]["source_magazine"]["id"] == magazine_id


async def test_update_book_to_validated_sets_validation_date(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    book_id = create_response.json()["id"]

    response = await client.put(f"/api/v1/books/{book_id}", json={"status": "validated"})

    assert response.status_code == 200
    assert response.json()["status"] == "validated"
    assert response.json()["validated_at"] is not None


async def test_delete_book(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    book_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/v1/books/{book_id}")
    get_response = await client.get(f"/api/v1/books/{book_id}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404
