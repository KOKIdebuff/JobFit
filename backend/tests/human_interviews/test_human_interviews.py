from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.modules.human_interviews.models import (
    AvailabilitySlot,
    BookingAuditRecord,
    BookingStatusHistory,
    HumanInterviewReport,
    InterviewBooking,
)
from app.modules.notifications.models import Notification


def assert_error_contract(response: Any, *, status_code: int, code: ErrorCode) -> None:
    assert response.status_code == status_code
    payload = response.json()
    assert payload["success"] is False
    assert payload["error"]["code"] == code.value
    assert set(payload["meta"]) >= {"request_id", "timestamp"}


def _next_slot_start(days: int = 3, hours: int = 0) -> datetime:
    base = datetime.now(UTC) + timedelta(days=days, hours=hours)
    return base.replace(hour=10 + hours, minute=0, second=0, microsecond=0)


def _register(client: TestClient, *, role: str, suffix: str) -> dict[str, Any]:
    organization_name = "星河智能" if role == "hr" else None
    payload: dict[str, Any] = {
        "email": f"{role}.{suffix}@hirelink.local",
        "username": f"{role}_{suffix}",
        "display_name": f"{role}-{suffix}",
        "password": "HireLinkTest2026!",
        "role": role,
    }
    if organization_name is not None:
        payload["organization_name"] = organization_name
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return response.json()["data"]["user"]


def _login(client: TestClient, *, role: str, suffix: str) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": f"{role}.{suffix}@hirelink.local", "password": "HireLinkTest2026!"},
    )
    assert response.status_code == 200, response.text


def _setup_ready_application(
    client: TestClient,
    *,
    suffix: str,
) -> dict[str, Any]:
    hr = _register(client, role="hr", suffix=f"{suffix}_hr")
    candidate = _register(client, role="candidate", suffix=f"{suffix}_candidate")

    _login(client, role="hr", suffix=f"{suffix}_hr")
    job_response = client.post(
        "/api/v1/jobs",
        json={
            "title": f"AI 产品经理 {suffix}",
            "company": "星河智能",
            "location": "北京",
            "employment_type": "campus",
            "jd_text": "负责 AI 招聘分析功能的 MVP 设计与验证。",
        },
    )
    assert job_response.status_code == 200, job_response.text
    job_id = job_response.json()["data"]["job_id"]

    _login(client, role="candidate", suffix=f"{suffix}_candidate")
    resume_response = client.post(
        "/api/v1/resumes",
        json={
            "file_name": f"{suffix}.txt",
            "mime_type": "text/plain",
            "size_bytes": 256,
            "raw_text": "候选人具备 AI 产品、数据分析和项目推进经验。",
        },
    )
    assert resume_response.status_code == 200, resume_response.text
    resume_id = resume_response.json()["data"]["resume_id"]

    application_response = client.post(
        "/api/v1/applications",
        json={"job_id": job_id, "resume_id": resume_id},
    )
    assert application_response.status_code == 200, application_response.text
    application_id = application_response.json()["data"]["application"]["application_id"]

    _login(client, role="hr", suffix=f"{suffix}_hr")
    generate_response = client.post(f"/api/v1/applications/{application_id}/report/generate")
    assert generate_response.status_code == 200, generate_response.text
    confirm_response = client.post(f"/api/v1/applications/{application_id}/report/confirm")
    assert confirm_response.status_code == 200, confirm_response.text
    return {"hr": hr, "candidate": candidate, "application_id": application_id}


def _create_invitation_and_slot(
    client: TestClient,
    *,
    application_id: str,
    hr_user_id: str,
    slot_start: datetime | None = None,
) -> dict[str, Any]:
    invitation_response = client.post(
        "/api/v1/human-interviews/invitations",
        json={
            "application_id": application_id,
            "primary_interviewer_user_id": hr_user_id,
            "interview_type": "online",
            "meeting_url": "https://meet.example.com/hirelink-safe-room",
        },
    )
    assert invitation_response.status_code == 201, invitation_response.text
    invitation = invitation_response.json()["data"]

    slot_response = client.post(
        "/api/v1/human-interviews/availability-slots",
        json={
            "interviewer_id": invitation["primary_interviewer_id"],
            "start_at": (slot_start or _next_slot_start()).isoformat(),
            "duration_minutes": 60,
        },
    )
    assert slot_response.status_code == 201, slot_response.text
    return {"invitation": invitation, "slot": slot_response.json()["data"]}


