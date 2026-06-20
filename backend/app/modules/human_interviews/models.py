from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base
from app.db.types import GUID, UTCDateTime
from app.modules.applications_matches.models import Application


class Interviewer(Base):
    __tablename__ = "human_interviewers"
    __table_args__ = (UniqueConstraint("user_id", name="uq_human_interviewers_user_id"),)

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    organization_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("organizations.id"), nullable=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    timezone: Mapped[str] = mapped_column(String(80), nullable=False, default="Asia/Shanghai")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class InterviewLocationTemplate(Base):
    __tablename__ = "human_interview_location_templates"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    organization_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("organizations.id"), nullable=True, index=True
    )
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    arrival_instructions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    contact_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    contact_phone: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class MeetingInformation(Base):
    __tablename__ = "human_interview_meeting_information"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    organization_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("organizations.id"), nullable=True, index=True
    )
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    interview_type: Mapped[str] = mapped_column(String(24), nullable=False, index=True)
    meeting_url: Mapped[str] = mapped_column(String(600), nullable=False, default="")
    location_template_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("human_interview_location_templates.id"), nullable=True, index=True
    )
    details_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class InterviewInvitation(Base):
    __tablename__ = "human_interview_invitations"
    __table_args__ = (UniqueConstraint("token", name="uq_human_interview_invitations_token"),)

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    token: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    primary_interviewer_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interviewers.id"), nullable=False, index=True
    )
    interview_type: Mapped[str] = mapped_column(String(24), nullable=False, index=True)
    meeting_information_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interview_meeting_information.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    application: Mapped[Application] = relationship()
    primary_interviewer: Mapped[Interviewer] = relationship()
    meeting_information: Mapped[MeetingInformation] = relationship()


class AvailabilitySlot(Base):
    __tablename__ = "human_interview_availability_slots"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    interviewer_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interviewers.id"), nullable=False, index=True
    )
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    start_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    end_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    interviewer: Mapped[Interviewer] = relationship()


class HumanInterviewSession(Base):
    __tablename__ = "human_interview_sessions"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="scheduled", index=True)
    started_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class InterviewBooking(Base):
    __tablename__ = "human_interview_bookings"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    invitation_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interview_invitations.id"), nullable=False, index=True
    )
    application_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("jobs.id"), nullable=False, index=True)
    candidate_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    primary_interviewer_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interviewers.id"), nullable=False, index=True
    )
    slot_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interview_availability_slots.id"), nullable=False, index=True
    )
    session_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interview_sessions.id"), nullable=False, index=True
    )
    meeting_information_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("human_interview_meeting_information.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="confirmed", index=True)
    interview_type: Mapped[str] = mapped_column(String(24), nullable=False, index=True)
    start_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    end_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    buffer_end_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, index=True)
    candidate_contact_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    candidate_reschedule_count: Mapped[int] = mapped_column(nullable=False, default=0)
    company_reschedule_count: Mapped[int] = mapped_column(nullable=False, default=0)
    rescheduled_from_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("human_interview_bookings.id"), nullable=True, index=True
    )
    pending_confirmation_expires_at: Mapped[datetime | None] = mapped_column(
        UTCDateTime(), nullable=True, index=True
    )
    pending_confirmation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_by: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    company_late_cancel: Mapped[bool] = mapped_column(nullable=False, default=False)
    confirmed_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    invitation: Mapped[InterviewInvitation] = relationship()
    primary_interviewer: Mapped[Interviewer] = relationship()
    slot: Mapped[AvailabilitySlot] = relationship()
    session: Mapped[HumanInterviewSession] = relationship()
    meeting_information: Mapped[MeetingInformation] = relationship()


class BookingParticipant(Base):
    __tablename__ = "human_interview_booking_participants"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    booking_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("human_interview_bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class BookingStatusHistory(Base):
    __tablename__ = "human_interview_booking_status_history"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    booking_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("human_interview_bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    previous_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    next_status: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    actor_id: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)


class HumanInterviewReport(Base):
    __tablename__ = "human_interview_reports"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    booking_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("human_interview_bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft", index=True)
    conclusion: Mapped[str] = mapped_column(Text, nullable=False)
    competency_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    key_observations: Mapped[str] = mapped_column(Text, nullable=False, default="")
    risks: Mapped[str] = mapped_column(Text, nullable=False, default="")
    candidate_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    internal_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_by: Mapped[UUID] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=False, index=True
    )
    submitted_by: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    published_by: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

    booking: Mapped[InterviewBooking] = relationship()


class BookingAuditRecord(Base):
    __tablename__ = "human_interview_audit_records"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    actor_id: Mapped[UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_id: Mapped[UUID | None] = mapped_column(GUID(), nullable=True, index=True)
    sensitive: Mapped[bool] = mapped_column(nullable=False, default=False)
    details_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)
