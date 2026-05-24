def async_engine_options(database_url: str) -> dict[str, object]:
    if database_url.startswith("postgresql+asyncpg://"):
        return {"connect_args": {"statement_cache_size": 0}}
    return {}
