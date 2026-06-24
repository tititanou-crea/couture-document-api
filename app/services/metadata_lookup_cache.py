from __future__ import annotations

from time import monotonic

_CACHE_TTL_SECONDS = 300
_cache: dict[str, tuple[float, object]] = {}


def get_cached_metadata(key: str) -> object | None:
    cached = _cache.get(key)
    if cached is None:
        return None

    expires_at, value = cached
    if expires_at <= monotonic():
        _cache.pop(key, None)
        return None

    return value


def set_cached_metadata(key: str, value: object) -> None:
    _cache[key] = (monotonic() + _CACHE_TTL_SECONDS, value)


def clear_metadata_lookup_cache() -> None:
    _cache.clear()