def _book(
    client: TestClient,
    *,
    token: str,
    slot_id: str,
) -> dict[str, Any]:
    response = client.post(
        f"/api/v1/human-interviews/invitations/token/{token}/book",
        json={"slot_id": slot_id, "contact": {"name": "候选人", "email": "candidate@example.com"}},
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


def test_hr_creates_bound_invitation_and_candidate_books_confirmed(client: TestClient) -> None:
    context = _setup_ready_application(client, suffix="book_ok")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )

    _login(client, role="candidate", suffix="book_ok_candidate")
    preview = client.get(
        f"/api/v1/human-interviews/invitations/token/{created['invitation']['token']}"
    )
    assert preview.status_code == 200, preview.text
    assert preview.json()["data"]["invitation"]["application_id"] == context["application_id"]

    booking = _book(
        client,
        token=created["invitation"]["token"],
        slot_id=created["slot"]["id"],
    )

    assert booking["status"] == "confirmed"
    assert booking["application_id"] == context["application_id"]
    assert booking["meeting"]["meeting_url"] == "https://meet.example.com/hirelink-safe-room"


def test_duplicate_active_booking_for_same_application_is_rejected(client: TestClient) -> None:
    context = _setup_ready_application(client, suffix="duplicate")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix="duplicate_candidate")
    _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])

    _login(client, role="hr", suffix="duplicate_hr")
    second_slot = client.post(
        "/api/v1/human-interviews/availability-slots",
        json={
            "interviewer_id": created["invitation"]["primary_interviewer_id"],
            "start_at": _next_slot_start(days=4).isoformat(),
            "duration_minutes": 60,
        },
    )
    assert second_slot.status_code == 201, second_slot.text

    _login(client, role="candidate", suffix="duplicate_candidate")
    response = client.post(
        f"/api/v1/human-interviews/invitations/token/{created['invitation']['token']}/book",
        json={
            "slot_id": second_slot.json()["data"]["id"],
            "contact": {"name": "候选人", "email": "candidate@example.com"},
        },
    )

    assert_error_contract(response, status_code=409, code=ErrorCode.INTERVIEW_CONFLICT)


def test_candidate_or_interviewer_time_conflict_is_rejected(client: TestClient) -> None:
    first = _setup_ready_application(client, suffix="conflict_a")
    second = _setup_ready_application(client, suffix="conflict_b")

    _login(client, role="hr", suffix="conflict_a_hr")
    first_created = _create_invitation_and_slot(
        client,
        application_id=first["application_id"],
        hr_user_id=first["hr"]["id"],
        slot_start=_next_slot_start(days=3),
    )
    _login(client, role="candidate", suffix="conflict_a_candidate")
    _book(client, token=first_created["invitation"]["token"], slot_id=first_created["slot"]["id"])

    _login(client, role="hr", suffix="conflict_b_hr")
    second_created = _create_invitation_and_slot(
        client,
        application_id=second["application_id"],
        hr_user_id=first["hr"]["id"],
        slot_start=_next_slot_start(days=3),
    )
    _login(client, role="candidate", suffix="conflict_b_candidate")
    response = client.post(
        f"/api/v1/human-interviews/invitations/token/{second_created['invitation']['token']}/book",
        json={
            "slot_id": second_created["slot"]["id"],
            "contact": {"name": "候选人", "email": "candidate@example.com"},
        },
    )

    assert_error_contract(response, status_code=409, code=ErrorCode.INTERVIEW_CONFLICT)


def test_candidate_can_cancel_before_24_hours(client: TestClient) -> None:
    context = _setup_ready_application(client, suffix="candidate_cancel")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix="candidate_cancel_candidate")
    booking = _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])

    response = client.post(
        f"/api/v1/human-interviews/bookings/{booking['id']}/cancel",
        json={"reason": "时间冲突, 提前取消"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["data"]["status"] == "cancelled"


def test_company_cancel_within_24_hours_requires_reason(
    client: TestClient,
    db_session: Session,
) -> None:
    context = _setup_ready_application(client, suffix="late_cancel")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix="late_cancel_candidate")
    booking = _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])

    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == booking["id"])
    )
    assert booking_row is not None
    near_start = datetime.now(UTC) + timedelta(hours=23)
    booking_row.start_at = near_start
    booking_row.end_at = near_start + timedelta(hours=1)
    booking_row.buffer_end_at = booking_row.end_at + timedelta(minutes=15)
    db_session.commit()

    _login(client, role="hr", suffix="late_cancel_hr")
    response = client.post(
        f"/api/v1/human-interviews/bookings/{booking['id']}/cancel",
        json={},
    )

    assert_error_contract(response, status_code=409, code=ErrorCode.INTERVIEW_INVALID_STATE)


