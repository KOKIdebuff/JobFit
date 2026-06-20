from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime

if TYPE_CHECKING:
    from app.modules.ai_runs.models import AiRun
    from app.modules.jobs.models import Job
    from app.modules.reports.models import EvaluationReport
    from app.modules.resumes.models import Resume
    from app.modules.trials.models import TrialSubmission, TrialTask


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),
    )

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    job_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    resume_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("resumes.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(60), nullable=False, index=True, default="applied")
    detail_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    job: Mapped[Job] = relationship(back_populates="applications")
    resume: Mapped[Resume] = relationship(back_populates="applications")
    match_result: Mapped[MatchResult | None] = relationship(back_populates="application")
    trial_task: Mapped[TrialTask | None] = relationship(back_populates="application")
    trial_submission: Mapped[TrialSubmission | None] = relationship(back_populates="application")
    report: Mapped[EvaluationReport | None] = relationship(back_populates="application")
    decision: Mapped[RecruitmentDecision | None] = relationship(back_populates="application")
    ai_runs: Mapped[list[AiRun]] = relationship(back_populates="application")


class MatchResult(Base):
    __tablename__ = "match_results"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    total_score: Mapped[int] = mapped_column(nullable=False, default=0)
    rule_version: Mapped[str] = mapped_column(String(80), nullable=False, default="match_rule_v1")
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    data_source: Mapped[str] = mapped_column(String(40), nullable=False, default="mock")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application] = relationship(back_populates="match_result")


class RecruitmentDecision(Base):
    __tablename__ = "recruitment_decisions"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="pending")
    outcome: Mapped[str | None] = mapped_column(String(80), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_by: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    version: Mapped[int] = mapped_column(nullable=False, default=0)
    history_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application] = relationship(back_populates="decision")
