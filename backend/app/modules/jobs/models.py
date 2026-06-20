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


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    company: Mapped[str] = mapped_column(String(160), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    employment_type: Mapped[str] = mapped_column(String(80), nullable=False, default="full_time")
    status: Mapped[str] = mapped_column(String(40), nullable=False, index=True, default="draft")
    jd_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    profile_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    data_source: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    applications: Mapped[list[Application]] = relationship(back_populates="job")
