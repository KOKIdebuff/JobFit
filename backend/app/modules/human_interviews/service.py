from __future__ import annotations

import json
import secrets
from datetime import timedelta
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.exceptions import AppException
from app.core.time import utc_now
from app.modules.applications_matches.models import Application
from app.modules.auth_users.models import User
from app.modules.auth_users.schemas import AuthUser
from app.modules.human_interviews.models import (
    AvailabilitySlot,
    BookingAuditRecord,
    BookingParticipant,
    BookingStatusHistory,
    HumanInterviewReport,
    HumanInterviewSession,
    InterviewBooking,
    Interviewer,
    InterviewInvitation,
    InterviewLocationTemplate,
    MeetingInformation,
)
from app.modules.human_interviews.schemas import (
    BookingDto,
    CancelBookingRequest,
    CompletePendingConfirmationRequest,
    CreateAvailabilitySlotRequest,
    CreateBookingRequest,
    CreateInvitationRequest,
    InvitationDto,
    MaintenanceResultDto,
    MarkBookingRequest,
    ReportDto,
    RequestPendingConfirmationRequest,
    RescheduleBookingRequest,
    SlotDto,
    SubmitReportRequest,
)
from app.modules.notifications.models import Notification
from app.modules.reports.models import EvaluationReport

ACTIVE_BOOKING_STATUSES = {"draft", "pending_confirmation", "confirmed"}
TERMINAL_BOOKING_STATUSES = {
    "rescheduled",
    "cancelled",
    "completed",
    "candidate_no_show",
    "interviewer_no_show",
    "expired",
}
BOOKING_BUFFER_MINUTES = 15
INVITATION_TTL_DAYS = 3
BOOKING_OPEN_DAYS = 14
BOOKING_STOP_HOURS = 24
PENDING_CONFIRMATION_TTL_HOURS = 6
REMINDER_WINDOW_HOURS = 24


def dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def loads_dict(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    parsed = json.loads(value)
    return parsed if isinstance(parsed, dict) else {}


def loads_list(value: str | None) -> list[Any]:
    if not value:
        return []
    parsed = json.loads(value)
    return parsed if isinstance(parsed, list) else []


def new_public_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class HumanInterviewService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_invitation(self, user: AuthUser, payload: CreateInvitationRequest) -> InvitationDto:
        self._require_role(user, "hr")
        application = self._application_for_hr(user, payload.application_id)
        self._ensure_upstream_ready(application)
        interviewer = self._ensure_interviewer(user, payload.primary_interviewer_user_id)
        meeting = self._create_meeting_information(user, payload)
        now = utc_now()
        invitation = InterviewInvitation(
            public_id=new_public_id("human_interview_invitation"),
            token=secrets.token_urlsafe(32),
            application_id=application.id,
            job_id=application.job_id,
            candidate_id=application.candidate_id,
            created_by=user.id,
            primary_interviewer_id=interviewer.id,
            interview_type=payload.interview_type,
            meeting_information_id=meeting.id,
            status="active",
            expires_at=now + timedelta(days=INVITATION_TTL_DAYS),
            created_at=now,
            updated_at=now,
        )
        application.status = "interview_invited"
        application.updated_at = now
        self.session.add(invitation)
        self._audit(
            user,
            action="human_interview.invitation.created",
            entity_type="human_interview_invitation",
            entity_id=invitation.id,
            details={
                "application_id": application.public_id,
                "interview_type": payload.interview_type,
            },
        )
        self._notify(
            application.candidate_id,
            "human_interview_invited",
            "真人面试预约邀请已创建",
            "请登录后通过预约入口选择可用时间。",
            {"application_id": application.public_id},
        )
        self._commit()
        return self.invitation_dto(invitation)

    def revoke_invitation(self, user: AuthUser, invitation_id: str) -> InvitationDto:
        self._require_role(user, "hr")
        invitation = self._invitation_for_hr(user, invitation_id)
        if invitation.status == "active":
            now = utc_now()
            invitation.status = "revoked"
            invitation.revoked_at = now
            invitation.updated_at = now
            self._audit(
                user,
                action="human_interview.invitation.revoked",
                entity_type="human_interview_invitation",
                entity_id=invitation.id,
                details={"invitation_id": invitation.public_id},
            )
            self._commit()
        return self.invitation_dto(invitation)

    def create_availability_slot(
        self, user: AuthUser, payload: CreateAvailabilitySlotRequest
    ) -> SlotDto:
        self._require_role(user, "hr")
        interviewer = self._interviewer_for_hr(user, payload.interviewer_id)
        start_at = payload.start_at
        if start_at.tzinfo is None:
            raise AppException(ErrorCode.INTERVIEW_INVALID_STATE, details={"field": "start_at"})
        if start_at.minute not in {0, 30} or start_at.second != 0 or start_at.microsecond != 0:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "slot_start_must_use_30_minute_granularity"},
            )
        now = utc_now()
        if start_at <= now + timedelta(hours=BOOKING_STOP_HOURS):
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "booking_stops_24h_before_start"},
            )
        if start_at > now + timedelta(days=BOOKING_OPEN_DAYS):
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "booking_window_14_days"}
            )
        slot = AvailabilitySlot(
            public_id=new_public_id("human_interview_slot"),
            interviewer_id=interviewer.id,
            created_by=user.id,
            start_at=start_at,
            end_at=start_at + timedelta(minutes=payload.duration_minutes),
            status="open",
            created_at=now,
            updated_at=now,
        )
        self.session.add(slot)
        self._audit(
            user,
            action="human_interview.slot.created",
            entity_type="human_interview_availability_slot",
            entity_id=slot.id,
            details={"interviewer_id": interviewer.public_id},
        )
        self._commit()
        return self.slot_dto(slot)

    def invitation_preview(self, user: AuthUser, token: str) -> dict[str, Any]:
        self._require_role(user, "candidate")
        invitation = self._active_invitation_by_token(token)
        if invitation.candidate_id != user.id:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        now = utc_now()
        slots = self.session.scalars(
            select(AvailabilitySlot)
            .where(
                AvailabilitySlot.interviewer_id == invitation.primary_interviewer_id,
                AvailabilitySlot.status == "open",
                AvailabilitySlot.start_at > now + timedelta(hours=BOOKING_STOP_HOURS),
                AvailabilitySlot.start_at <= now + timedelta(days=BOOKING_OPEN_DAYS),
            )
            .order_by(AvailabilitySlot.start_at.asc())
        ).all()
        return {
            "invitation": self.invitation_dto(invitation).model_dump(mode="json"),
            "slots": [self.slot_dto(slot).model_dump(mode="json") for slot in slots],
        }

    def book_from_invitation(
        self, user: AuthUser, token: str, payload: CreateBookingRequest
    ) -> BookingDto:
        self._require_role(user, "candidate")
        invitation = self._active_invitation_by_token(token)
        if invitation.candidate_id != user.id:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        slot = self._open_slot_for_invitation(invitation, payload.slot_id)
        self._ensure_can_book(invitation, slot)
        now = utc_now()
        session = HumanInterviewSession(
            public_id=new_public_id("human_interview_session"),
            status="scheduled",
            created_at=now,
            updated_at=now,
        )
        self.session.add(session)
        self.session.flush()
        booking = self._create_confirmed_booking(
            invitation=invitation,
            slot=slot,
            session=session,
            contact=payload.contact.model_dump(mode="json"),
            candidate_reschedule_count=0,
            company_reschedule_count=0,
            rescheduled_from_id=None,
        )
        invitation.application.status = "interview_scheduled"
        invitation.application.updated_at = now
        self._add_participants(booking)
        self._add_status_history(
            booking, previous_status=None, next_status="confirmed", actor_id=user.id
        )
        self._audit(
            user,
            action="human_interview.booking.created",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            sensitive=True,
            details={"slot_id": slot.public_id},
        )
        self._notify_participants(
            booking,
            "human_interview_booking_confirmed",
            "真人面试预约已确认",
            "请登录系统查看已确认的面试时间和履约信息。",
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def get_booking(self, user: AuthUser, booking_id: str) -> BookingDto:
        booking = self._booking_for_participant(user, booking_id)
        self._audit(
            user,
            action="human_interview.booking.viewed",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            sensitive=True,
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def request_pending_confirmation(
        self, user: AuthUser, booking_id: str, payload: RequestPendingConfirmationRequest
    ) -> BookingDto:
        booking = self._booking_for_hr_or_interviewer(user, booking_id)
        self._ensure_confirmed_booking(booking)
        now = utc_now()
        previous = booking.status
        booking.status = "pending_confirmation"
        booking.pending_confirmation_expires_at = now + timedelta(
            hours=PENDING_CONFIRMATION_TTL_HOURS
        )
        booking.pending_confirmation_reason = payload.reason
        booking.updated_at = now
        booking.session.status = "pending_confirmation"
        booking.session.updated_at = now
        self._add_status_history(
            booking,
            previous_status=previous,
            next_status="pending_confirmation",
            actor_id=user.id,
            reason=payload.reason,
        )
        self._audit(
            user,
            action="human_interview.booking.pending_confirmation_requested",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            sensitive=True,
            details={"expires_at": booking.pending_confirmation_expires_at.isoformat()},
        )
        self._notify_participants(
            booking,
            "human_interview_pending_confirmation",
            "真人面试预约待补齐履约信息",
            "请登录系统查看预约状态, 相关履约信息需在 6 小时内补齐。",
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def complete_pending_confirmation(
        self, user: AuthUser, booking_id: str, payload: CompletePendingConfirmationRequest
    ) -> BookingDto:
        booking = self._booking_for_hr_or_interviewer(user, booking_id)
        if booking.status != "pending_confirmation":
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "booking_must_be_pending_confirmation"},
            )
        self._update_meeting_information_for_confirmation(booking, user, payload)
        now = utc_now()
        previous = booking.status
        booking.status = "confirmed"
        booking.pending_confirmation_expires_at = None
        booking.pending_confirmation_reason = None
        booking.updated_at = now
        booking.session.status = "scheduled"
        booking.session.updated_at = now
        self._add_status_history(
            booking,
            previous_status=previous,
            next_status="confirmed",
            actor_id=user.id,
        )
        self._audit(
            user,
            action="human_interview.booking.pending_confirmation_completed",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            sensitive=True,
        )
        self._notify_participants(
            booking,
            "human_interview_pending_confirmation_completed",
            "真人面试预约已恢复确认",
            "请登录系统查看已确认的面试时间和履约信息。",
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def expire_pending_confirmations(self, user: AuthUser) -> MaintenanceResultDto:
        self._require_role(user, "hr")
        now = utc_now()
        bookings = self.session.scalars(
            select(InterviewBooking).where(
                InterviewBooking.status == "pending_confirmation",
                InterviewBooking.pending_confirmation_expires_at.is_not(None),
                InterviewBooking.pending_confirmation_expires_at <= now,
            )
        ).all()
        expired_ids: list[str] = []
        for booking in bookings:
            if not self._hr_can_manage_booking(user, booking):
                continue
            previous = booking.status
            booking.status = "expired"
            booking.updated_at = now
            booking.slot.status = "open"
            booking.slot.updated_at = now
            booking.session.status = "expired"
            booking.session.updated_at = now
            self._add_status_history(
                booking,
                previous_status=previous,
                next_status="expired",
                actor_id=user.id,
                reason="pending_confirmation_timeout",
            )
            self._audit(
                user,
                action="human_interview.booking.pending_confirmation_expired",
                entity_type="human_interview_booking",
                entity_id=booking.id,
                sensitive=True,
            )
            self._notify_participants(
                booking,
                "human_interview_pending_confirmation_expired",
                "真人面试预约已超时释放",
                "请登录系统查看预约状态变化。",
            )
            expired_ids.append(booking.public_id)
        self._commit()
        return MaintenanceResultDto(processed_count=len(expired_ids), booking_ids=expired_ids)

    def create_booking_reminders(self, user: AuthUser) -> MaintenanceResultDto:
        self._require_role(user, "hr")
        now = utc_now()
        window_end = now + timedelta(hours=REMINDER_WINDOW_HOURS)
        bookings = self.session.scalars(
            select(InterviewBooking)
            .where(
                InterviewBooking.status == "confirmed",
                InterviewBooking.start_at > now,
                InterviewBooking.start_at <= window_end,
            )
            .order_by(InterviewBooking.start_at.asc())
        ).all()
        reminded_booking_ids: list[str] = []
        for booking in bookings:
            if not self._hr_can_manage_booking(user, booking):
                continue
            created_count = self._notify_participants(
                booking,
                "human_interview_booking_reminder",
                "真人面试即将开始",
                "请登录系统查看面试时间和履约信息。",
                dedupe_prefix="human_interview_booking_reminder",
                remind_at=booking.start_at,
            )
            if created_count > 0:
                reminded_booking_ids.append(booking.public_id)
        self._commit()
        return MaintenanceResultDto(
            processed_count=len(reminded_booking_ids), booking_ids=reminded_booking_ids
        )

    def cancel_booking(
        self, user: AuthUser, booking_id: str, payload: CancelBookingRequest
    ) -> BookingDto:
        booking = self._booking_for_participant(user, booking_id)
        self._ensure_confirmed_booking(booking)
        now = utc_now()
        is_candidate = user.role == "candidate"
        if is_candidate and now > booking.start_at - timedelta(hours=BOOKING_STOP_HOURS):
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "candidate_cancel_before_24h"}
            )
        company_late_cancel = (not is_candidate) and now > booking.start_at - timedelta(
            hours=BOOKING_STOP_HOURS
        )
        if company_late_cancel and not payload.reason:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "company_cancel_within_24h_requires_reason"},
            )
        previous = booking.status
        booking.status = "cancelled"
        booking.cancellation_reason = payload.reason
        booking.cancelled_by = user.id
        booking.company_late_cancel = company_late_cancel
        booking.updated_at = now
        booking.slot.status = "open"
        booking.slot.updated_at = now
        self._add_status_history(
            booking,
            previous_status=previous,
            next_status="cancelled",
            actor_id=user.id,
            reason=payload.reason,
        )
        self._audit(
            user,
            action="human_interview.booking.cancelled",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            sensitive=True,
            details={"company_late_cancel": company_late_cancel},
        )
        self._notify_participants(
            booking,
            "human_interview_booking_cancelled",
            "真人面试预约已取消",
            "请登录系统查看状态变化。",
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def reschedule_booking(
        self, user: AuthUser, booking_id: str, payload: RescheduleBookingRequest
    ) -> BookingDto:
        old_booking = self._booking_for_participant(user, booking_id)
        self._ensure_confirmed_booking(old_booking)
        actor_is_candidate = user.role == "candidate"
        if actor_is_candidate and old_booking.candidate_reschedule_count >= 1:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "candidate_reschedule_limit"}
            )
        if not actor_is_candidate and old_booking.company_reschedule_count >= 1:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "company_reschedule_limit"}
            )
        if not actor_is_candidate and not payload.reason:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "company_reschedule_requires_reason"},
            )
        slot = self._open_slot_for_invitation(old_booking.invitation, payload.slot_id)
        self._ensure_slot_bookable(slot)
        self._ensure_no_time_conflict(
            application_id=old_booking.application_id,
            candidate_id=old_booking.candidate_id,
            interviewer_id=old_booking.primary_interviewer_id,
            start_at=slot.start_at,
            end_at=slot.end_at,
            exclude_booking_id=old_booking.id,
        )
        now = utc_now()
        previous = old_booking.status
        old_booking.status = "rescheduled"
        old_booking.updated_at = now
        old_booking.slot.status = "open"
        old_booking.slot.updated_at = now
        self._add_status_history(
            old_booking,
            previous_status=previous,
            next_status="rescheduled",
            actor_id=user.id,
            reason=payload.reason,
        )
        session = HumanInterviewSession(
            public_id=new_public_id("human_interview_session"),
            status="scheduled",
            created_at=now,
            updated_at=now,
        )
        self.session.add(session)
        self.session.flush()
        new_booking = self._create_confirmed_booking(
            invitation=old_booking.invitation,
            slot=slot,
            session=session,
            contact=loads_dict(old_booking.candidate_contact_json),
            candidate_reschedule_count=old_booking.candidate_reschedule_count
            + (1 if actor_is_candidate else 0),
            company_reschedule_count=old_booking.company_reschedule_count
            + (0 if actor_is_candidate else 1),
            rescheduled_from_id=old_booking.id,
        )
        self._add_participants(new_booking)
        self._add_status_history(
            new_booking, previous_status=None, next_status="confirmed", actor_id=user.id
        )
        self._audit(
            user,
            action="human_interview.booking.rescheduled",
            entity_type="human_interview_booking",
            entity_id=new_booking.id,
            sensitive=True,
            details={"from_booking_id": old_booking.public_id},
        )
        self._notify_participants(
            new_booking,
            "human_interview_booking_rescheduled",
            "真人面试预约已改期",
            "请登录系统查看新的面试时间。",
        )
        self._commit()
        return self.booking_dto(new_booking, include_sensitive=True)

    def mark_booking(
        self, user: AuthUser, booking_id: str, payload: MarkBookingRequest
    ) -> BookingDto:
        booking = self._booking_for_hr_or_interviewer(user, booking_id)
        self._ensure_confirmed_booking(booking)
        if payload.status in {"candidate_no_show", "interviewer_no_show"} and not payload.reason:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "no_show_requires_reason"}
            )
        previous = booking.status
        now = utc_now()
        booking.status = payload.status
        booking.updated_at = now
        booking.session.status = payload.status
        booking.session.ended_at = now
        booking.session.updated_at = now
        if payload.status in {"completed", "candidate_no_show", "interviewer_no_show"}:
            booking.invitation.application.status = payload.status
            if payload.status == "completed":
                booking.invitation.application.status = "interview_completed"
            booking.invitation.application.updated_at = now
        self._add_status_history(
            booking,
            previous_status=previous,
            next_status=payload.status,
            actor_id=user.id,
            reason=payload.reason,
        )
        self._audit(
            user,
            action="human_interview.booking.marked",
            entity_type="human_interview_booking",
            entity_id=booking.id,
            details={"status": payload.status},
        )
        self._notify_participants(
            booking,
            "human_interview_booking_status_changed",
            "真人面试状态已更新",
            "请登录系统查看状态变化。",
        )
        self._commit()
        return self.booking_dto(booking, include_sensitive=True)

    def submit_report(
        self, user: AuthUser, booking_id: str, payload: SubmitReportRequest
    ) -> ReportDto:
        booking = self._booking_for_hr_or_interviewer(user, booking_id)
        if booking.status != "completed":
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "report_requires_completed_booking"},
            )
        now = utc_now()
        report = self.session.scalar(
            select(HumanInterviewReport).where(HumanInterviewReport.booking_id == booking.id)
        )
        if report is None:
            report = HumanInterviewReport(
                public_id=new_public_id("human_interview_report"),
                booking_id=booking.id,
                created_by=user.id,
                conclusion=payload.conclusion,
                competency_json=dumps(payload.competencies),
                key_observations=payload.key_observations,
                risks=payload.risks,
                candidate_summary=payload.candidate_summary,
                internal_notes=payload.internal_notes,
                status="pending_hr_review",
                submitted_by=user.id,
                submitted_at=now,
                created_at=now,
                updated_at=now,
            )
            self.session.add(report)
        elif report.status == "published":
            raise AppException(ErrorCode.REPORT_INVALID_STATE)
        else:
            report.conclusion = payload.conclusion
            report.competency_json = dumps(payload.competencies)
            report.key_observations = payload.key_observations
            report.risks = payload.risks
            report.candidate_summary = payload.candidate_summary
            report.internal_notes = payload.internal_notes
            report.status = "pending_hr_review"
            report.submitted_by = user.id
            report.submitted_at = now
            report.updated_at = now
        self._audit(
            user,
            action="human_interview.report.submitted",
            entity_type="human_interview_report",
            entity_id=report.id,
            sensitive=True,
        )
        self._commit()
        return self.report_dto(report, include_internal=True)

    def publish_report(self, user: AuthUser, report_id: str) -> ReportDto:
        self._require_role(user, "hr")
        report = self._report_for_hr(user, report_id)
        if report.status != "pending_hr_review":
            raise AppException(ErrorCode.REPORT_INVALID_STATE)
        now = utc_now()
        report.status = "published"
        report.published_by = user.id
        report.published_at = now
        report.updated_at = now
        self._audit(
            user,
            action="human_interview.report.published",
            entity_type="human_interview_report",
            entity_id=report.id,
            sensitive=True,
        )
        self._notify(
            report.booking.candidate_id,
            "human_interview_report_published",
            "真人面试报告已发布",
            "请登录系统查看求职者可见摘要。",
            {"booking_id": report.booking.public_id},
        )
        self._commit()
        return self.report_dto(report, include_internal=True)

    def get_report_for_booking(self, user: AuthUser, booking_id: str) -> ReportDto:
        booking = self._booking_for_participant(user, booking_id)
        report = self.session.scalar(
            select(HumanInterviewReport).where(HumanInterviewReport.booking_id == booking.id)
        )
        if report is None:
            raise AppException(ErrorCode.REPORT_NOT_FOUND)
        include_internal = user.role == "hr"
        if user.role == "candidate" and report.status != "published":
            raise AppException(ErrorCode.REPORT_NOT_CONFIRMED)
        self._audit(
            user,
            action="human_interview.report.viewed",
            entity_type="human_interview_report",
            entity_id=report.id,
            sensitive=True,
        )
        self._commit()
        return self.report_dto(report, include_internal=include_internal)

    def _create_meeting_information(
        self, user: AuthUser, payload: CreateInvitationRequest
    ) -> MeetingInformation:
        now = utc_now()
        location_template: InterviewLocationTemplate | None = None
        if payload.interview_type == "online":
            if not payload.meeting_url:
                raise AppException(
                    ErrorCode.INTERVIEW_INVALID_STATE, details={"field": "meeting_url"}
                )
        else:
            if payload.location is None:
                raise AppException(ErrorCode.INTERVIEW_INVALID_STATE, details={"field": "location"})
            location_template = InterviewLocationTemplate(
                public_id=new_public_id("human_interview_location"),
                organization_id=user.organization_id,
                created_by=user.id,
                title=payload.location.title,
                address=payload.location.address,
                arrival_instructions=payload.location.arrival_instructions,
                contact_name=payload.location.contact_name,
                contact_phone=payload.location.contact_phone,
                status="active",
                created_at=now,
                updated_at=now,
            )
            self.session.add(location_template)
            self.session.flush()
        meeting = MeetingInformation(
            public_id=new_public_id("human_interview_meeting"),
            organization_id=user.organization_id,
            created_by=user.id,
            interview_type=payload.interview_type,
            meeting_url=payload.meeting_url or "",
            location_template_id=location_template.id if location_template is not None else None,
            details_json=dumps(
                payload.location.model_dump(mode="json") if payload.location is not None else {}
            ),
            status="active",
            created_at=now,
            updated_at=now,
        )
        self.session.add(meeting)
        self.session.flush()
        return meeting

    def _update_meeting_information_for_confirmation(
        self,
        booking: InterviewBooking,
        user: AuthUser,
        payload: CompletePendingConfirmationRequest,
    ) -> None:
        now = utc_now()
        meeting = booking.meeting_information
        if booking.interview_type == "online":
            if not payload.meeting_url:
                raise AppException(
                    ErrorCode.INTERVIEW_INVALID_STATE, details={"field": "meeting_url"}
                )
            meeting.meeting_url = payload.meeting_url
            meeting.location_template_id = None
            meeting.details_json = dumps({})
        else:
            if payload.location is None:
                raise AppException(ErrorCode.INTERVIEW_INVALID_STATE, details={"field": "location"})
            location_template = InterviewLocationTemplate(
                public_id=new_public_id("human_interview_location"),
                organization_id=user.organization_id,
                created_by=user.id,
                title=payload.location.title,
                address=payload.location.address,
                arrival_instructions=payload.location.arrival_instructions,
                contact_name=payload.location.contact_name,
                contact_phone=payload.location.contact_phone,
                status="active",
                created_at=now,
                updated_at=now,
            )
            self.session.add(location_template)
            self.session.flush()
            meeting.meeting_url = ""
            meeting.location_template_id = location_template.id
            meeting.details_json = dumps(payload.location.model_dump(mode="json"))
        meeting.status = "active"
        meeting.updated_at = now

    def _ensure_interviewer(self, user: AuthUser, interviewer_user_id: UUID) -> Interviewer:
        interviewer_user = self.session.get(User, interviewer_user_id)
        if interviewer_user is None or interviewer_user.role != "hr":
            raise AppException(ErrorCode.USER_NOT_FOUND)
        if interviewer_user.organization_id != user.organization_id:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        existing = self.session.scalar(
            select(Interviewer).where(Interviewer.user_id == interviewer_user.id)
        )
        if existing is not None:
            return existing
        now = utc_now()
        interviewer = Interviewer(
            public_id=new_public_id("human_interviewer"),
            user_id=interviewer_user.id,
            organization_id=interviewer_user.organization_id,
            display_name=interviewer_user.display_name,
            contact_email=interviewer_user.email,
            status="active",
            created_at=now,
            updated_at=now,
        )
        self.session.add(interviewer)
        self.session.flush()
        return interviewer

    def _application_for_hr(self, user: AuthUser, application_public_id: str) -> Application:
        statement = select(Application).where(Application.public_id == application_public_id)
        application = self.session.scalar(statement)
        if application is None or application.job.created_by != user.id:
            raise AppException(ErrorCode.APPLICATION_NOT_FOUND)
        return application

    def _ensure_upstream_ready(self, application: Application) -> None:
        report = self.session.scalar(
            select(EvaluationReport).where(EvaluationReport.application_id == application.id)
        )
        if report is None or report.status != "confirmed":
            raise AppException(
                ErrorCode.APPLICATION_INVALID_STATE,
                details={"rule": "confirmed_ai_evaluation_report_required"},
            )

    def _invitation_for_hr(self, user: AuthUser, invitation_id: str) -> InterviewInvitation:
        invitation = self.session.scalar(
            select(InterviewInvitation).where(InterviewInvitation.public_id == invitation_id)
        )
        if invitation is None or invitation.application.job.created_by != user.id:
            raise AppException(ErrorCode.INTERVIEW_NOT_FOUND)
        return invitation

    def _interviewer_for_hr(self, user: AuthUser, interviewer_public_id: str) -> Interviewer:
        interviewer = self.session.scalar(
            select(Interviewer).where(Interviewer.public_id == interviewer_public_id)
        )
        if interviewer is None or interviewer.organization_id != user.organization_id:
            raise AppException(ErrorCode.USER_NOT_FOUND)
        return interviewer

    def _active_invitation_by_token(self, token: str) -> InterviewInvitation:
        invitation = self.session.scalar(
            select(InterviewInvitation).where(InterviewInvitation.token == token)
        )
        if invitation is None:
            raise AppException(ErrorCode.INTERVIEW_NOT_FOUND)
        now = utc_now()
        if invitation.status == "active" and invitation.expires_at <= now:
            invitation.status = "expired"
            invitation.updated_at = now
            self.session.flush()
        if invitation.status != "active":
            raise AppException(ErrorCode.INTERVIEW_INVALID_STATE)
        return invitation

    def _open_slot_for_invitation(
        self, invitation: InterviewInvitation, slot_public_id: str
    ) -> AvailabilitySlot:
        slot = self.session.scalar(
            select(AvailabilitySlot).where(
                AvailabilitySlot.public_id == slot_public_id,
                AvailabilitySlot.interviewer_id == invitation.primary_interviewer_id,
                AvailabilitySlot.status == "open",
            )
        )
        if slot is None:
            raise AppException(ErrorCode.INTERVIEW_NOT_FOUND)
        return slot

    def _ensure_can_book(self, invitation: InterviewInvitation, slot: AvailabilitySlot) -> None:
        self._ensure_slot_bookable(slot)
        self._ensure_no_time_conflict(
            application_id=invitation.application_id,
            candidate_id=invitation.candidate_id,
            interviewer_id=invitation.primary_interviewer_id,
            start_at=slot.start_at,
            end_at=slot.end_at,
            exclude_booking_id=None,
        )

    def _ensure_slot_bookable(self, slot: AvailabilitySlot) -> None:
        now = utc_now()
        if slot.start_at <= now + timedelta(hours=BOOKING_STOP_HOURS):
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"rule": "booking_stops_24h_before_start"},
            )
        if slot.start_at > now + timedelta(days=BOOKING_OPEN_DAYS):
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE, details={"rule": "booking_window_14_days"}
            )

    def _ensure_no_time_conflict(
        self,
        *,
        application_id: UUID,
        candidate_id: UUID,
        interviewer_id: UUID,
        start_at: Any,
        end_at: Any,
        exclude_booking_id: UUID | None,
    ) -> None:
        application_statement: Select[tuple[InterviewBooking]] = select(InterviewBooking).where(
            InterviewBooking.status.in_(ACTIVE_BOOKING_STATUSES),
            InterviewBooking.application_id == application_id,
        )
        if exclude_booking_id is not None:
            application_statement = application_statement.where(
                InterviewBooking.id != exclude_booking_id
            )
        if self.session.scalar(application_statement) is not None:
            raise AppException(ErrorCode.INTERVIEW_CONFLICT)

        new_buffer_end = end_at + timedelta(minutes=BOOKING_BUFFER_MINUTES)
        statement: Select[tuple[InterviewBooking]] = select(InterviewBooking).where(
            InterviewBooking.status.in_(ACTIVE_BOOKING_STATUSES),
            (InterviewBooking.candidate_id == candidate_id)
            | (InterviewBooking.primary_interviewer_id == interviewer_id),
            InterviewBooking.start_at < new_buffer_end,
            InterviewBooking.buffer_end_at > start_at,
        )
        if exclude_booking_id is not None:
            statement = statement.where(InterviewBooking.id != exclude_booking_id)
        if self.session.scalar(statement) is not None:
            raise AppException(ErrorCode.INTERVIEW_CONFLICT)

    def _create_confirmed_booking(
        self,
        *,
        invitation: InterviewInvitation,
        slot: AvailabilitySlot,
        session: HumanInterviewSession,
        contact: dict[str, Any],
        candidate_reschedule_count: int,
        company_reschedule_count: int,
        rescheduled_from_id: UUID | None,
    ) -> InterviewBooking:
        now = utc_now()
        slot.status = "booked"
        slot.updated_at = now
        booking = InterviewBooking(
            public_id=new_public_id("human_interview_booking"),
            invitation_id=invitation.id,
            application_id=invitation.application_id,
            job_id=invitation.job_id,
            candidate_id=invitation.candidate_id,
            primary_interviewer_id=invitation.primary_interviewer_id,
            slot_id=slot.id,
            session_id=session.id,
            meeting_information_id=invitation.meeting_information_id,
            status="confirmed",
            interview_type=invitation.interview_type,
            start_at=slot.start_at,
            end_at=slot.end_at,
            buffer_end_at=slot.end_at + timedelta(minutes=BOOKING_BUFFER_MINUTES),
            candidate_contact_json=dumps(contact),
            candidate_reschedule_count=candidate_reschedule_count,
            company_reschedule_count=company_reschedule_count,
            rescheduled_from_id=rescheduled_from_id,
            confirmed_at=now,
            created_at=now,
            updated_at=now,
        )
        self.session.add(booking)
        self.session.flush()
        return booking

    def _add_participants(self, booking: InterviewBooking) -> None:
        candidate = self.session.get(User, booking.candidate_id)
        interviewer_user = self.session.get(User, booking.primary_interviewer.user_id)
        for participant_user, role in (
            (candidate, "candidate"),
            (interviewer_user, "primary_interviewer"),
        ):
            if participant_user is None:
                continue
            self.session.add(
                BookingParticipant(
                    booking_id=booking.id,
                    user_id=participant_user.id,
                    role=role,
                    display_name=participant_user.display_name,
                )
            )

    def _add_status_history(
        self,
        booking: InterviewBooking,
        *,
        previous_status: str | None,
        next_status: str,
        actor_id: UUID | None,
        reason: str | None = None,
    ) -> None:
        self.session.add(
            BookingStatusHistory(
                booking_id=booking.id,
                previous_status=previous_status,
                next_status=next_status,
                actor_id=actor_id,
                reason=reason,
            )
        )

    def _booking_for_participant(self, user: AuthUser, booking_public_id: str) -> InterviewBooking:
        booking = self.session.scalar(
            select(InterviewBooking).where(InterviewBooking.public_id == booking_public_id)
        )
        if booking is None:
            raise AppException(ErrorCode.INTERVIEW_NOT_FOUND)
        if user.role == "candidate" and booking.candidate_id == user.id:
            return booking
        if user.role == "hr":
            interviewer_user_id = booking.primary_interviewer.user_id
            if (
                booking.invitation.application.job.created_by == user.id
                or interviewer_user_id == user.id
            ):
                return booking
        raise AppException(ErrorCode.AUTH_FORBIDDEN)

    def _booking_for_hr_or_interviewer(
        self, user: AuthUser, booking_public_id: str
    ) -> InterviewBooking:
        booking = self._booking_for_participant(user, booking_public_id)
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        return booking

    def _ensure_active_booking(self, booking: InterviewBooking) -> None:
        if booking.status not in ACTIVE_BOOKING_STATUSES:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"terminal": booking.status in TERMINAL_BOOKING_STATUSES},
            )

    def _ensure_confirmed_booking(self, booking: InterviewBooking) -> None:
        if booking.status != "confirmed":
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                details={"terminal": booking.status in TERMINAL_BOOKING_STATUSES},
            )

    def _hr_can_manage_booking(self, user: AuthUser, booking: InterviewBooking) -> bool:
        if user.role != "hr":
            return False
        return (
            booking.invitation.application.job.created_by == user.id
            or booking.primary_interviewer.user_id == user.id
        )

    def _report_for_hr(self, user: AuthUser, report_public_id: str) -> HumanInterviewReport:
        report = self.session.scalar(
            select(HumanInterviewReport).where(HumanInterviewReport.public_id == report_public_id)
        )
        if report is None or report.booking.invitation.application.job.created_by != user.id:
            raise AppException(ErrorCode.REPORT_NOT_FOUND)
        return report

    def _require_role(self, user: AuthUser, role: str) -> None:
        if user.role != role:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)

    def _notify(
        self,
        recipient_id: UUID,
        notification_type: str,
        title: str,
        body: str,
        payload: dict[str, Any] | None = None,
        *,
        entity_type: str | None = None,
        entity_public_id: str | None = None,
        dedupe_key: str | None = None,
        remind_at: Any | None = None,
    ) -> bool:
        if dedupe_key is not None:
            existing = self.session.scalar(
                select(Notification).where(Notification.dedupe_key == dedupe_key)
            )
            if existing is not None:
                return False
        self.session.add(
            Notification(
                public_id=new_public_id("notification"),
                recipient_id=recipient_id,
                notification_type=notification_type,
                title=title,
                body=body,
                payload_json=dumps(payload or {}),
                entity_type=entity_type,
                entity_public_id=entity_public_id,
                dedupe_key=dedupe_key,
                remind_at=remind_at,
            )
        )
        return True

    def _notify_participants(
        self,
        booking: InterviewBooking,
        notification_type: str,
        title: str,
        body: str,
        *,
        dedupe_prefix: str | None = None,
        remind_at: Any | None = None,
    ) -> int:
        recipient_ids = {
            booking.candidate_id,
            booking.primary_interviewer.user_id,
            booking.invitation.created_by,
        }
        created_count = 0
        for recipient_id in recipient_ids:
            dedupe_key = (
                f"{dedupe_prefix}:{booking.public_id}:{recipient_id}"
                if dedupe_prefix is not None
                else None
            )
            if self._notify(
                recipient_id,
                notification_type,
                title,
                body,
                {
                    "booking_id": booking.public_id,
                    "application_id": booking.invitation.application.public_id,
                },
                entity_type="human_interview_booking",
                entity_public_id=booking.public_id,
                dedupe_key=dedupe_key,
                remind_at=remind_at,
            ):
                created_count += 1
        return created_count

    def _audit(
        self,
        user: AuthUser | None,
        *,
        action: str,
        entity_type: str,
        entity_id: UUID | None,
        sensitive: bool = False,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.session.add(
            BookingAuditRecord(
                public_id=new_public_id("human_interview_audit"),
                actor_id=user.id if user is not None else None,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                sensitive=sensitive,
                details_json=dumps(details or {}),
            )
        )

    def _commit(self) -> None:
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise AppException(ErrorCode.INTERVIEW_CONFLICT) from exc

    def invitation_dto(self, invitation: InterviewInvitation) -> InvitationDto:
        return InvitationDto(
            id=invitation.public_id,
            token=invitation.token,
            application_id=invitation.application.public_id,
            candidate_id=invitation.candidate_id,
            primary_interviewer_id=invitation.primary_interviewer.public_id,
            interview_type=invitation.interview_type,
            status=invitation.status,
            expires_at=invitation.expires_at,
        )

    def slot_dto(self, slot: AvailabilitySlot) -> SlotDto:
        return SlotDto(
            id=slot.public_id,
            interviewer_id=slot.interviewer.public_id,
            start_at=slot.start_at,
            end_at=slot.end_at,
            status=slot.status,
        )

    def booking_dto(self, booking: InterviewBooking, *, include_sensitive: bool) -> BookingDto:
        meeting = self._meeting_dto(booking.meeting_information) if include_sensitive else None
        rescheduled_from_id = None
        if booking.rescheduled_from_id is not None:
            old = self.session.get(InterviewBooking, booking.rescheduled_from_id)
            rescheduled_from_id = (
                old.public_id if old is not None else str(booking.rescheduled_from_id)
            )
        return BookingDto(
            id=booking.public_id,
            application_id=booking.invitation.application.public_id,
            status=booking.status,
            interview_type=booking.interview_type,
            start_at=booking.start_at,
            end_at=booking.end_at,
            candidate_id=booking.candidate_id,
            primary_interviewer_id=booking.primary_interviewer.public_id,
            rescheduled_from_id=rescheduled_from_id,
            pending_confirmation_expires_at=booking.pending_confirmation_expires_at,
            meeting=meeting,
        )

    def report_dto(self, report: HumanInterviewReport, *, include_internal: bool) -> ReportDto:
        return ReportDto(
            id=report.public_id,
            booking_id=report.booking.public_id,
            status=report.status,
            conclusion=report.conclusion if include_internal else None,
            competencies=[str(item) for item in loads_list(report.competency_json)],
            key_observations=report.key_observations if include_internal else None,
            risks=report.risks if include_internal else None,
            candidate_summary=report.candidate_summary,
            internal_notes=report.internal_notes if include_internal else None,
        )

    def _meeting_dto(self, meeting: MeetingInformation) -> dict[str, object]:
        details = loads_dict(meeting.details_json)
        return {
            "type": meeting.interview_type,
            "meeting_url": meeting.meeting_url if meeting.interview_type == "online" else None,
            "location": details if meeting.interview_type == "offline" else None,
        }
