from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime

if TYPE_CHECKING:
    from app.modules.applications_matches.models import Application


class AiRun(Base):
    __tablename__ = "ai_runs"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    application_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True
    )
    actor_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    operation: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")
    model: Mapped[str] = mapped_column(String(80), nullable=False, default="mock-structured-v1")
    prompt_version: Mapped[str] = mapped_column(String(80), nullable=False)
    schema_version: Mapped[str] = mapped_column(String(80), nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=1200)
    started_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    fallback_source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    input_summary: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    output_summary: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application | None] = relationship(back_populates="ai_runs")
