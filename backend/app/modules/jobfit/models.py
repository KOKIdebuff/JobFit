from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime


class CandidateCompetencyProfile(Base):
    __tablename__ = "candidate_competency_profiles"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    owner_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), index=True)
    resume_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("resumes.id"), index=True)
    skills_json: Mapped[str] = mapped_column(Text, default="[]")
    projects_json: Mapped[str] = mapped_column(Text, default="[]")
    experience_json: Mapped[str] = mapped_column(Text, default="[]")
    education_json: Mapped[str] = mapped_column(Text, default="[]")
    competency_tags_json: Mapped[str] = mapped_column(Text, default="[]")
    resume_evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    schema_version: Mapped[str] = mapped_column(String(40), default="candidate_profile_v1")
    data_source: Mapped[str] = mapped_column(String(40), default="deterministic")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class JobCompetencyProfile(Base):
    __tablename__ = "job_competency_profiles"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    owner_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), index=True)
    job_role: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(160))
    jd_text: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[int] = mapped_column(Integer, default=2)
    profile_version: Mapped[str] = mapped_column(String(40))
    source_profile_id: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class JobCompetency(Base):
    __tablename__ = "job_competencies"
    __table_args__ = (UniqueConstraint("profile_id", "competency_id"),)

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("job_competency_profiles.id", ondelete="CASCADE"), index=True
    )
    competency_id: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    weight: Mapped[float] = mapped_column(Float)
    rubric_json: Mapped[str] = mapped_column(Text)
    question_strategy_json: Mapped[str] = mapped_column(Text)
    evidence_requirements_json: Mapped[str] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer)


class AssessmentCase(Base):
    __tablename__ = "assessment_cases"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    candidate_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), index=True)
    resume_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("resumes.id"))
    candidate_profile_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("candidate_competency_profiles.id")
    )
    job_profile_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("job_competency_profiles.id"))
    status: Mapped[str] = mapped_column(String(40), default="ready")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    assessment_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("assessment_cases.id", ondelete="CASCADE"), unique=True, index=True
    )
    status: Mapped[str] = mapped_column(String(40), default="PREPARING")
    current_competency_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    current_difficulty: Mapped[int] = mapped_column(Integer, default=1)
    turn_count: Mapped[int] = mapped_column(Integer, default=0)
    version: Mapped[int] = mapped_column(Integer, default=0)
    covered_competencies_json: Mapped[str] = mapped_column(Text, default="[]")
    unresolved_signals_json: Mapped[str] = mapped_column(Text, default="[]")
    started_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    __table_args__ = (
        UniqueConstraint("session_id", "client_request_id"),
        UniqueConstraint("session_id", "turn_index", "role"),
    )

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True
    )
    turn_index: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    input_method: Mapped[str] = mapped_column(String(30), default="text")
    competency_id: Mapped[str] = mapped_column(String(80))
    question_strategy: Mapped[str] = mapped_column(String(50))
    difficulty: Mapped[int] = mapped_column(Integer)
    client_request_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class AnswerAssessment(Base):
    __tablename__ = "answer_assessments"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id"), index=True
    )
    question_id: Mapped[str] = mapped_column(String(120))
    answer_id: Mapped[str] = mapped_column(String(120), unique=True)
    competency_id: Mapped[str] = mapped_column(String(80))
    relevance: Mapped[float] = mapped_column(Float)
    depth: Mapped[float] = mapped_column(Float)
    correctness: Mapped[float] = mapped_column(Float)
    specificity: Mapped[float] = mapped_column(Float)
    evidence_strength: Mapped[float] = mapped_column(Float)
    uncertainty: Mapped[float] = mapped_column(Float)
    missing_points_json: Mapped[str] = mapped_column(Text, default="[]")
    contradictions_json: Mapped[str] = mapped_column(Text, default="[]")
    competency_signal_json: Mapped[str] = mapped_column(Text, default="{}")
    recommended_next_action: Mapped[str] = mapped_column(String(50))
    provider: Mapped[str] = mapped_column(String(40), default="deterministic")
    model: Mapped[str] = mapped_column(String(80), default="deterministic-v1")
    prompt_version: Mapped[str] = mapped_column(String(80), default="answer_assessment_v1")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class CompetencyEvidence(Base):
    __tablename__ = "competency_evidence"
    __table_args__ = (UniqueConstraint("session_id", "answer_id", "signal"),)

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id"), index=True
    )
    competency_id: Mapped[str] = mapped_column(String(80), index=True)
    source: Mapped[str] = mapped_column(String(40), default="interview_answer")
    question_id: Mapped[str] = mapped_column(String(120))
    answer_id: Mapped[str] = mapped_column(String(120))
    signal: Mapped[str] = mapped_column(Text)
    strength: Mapped[float] = mapped_column(Float)
    polarity: Mapped[str] = mapped_column(String(20), default="supports")
    supported_level: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class InterviewMemory(Base):
    __tablename__ = "interview_memories"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True
    )
    summary_memory: Mapped[str] = mapped_column(Text, default="")
    evidence_memory_json: Mapped[str] = mapped_column(Text, default="[]")
    unresolved_signals_json: Mapped[str] = mapped_column(Text, default="[]")
    last_compacted_turn: Mapped[int] = mapped_column(Integer, default=0)
    version: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class RetrievalTrace(Base):
    __tablename__ = "retrieval_traces"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id"), index=True
    )
    turn_index: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(String(50))
    query_summary: Mapped[str] = mapped_column(String(240))
    source_ids_json: Mapped[str] = mapped_column(Text)
    scores_json: Mapped[str] = mapped_column(Text)
    knowledge_version: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class LLMInvocation(Base):
    __tablename__ = "llm_invocations"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True
    )
    turn_index: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(String(50))
    provider: Mapped[str] = mapped_column(String(40))
    model: Mapped[str] = mapped_column(String(120))
    prompt_version: Mapped[str] = mapped_column(String(80))
    knowledge_version: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20))
    error_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)


class AssessmentReport(Base):
    __tablename__ = "assessment_reports"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    assessment_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("assessment_cases.id", ondelete="CASCADE"), unique=True
    )
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True
    )
    status: Mapped[str] = mapped_column(String(40), default="ready")
    version: Mapped[int] = mapped_column(Integer, default=1)
    overall_score: Mapped[int] = mapped_column(Integer)
    fit_score: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String(40))
    competency_scores_json: Mapped[str] = mapped_column(Text)
    boundaries_json: Mapped[str] = mapped_column(Text)
    strengths_json: Mapped[str] = mapped_column(Text)
    gaps_json: Mapped[str] = mapped_column(Text)
    recommendations_json: Mapped[str] = mapped_column(Text)
    evidence_refs_json: Mapped[str] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
