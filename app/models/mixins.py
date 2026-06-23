import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from app.core.enums import DocumentStatus
from app.db.types import StringList


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class BaseDocumentMixin(UUIDPrimaryKeyMixin, TimestampMixin):
    __abstract__ = True

    title: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(12), nullable=False, default="fr")
    cover_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    categories: Mapped[list[str]] = mapped_column(StringList(120), nullable=False, default=list)
    tags: Mapped[list[str]] = mapped_column(StringList(80), nullable=False, default=list)


class ValidationWorkflowMixin:
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(
            DocumentStatus,
            name="document_status",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=False,
        default=DocumentStatus.DRAFT,
    )

    @declared_attr
    def created_by(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    @declared_attr
    def last_modified_by(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    @declared_attr
    def validated_by(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    @declared_attr
    def creator(cls):
        return relationship("User", foreign_keys=[cls.created_by], lazy="joined")

    @declared_attr
    def last_modifier(cls):
        return relationship("User", foreign_keys=[cls.last_modified_by], lazy="joined")

    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