def test_reschedule_marks_old_booking_and_creates_linked_new_booking(client: TestClient) -> None:
    context = _setup_ready_application(client, suffix="reschedule")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix="reschedule_candidate")
    old_booking = _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])

    _login(client, role="hr", suffix="reschedule_hr")
    new_slot = client.post(
        "/api/v1/human-interviews/availability-slots",
        json={
            "interviewer_id": created["invitation"]["primary_interviewer_id"],
            "start_at": _next_slot_start(days=5).isoformat(),
            "duration_minutes": 60,
        },
    )
    assert new_slot.status_code == 201, new_slot.text

    _login(client, role="candidate", suffix="reschedule_candidate")
    response = client.post(
        f"/api/v1/human-interviews/bookings/{old_booking['id']}/reschedule",
        json={"slot_id": new_slot.json()["data"]["id"], "reason": "候选人申请改期"},
    )

    assert response.status_code == 200, response.text
    new_booking = response.json()["data"]
    assert new_booking["status"] == "confirmed"
    assert new_booking["rescheduled_from_id"] == old_booking["id"]

    old_detail = client.get(f"/api/v1/human-interviews/bookings/{old_booking['id']}")
    assert old_detail.status_code == 200, old_detail.text
    assert old_detail.json()["data"]["status"] == "rescheduled"


def test_interviewer_report_publish_candidate_only_sees_summary(
    client: TestClient,
    db_session: Session,
) -> None:
    context = _setup_ready_application(client, suffix="report")
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix="report_candidate")
    booking = _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])

    _login(client, role="hr", suffix="report_hr")
    completed = client.post(
        f"/api/v1/human-interviews/bookings/{booking['id']}/mark",
        json={"status": "completed"},
    )
    assert completed.status_code == 200, completed.text

    submitted = client.post(
        f"/api/v1/human-interviews/bookings/{booking['id']}/report",
        json={
            "conclusion": "建议进入下一轮。",
            "competencies": ["需求分析", "项目推进"],
            "key_observations": "能清楚解释项目取舍。",
            "risks": "商业化指标经验仍需观察。",
            "candidate_summary": "你在需求拆解和表达方面表现较好, 后续可加强指标意识。",
            "internal_notes": "HR 内部备注: 薪资期望需二次确认。",
        },
    )
    assert submitted.status_code == 201, submitted.text
    report_id = submitted.json()["data"]["id"]

    report_row = db_session.scalar(
        select(HumanInterviewReport).where(HumanInterviewReport.public_id == report_id)
    )
    assert report_row is not None
    assert report_row.status == "pending_hr_review"

    published = client.post(f"/api/v1/human-interviews/reports/{report_id}/publish")
    assert published.status_code == 200, published.text
    assert published.json()["data"]["internal_notes"] == "HR 内部备注: 薪资期望需二次确认。"

    _login(client, role="candidate", suffix="report_candidate")
    candidate_view = client.get(f"/api/v1/human-interviews/bookings/{booking['id']}/report")
    assert candidate_view.status_code == 200, candidate_view.text
    candidate_report = candidate_view.json()["data"]
    assert (
        candidate_report["candidate_summary"]
        == "你在需求拆解和表达方面表现较好, 后续可加强指标意识。"
    )
    assert candidate_report["internal_notes"] is None
    assert candidate_report["conclusion"] is None


def _make_confirmed_booking(client: TestClient, *, suffix: str) -> dict[str, Any]:
    context = _setup_ready_application(client, suffix=suffix)
    created = _create_invitation_and_slot(
        client,
        application_id=context["application_id"],
        hr_user_id=context["hr"]["id"],
    )
    _login(client, role="candidate", suffix=f"{suffix}_candidate")
    booking = _book(client, token=created["invitation"]["token"], slot_id=created["slot"]["id"])
    return {"context": context, "created": created, "booking": booking}


def _force_pending_expired(db_session: Session, booking_id: str) -> None:
    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == booking_id)
    )
    assert booking_row is not None
    booking_row.pending_confirmation_expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.commit()


