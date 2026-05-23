from enum import StrEnum
from typing import Any

from sqlalchemy import JSON
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


class EnumList(TypeDecorator[list[str]]):
    impl = JSON
    cache_ok = True

    def __init__(self, enum_class: type[StrEnum], enum_name: str) -> None:
        super().__init__()
        self.enum_class = enum_class
        self.enum_name = enum_name

    def load_dialect_impl(self, dialect: Dialect) -> Any:
        if dialect.name == "postgresql":
            enum_type = SQLAlchemyEnum(
                self.enum_class,
                name=self.enum_name,
                values_callable=lambda enum: [item.value for item in enum],
            )
            return dialect.type_descriptor(ARRAY(enum_type))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value: list[StrEnum | str] | None, dialect: Dialect) -> list[str]:
        if not value:
            return []
        return [item.value if isinstance(item, StrEnum) else item for item in value]

    def process_result_value(self, value: list[str] | None, dialect: Dialect) -> list[str]:
        return value or []

