from httpx import AsyncClient

PATTERN_PAYLOAD = {
    "model_name": "Robe Magnolia",
    "designer_name": "Atelier Couture",
    "format": "both",
    "description": "Une robe portefeuille fluide avec plusieurs longueurs de manches.",
    "cover_url": "https://example.com/patterns/robe-magnolia.jpg",
    "second_cover_url": "https://example.com/patterns/robe-magnolia-dos.jpg",
    "difficulty_levels": ["intermediate"],
    "target_audiences": ["women"],
    "main_categories": ["clothing"],
    "project_types": ["dress"],
    "available_sizes": ["34", "36", "38"],
    "available_size_ranges": ["34-46"],
    "status": "draft",
}


async def test_create_and_get_pattern(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["model_name"] == PATTERN_PAYLOAD["model_name"]
    assert created["designer_name"] == PATTERN_PAYLOAD["designer_name"]
    assert created["format"] == "both"
    assert created["second_cover_url"] == PATTERN_PAYLOAD["second_cover_url"]
    assert created["main_categories"] == ["clothing"]
    assert created["available_sizes"] == ["34", "36", "38"]
    assert created["available_size_ranges"] == ["34-46"]
    assert created["creator"]["first_name"] == "Tania"
    assert created["last_modifier"] == created["creator"]

    get_response = await client.get(f"/api/v1/patterns/{created['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["id"] == created["id"]


async def test_reject_technique_category_for_pattern(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/patterns",
        json={**PATTERN_PAYLOAD, "main_categories": ["technique"]},
    )

    assert response.status_code == 422


async def test_allow_incomplete_pattern_draft(client: AsyncClient) -> None:
    response = await client.post("/api/v1/patterns", json={"status": "draft"})

    assert response.status_code == 201
    assert response.json()["model_name"] is None
    assert response.json()["status"] == "draft"


async def test_create_pattern_accepts_internal_media_urls(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/patterns",
        json={
            **PATTERN_PAYLOAD,
            "cover_url": "/media/uploads/pattern.webp",
            "second_cover_url": "/media/uploads/pattern-detail.webp",
            "measurement_chart_url": "/media/uploads/measurements.webp",
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["cover_url"] == "/media/uploads/pattern.webp"
    assert created["second_cover_url"] == "/media/uploads/pattern-detail.webp"
    assert created["measurement_chart_url"] == "/media/uploads/measurements.webp"


async def test_reject_incomplete_pattern_pending_validation(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/patterns",
        json={"model_name": "Robe Magnolia", "status": "pending_validation"},
    )

    assert response.status_code == 422


async def test_search_patterns(client: AsyncClient) -> None:
    await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)

    response = await client.get("/api/v1/patterns/search?q=both")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["model_name"] == PATTERN_PAYLOAD["model_name"]


async def test_search_patterns_by_available_size(client: AsyncClient) -> None:
    await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)

    response = await client.get("/api/v1/patterns/search?q=38")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["available_sizes"] == ["34", "36", "38"]


async def test_search_patterns_by_available_size_range(client: AsyncClient) -> None:
    await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)

    response = await client.get("/api/v1/patterns/search?q=34-46")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["available_size_ranges"] == ["34-46"]


async def test_search_patterns_by_french_project_type(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/patterns",
        json={**PATTERN_PAYLOAD, "model_name": "Modele d'ete", "project_types": ["skirt"]},
    )
    unrelated_response = await client.post(
        "/api/v1/patterns",
        json={
            **PATTERN_PAYLOAD,
            "model_name": "Sac cabas",
            "description": "Un grand sac double.",
            "main_categories": ["accessories"],
            "project_types": ["bag"],
        },
    )
    unrelated = unrelated_response.json()

    response = await client.get("/api/v1/patterns/search?q=jupe")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["model_name"] == "Modele d'ete"
    assert unrelated["id"] not in {item["id"] for item in payload["items"]}


async def test_list_patterns_with_query_filters_results(client: AsyncClient) -> None:
    matching_response = await client.post(
        "/api/v1/patterns",
        json={**PATTERN_PAYLOAD, "model_name": "Jupe d'ete", "project_types": ["skirt"]},
    )
    unrelated_response = await client.post(
        "/api/v1/patterns",
        json={
            **PATTERN_PAYLOAD,
            "model_name": "Sac cabas",
            "description": "Un grand sac double.",
            "main_categories": ["accessories"],
            "project_types": ["bag"],
        },
    )

    response = await client.get("/api/v1/patterns?q=jupe")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == matching_response.json()["id"]
    assert unrelated_response.json()["id"] not in {item["id"] for item in payload["items"]}


async def test_update_pattern_to_validated_sets_validation_date(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)
    pattern_id = create_response.json()["id"]

    response = await client.put(f"/api/v1/patterns/{pattern_id}", json={"status": "validated"})

    assert response.status_code == 200
    assert response.json()["status"] == "validated"
    assert response.json()["validated_at"] is not None


async def test_update_pattern_adds_second_photo(client: AsyncClient) -> None:
    create_response = await client.post(
        "/api/v1/patterns",
        json={**PATTERN_PAYLOAD, "second_cover_url": None},
    )
    pattern_id = create_response.json()["id"]

    response = await client.put(
        f"/api/v1/patterns/{pattern_id}",
        json={"second_cover_url": "https://example.com/patterns/robe-magnolia-detail.jpg"},
    )

    assert response.status_code == 200
    assert (
        response.json()["second_cover_url"]
        == "https://example.com/patterns/robe-magnolia-detail.jpg"
    )


async def test_delete_pattern(client: AsyncClient) -> None:
    create_response = await client.post("/api/v1/patterns", json=PATTERN_PAYLOAD)
    pattern_id = create_response.json()["id"]

    delete_response = await client.delete(f"/api/v1/patterns/{pattern_id}")
    get_response = await client.get(f"/api/v1/patterns/{pattern_id}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404
