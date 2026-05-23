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
    assert created["status"] == "draft"

    get_response = await client.get(f"/api/v1/books/{created['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["id"] == created["id"]


async def test_list_books_is_paginated(client: AsyncClient) -> None:
    await client.post("/api/v1/books", json=BOOK_PAYLOAD)

    response = await client.get("/api/v1/books?limit=10&offset=0")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["limit"] == 10
    assert len(payload["items"]) == 1


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


async def test_update_book(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/books", json=BOOK_PAYLOAD)
    book_id = create_response.json()["id"]

    response = await client.put(f"/api/v1/books/{book_id}", json={"title": "Couture avancee"})

    assert response.status_code == 200
    assert response.json()["title"] == "Couture avancee"


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
