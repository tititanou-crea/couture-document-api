import base64
import hashlib
import hmac
import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("$2"):
        return bcrypt.checkpw(password.encode(), hashed_password.encode())

    # Compatibility for development databases created before the bcrypt migration.
    try:
        algorithm, iterations, salt, expected_digest = hashed_password.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations))
    return hmac.compare_digest(digest.hex(), expected_digest)


def create_access_token(subject: uuid.UUID, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return _encode_jwt(payload)


def _encode_jwt(payload: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_segment = _base64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_segment = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_segment}.{payload_segment}".encode()
    signature = hmac.new(settings.SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    return f"{header_segment}.{payload_segment}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise UnauthorizedError("Token invalide") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode()
    expected_signature = hmac.new(
        settings.SECRET_KEY.encode(),
        signing_input,
        hashlib.sha256,
    ).digest()
    if not hmac.compare_digest(_base64url_decode(signature_segment), expected_signature):
        raise UnauthorizedError("Token invalide")

    try:
        header = json.loads(_base64url_decode(header_segment))
        payload = json.loads(_base64url_decode(payload_segment))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise UnauthorizedError("Token invalide") from exc

    if header.get("alg") != "HS256" or header.get("typ") != "JWT":
        raise UnauthorizedError("Token invalide")
    if not payload.get("sub"):
        raise UnauthorizedError("Token invalide")
    if payload.get("exp") and datetime.now(UTC).timestamp() > int(payload["exp"]):
        raise UnauthorizedError("Session expiree")

    return payload


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
