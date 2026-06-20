from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime

if TYPE_CHECKING:
    from app.modules.applications_matches.models import Application


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    owner_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False, default="text/plain")
    size_bytes: Mapped[int] = mapped_column(nullable=False, default=0)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    structured_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="completed")
    data_source: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    applications: Mapped[list[Application]] = relationship(back_populates="resume")
