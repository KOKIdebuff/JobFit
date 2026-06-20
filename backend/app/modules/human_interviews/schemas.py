from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

InterviewType = Literal["online", "offline"]
BookingStatus = Literal[
    "draft",
    "pending_confirmation",
    "confirmed",
    "rescheduled",
    "cancelled",
    "completed",
    "candidate_no_show",
    "interviewer_no_show",
    "expired",
]
ReportStatus = Literal["draft", "pending_hr_review", "published"]


class LocationTemplateInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    address: str = Field(min_length=1, max_length=1200)
    arrival_instructions: str = Field(default="", max_length=1200)
    contact_name: str = Field(default="", max_length=120)
    contact_phone: str = Field(default="", max_length=80)

    @field_validator("title", "address", "arrival_instructions", "contact_name", "contact_phone")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class CreateInvitationRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=120)
    primary_interviewer_user_id: UUID
    interview_type: InterviewType
    meeting_url: str | None = Field(default=None, max_length=600)
    location: LocationTemplateInput | None = None

    @field_validator("application_id", "meeting_url")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()


class CreateAvailabilitySlotRequest(BaseModel):
    interviewer_id: str = Field(min_length=1, max_length=120)
    start_at: datetime
    duration_minutes: int = Field(default=60, ge=30, le=240)


class BookingContactInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=80)

    @field_validator("name", "email", "phone")
    @classmethod
    def strip_contact(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()


class CreateBookingRequest(BaseModel):
    slot_id: str = Field(min_length=1, max_length=120)
    contact: BookingContactInput


class CancelBookingRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1200)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class RescheduleBookingRequest(BaseModel):
    slot_id: str = Field(min_length=1, max_length=120)
    reason: str | None = Field(default=None, max_length=1200)

    @field_validator("slot_id", "reason")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class MarkBookingRequest(BaseModel):
    status: Literal["completed", "candidate_no_show", "interviewer_no_show"]
    reason: str | None = Field(default=None, max_length=1200)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class RequestPendingConfirmationRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1200)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class CompletePendingConfirmationRequest(BaseModel):
    meeting_url: str | None = Field(default=None, max_length=600)
    location: LocationTemplateInput | None = None

    @field_validator("meeting_url")
    @classmethod
    def strip_meeting_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class MaintenanceResultDto(BaseModel):
    processed_count: int
    booking_ids: list[str]


class SubmitReportRequest(BaseModel):
    conclusion: str = Field(min_length=1, max_length=3000)
    competencies: list[str] = Field(default_factory=list, max_length=20)
    key_observations: str = Field(default="", max_length=3000)
    risks: str = Field(default="", max_length=3000)
    candidate_summary: str = Field(min_length=1, max_length=3000)
    internal_notes: str = Field(default="", max_length=3000)

    @field_validator(
        "conclusion",
        "key_observations",
        "risks",
        "candidate_summary",
        "internal_notes",
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class InvitationDto(BaseModel):
    id: str
    token: str
    application_id: str
    candidate_id: UUID
    primary_interviewer_id: str
    interview_type: InterviewType
    status: str
    expires_at: datetime


class SlotDto(BaseModel):
    id: str
    interviewer_id: str
    start_at: datetime
    end_at: datetime
    status: str


class BookingDto(BaseModel):
    id: str
    application_id: str
    status: BookingStatus
    interview_type: InterviewType
    start_at: datetime
    end_at: datetime
    candidate_id: UUID
    primary_interviewer_id: str
    rescheduled_from_id: str | None = None
    pending_confirmation_expires_at: datetime | None = None
    meeting: dict[str, object] | None = None


class ReportDto(BaseModel):
    id: str
    booking_id: str
    status: ReportStatus
    conclusion: str | None = None
    competencies: list[str]
    key_observations: str | None = None
    risks: str | None = None
    candidate_summary: str
    internal_notes: str | None = None
