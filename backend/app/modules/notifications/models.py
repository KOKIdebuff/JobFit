from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (UniqueConstraint("dedupe_key", name="uq_notifications_dedupe_key"),)

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    recipient_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    entity_public_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    dedupe_key: Mapped[str | None] = mapped_column(String(240), nullable=True, index=True)
    remind_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="unread", index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    read_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