def test_hr_can_request_pending_confirmation_with_history_audit_and_notifications(
    client: TestClient,
    db_session: Session,
) -> None:
    setup = _make_confirmed_booking(client, suffix="pending_request")

    _login(client, role="hr", suffix="pending_request_hr")
    response = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "meeting information needs refresh"},
    )

    assert response.status_code == 200, response.text
    booking = response.json()["data"]
    assert booking["status"] == "pending_confirmation"
    assert booking["pending_confirmation_expires_at"] is not None

    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == setup["booking"]["id"])
    )
    assert booking_row is not None
    history = db_session.scalar(
        select(BookingStatusHistory).where(
            BookingStatusHistory.booking_id == booking_row.id,
            BookingStatusHistory.next_status == "pending_confirmation",
        )
    )
    assert history is not None
    audit = db_session.scalar(
        select(BookingAuditRecord).where(
            BookingAuditRecord.entity_id == booking_row.id,
            BookingAuditRecord.action == "human_interview.booking.pending_confirmation_requested",
        )
    )
    assert audit is not None
    notification = db_session.scalar(
        select(Notification).where(
            Notification.notification_type == "human_interview_pending_confirmation",
            Notification.entity_public_id == setup["booking"]["id"],
        )
    )
    assert notification is not None


def test_pending_confirmation_not_expired_before_six_hours(
    client: TestClient,
    db_session: Session,
) -> None:
    setup = _make_confirmed_booking(client, suffix="pending_not_expired")

    _login(client, role="hr", suffix="pending_not_expired_hr")
    pending = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "temporary meeting link issue"},
    )
    assert pending.status_code == 200, pending.text

    expired = client.post("/api/v1/human-interviews/maintenance/expire-pending-confirmations")
    assert expired.status_code == 200, expired.text
    assert expired.json()["data"] == {"processed_count": 0, "booking_ids": []}

    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == setup["booking"]["id"])
    )
    assert booking_row is not None
    assert booking_row.status == "pending_confirmation"


def test_expired_pending_confirmation_releases_slot_and_allows_rebooking(
    client: TestClient,
    db_session: Session,
) -> None:
    setup = _make_confirmed_booking(client, suffix="pending_expired")

    _login(client, role="hr", suffix="pending_expired_hr")
    pending = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "offline address is unavailable"},
    )
    assert pending.status_code == 200, pending.text
    _force_pending_expired(db_session, setup["booking"]["id"])

    expired = client.post("/api/v1/human-interviews/maintenance/expire-pending-confirmations")
    assert expired.status_code == 200, expired.text
    assert expired.json()["data"]["processed_count"] == 1

    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == setup["booking"]["id"])
    )
    assert booking_row is not None
    assert booking_row.status == "expired"
    slot_row = db_session.scalar(
        select(AvailabilitySlot).where(AvailabilitySlot.public_id == setup["created"]["slot"]["id"])
    )
    assert slot_row is not None
    assert slot_row.status == "open"

    _login(client, role="candidate", suffix="pending_expired_candidate")
    new_booking = _book(
        client,
        token=setup["created"]["invitation"]["token"],
        slot_id=setup["created"]["slot"]["id"],
    )
    assert new_booking["status"] == "confirmed"
    assert new_booking["id"] != setup["booking"]["id"]


def test_complete_pending_confirmation_restores_confirmed_and_clears_expiry(
    client: TestClient,
    db_session: Session,
) -> None:
    setup = _make_confirmed_booking(client, suffix="pending_complete")

    _login(client, role="hr", suffix="pending_complete_hr")
    pending = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "meeting url needs replacement"},
    )
    assert pending.status_code == 200, pending.text

    completed = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/complete-confirmation",
        json={"meeting_url": "https://meet.example.com/reconfirmed"},
    )

    assert completed.status_code == 200, completed.text
    data = completed.json()["data"]
    assert data["status"] == "confirmed"
    assert data["pending_confirmation_expires_at"] is None
    assert data["meeting"]["meeting_url"] == "https://meet.example.com/reconfirmed"

    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == setup["booking"]["id"])
    )
    assert booking_row is not None
    assert booking_row.pending_confirmation_expires_at is None
    assert booking_row.pending_confirmation_reason is None


def test_candidate_cannot_trigger_pending_confirmation_maintenance_or_completion(
    client: TestClient,
) -> None:
    setup = _make_confirmed_booking(client, suffix="pending_forbidden")

    _login(client, role="candidate", suffix="pending_forbidden_candidate")
    pending = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "candidate should not do this"},
    )
    assert_error_contract(pending, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)

    completed = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/complete-confirmation",
        json={"meeting_url": "https://meet.example.com/forbidden"},
    )
    assert_error_contract(completed, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)

    expired = client.post("/api/v1/human-interviews/maintenance/expire-pending-confirmations")
    assert_error_contract(expired, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)

    reminders = client.post("/api/v1/human-interviews/maintenance/reminders")
    assert_error_contract(reminders, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)


