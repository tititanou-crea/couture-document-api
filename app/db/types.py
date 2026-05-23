from typing import Any

from sqlalchemy import JSON, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


class StringList(TypeDecorator[list[str]]):
    impl = JSON
    cache_ok = True

    def __init__(self, length: int) -> None:
        super().__init__()
        self.length = length

    def load_dialect_impl(self, dialect: Dialect) -> Any:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(ARRAY(String(self.length)))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value: list[str] | None, dialect: Dialect) -> list[str]:
        return value or []

