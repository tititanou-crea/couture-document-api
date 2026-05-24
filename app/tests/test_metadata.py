from httpx import AsyncClient

from app.tests.test_books import BOOK_PAYLOAD


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
