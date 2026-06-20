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


class TrialTask(Base):
    __tablename__ = "trial_tasks"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="ungenerated")
    source: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_by: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application] = relationship(back_populates="trial_task")


class TrialSubmission(Base):
    __tablename__ = "trial_submissions"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="empty")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    prototype_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    attachments_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    evaluation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    submit_count: Mapped[int] = mapped_column(nullable=False, default=0)
    submitted_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application] = relationship(back_populates="trial_submission")