def test_expired_booking_rejects_mutating_actions(
    client: TestClient,
    db_session: Session,
) -> None:
    setup = _make_confirmed_booking(client, suffix="expired_rejects")

    _login(client, role="hr", suffix="expired_rejects_hr")
    pending = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/pending-confirmation",
        json={"reason": "force timeout"},
    )
    assert pending.status_code == 200, pending.text
    _force_pending_expired(db_session, setup["booking"]["id"])
    expired = client.post("/api/v1/human-interviews/maintenance/expire-pending-confirmations")
    assert expired.status_code == 200, expired.text

    cancel = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/cancel",
        json={"reason": "too late"},
    )
    assert_error_contract(cancel, status_code=409, code=ErrorCode.INTERVIEW_INVALID_STATE)

    new_slot = client.post(
        "/api/v1/human-interviews/availability-slots",
        json={
            "interviewer_id": setup["created"]["invitation"]["primary_interviewer_id"],
            "start_at": _next_slot_start(days=5).isoformat(),
            "duration_minutes": 60,
        },
    )
    assert new_slot.status_code == 201, new_slot.text
    reschedule = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/reschedule",
        json={"slot_id": new_slot.json()["data"]["id"], "reason": "try reschedule"},
    )
    assert_error_contract(reschedule, status_code=409, code=ErrorCode.INTERVIEW_INVALID_STATE)

    marked = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/mark",
        json={"status": "completed"},
    )
    assert_error_contract(marked, status_code=409, code=ErrorCode.INTERVIEW_INVALID_STATE)

    report = client.post(
        f"/api/v1/human-interviews/bookings/{setup['booking']['id']}/report",
        json={"conclusion": "x", "candidate_summary": "x"},
    )
    assert_error_contract(report, status_code=409, code=ErrorCode.INTERVIEW_INVALID_STATE)


def test_notifications_are_user_scoped_and_can_be_marked_read(client: TestClient) -> None:
    _make_confirmed_booking(client, suffix="notification_read")

    _login(client, role="candidate", suffix="notification_read_candidate")
    candidate_list = client.get("/api/v1/notifications")
    assert candidate_list.status_code == 200, candidate_list.text
    candidate_notifications = candidate_list.json()["data"]["notifications"]
    assert candidate_notifications
    notification_id = candidate_notifications[0]["id"]

    _login(client, role="hr", suffix="notification_read_hr")
    hr_forbidden = client.post(f"/api/v1/notifications/{notification_id}/read")
    assert_error_contract(hr_forbidden, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)
    hr_list = client.get("/api/v1/notifications")
    assert hr_list.status_code == 200, hr_list.text
    assert notification_id not in {item["id"] for item in hr_list.json()["data"]["notifications"]}

    _login(client, role="candidate", suffix="notification_read_candidate")
    read_one = client.post(f"/api/v1/notifications/{notification_id}/read")
    assert read_one.status_code == 200, read_one.text
    assert read_one.json()["data"]["status"] == "read"
    read_all = client.post("/api/v1/notifications/read-all")
    assert read_all.status_code == 200, read_all.text
    final_list = client.get("/api/v1/notifications")
    assert final_list.status_code == 200, final_list.text
    assert all(item["status"] == "read" for item in final_list.json()["data"]["notifications"])


def test_booking_reminders_are_idempotent(client: TestClient, db_session: Session) -> None:
    setup = _make_confirmed_booking(client, suffix="reminder_idempotent")
    booking_row = db_session.scalar(
        select(InterviewBooking).where(InterviewBooking.public_id == setup["booking"]["id"])
    )
    assert booking_row is not None
    near_start = datetime.now(UTC) + timedelta(hours=23)
    booking_row.start_at = near_start
    booking_row.end_at = near_start + timedelta(hours=1)
    booking_row.buffer_end_at = booking_row.end_at + timedelta(minutes=15)
    booking_row.slot.start_at = booking_row.start_at
    booking_row.slot.end_at = booking_row.end_at
    db_session.commit()

    _login(client, role="hr", suffix="reminder_idempotent_hr")
    first = client.post("/api/v1/human-interviews/maintenance/reminders")
    assert first.status_code == 200, first.text
    assert first.json()["data"]["processed_count"] == 1
    second = client.post("/api/v1/human-interviews/maintenance/reminders")
    assert second.status_code == 200, second.text
    assert second.json()["data"]["processed_count"] == 0

    reminders = db_session.scalars(
        select(Notification).where(
            Notification.notification_type == "human_interview_booking_reminder",
            Notification.entity_public_id == setup["booking"]["id"],
        )
    ).all()
    assert len(reminders) == 2
