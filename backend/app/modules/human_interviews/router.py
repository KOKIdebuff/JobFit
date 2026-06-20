from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.contracts.api import SuccessResponse, success_response
from app.db.session import get_session
from app.modules.auth_users.deps import current_user
from app.modules.auth_users.schemas import AuthUser
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
from app.modules.human_interviews.service import HumanInterviewService

router = APIRouter(prefix="/human-interviews", tags=["human-interviews"])
SESSION_DEPENDENCY = Depends(get_session)
CURRENT_USER_DEPENDENCY = Depends(current_user)


def _request_id(request: Request) -> UUID:
    return UUID(str(request.state.request_id))


def human_interview_service(session: Session = SESSION_DEPENDENCY) -> HumanInterviewService:
    return HumanInterviewService(session)


HUMAN_INTERVIEW_SERVICE_DEPENDENCY = Depends(human_interview_service)


@router.post(
    "/invitations",
    response_model=SuccessResponse[InvitationDto],
    status_code=status.HTTP_201_CREATED,
)
def create_invitation(
    payload: CreateInvitationRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[InvitationDto]:
    return success_response(
        service.create_invitation(user, payload), request_id=_request_id(request)
    )


@router.post("/invitations/{invitation_id}/revoke", response_model=SuccessResponse[InvitationDto])
def revoke_invitation(
    invitation_id: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[InvitationDto]:
    return success_response(
        service.revoke_invitation(user, invitation_id), request_id=_request_id(request)
    )


@router.post(
    "/availability-slots",
    response_model=SuccessResponse[SlotDto],
    status_code=status.HTTP_201_CREATED,
)
def create_availability_slot(
    payload: CreateAvailabilitySlotRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[SlotDto]:
    return success_response(
        service.create_availability_slot(user, payload), request_id=_request_id(request)
    )


@router.get("/invitations/token/{token}")
def invitation_preview(
    token: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        service.invitation_preview(user, token), request_id=_request_id(request)
    )


@router.post(
    "/invitations/token/{token}/book",
    response_model=SuccessResponse[BookingDto],
    status_code=status.HTTP_201_CREATED,
)
def book_from_invitation(
    token: str,
    payload: CreateBookingRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.book_from_invitation(user, token, payload), request_id=_request_id(request)
    )


@router.get("/bookings/{booking_id}", response_model=SuccessResponse[BookingDto])
def get_booking(
    booking_id: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(service.get_booking(user, booking_id), request_id=_request_id(request))


@router.post(
    "/bookings/{booking_id}/pending-confirmation", response_model=SuccessResponse[BookingDto]
)
def request_pending_confirmation(
    booking_id: str,
    payload: RequestPendingConfirmationRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.request_pending_confirmation(user, booking_id, payload),
        request_id=_request_id(request),
    )


@router.post(
    "/bookings/{booking_id}/complete-confirmation", response_model=SuccessResponse[BookingDto]
)
def complete_pending_confirmation(
    booking_id: str,
    payload: CompletePendingConfirmationRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.complete_pending_confirmation(user, booking_id, payload),
        request_id=_request_id(request),
    )


@router.post(
    "/maintenance/expire-pending-confirmations",
    response_model=SuccessResponse[MaintenanceResultDto],
)
def expire_pending_confirmations(
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[MaintenanceResultDto]:
    return success_response(
        service.expire_pending_confirmations(user), request_id=_request_id(request)
    )


@router.post("/maintenance/reminders", response_model=SuccessResponse[MaintenanceResultDto])
def create_booking_reminders(
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[MaintenanceResultDto]:
    return success_response(service.create_booking_reminders(user), request_id=_request_id(request))


@router.post("/bookings/{booking_id}/cancel", response_model=SuccessResponse[BookingDto])
def cancel_booking(
    booking_id: str,
    payload: CancelBookingRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.cancel_booking(user, booking_id, payload), request_id=_request_id(request)
    )


@router.post("/bookings/{booking_id}/reschedule", response_model=SuccessResponse[BookingDto])
def reschedule_booking(
    booking_id: str,
    payload: RescheduleBookingRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.reschedule_booking(user, booking_id, payload), request_id=_request_id(request)
    )


@router.post("/bookings/{booking_id}/mark", response_model=SuccessResponse[BookingDto])
def mark_booking(
    booking_id: str,
    payload: MarkBookingRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[BookingDto]:
    return success_response(
        service.mark_booking(user, booking_id, payload), request_id=_request_id(request)
    )


@router.post(
    "/bookings/{booking_id}/report",
    response_model=SuccessResponse[ReportDto],
    status_code=status.HTTP_201_CREATED,
)
def submit_report(
    booking_id: str,
    payload: SubmitReportRequest,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[ReportDto]:
    return success_response(
        service.submit_report(user, booking_id, payload), request_id=_request_id(request)
    )


@router.post("/reports/{report_id}/publish", response_model=SuccessResponse[ReportDto])
def publish_report(
    report_id: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[ReportDto]:
    return success_response(
        service.publish_report(user, report_id), request_id=_request_id(request)
    )


@router.get("/bookings/{booking_id}/report", response_model=SuccessResponse[ReportDto])
def get_report(
    booking_id: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    service: HumanInterviewService = HUMAN_INTERVIEW_SERVICE_DEPENDENCY,
) -> SuccessResponse[ReportDto]:
    return success_response(
        service.get_report_for_booking(user, booking_id), request_id=_request_id(request)
    )
