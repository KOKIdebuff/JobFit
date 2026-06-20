from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.contracts.api import success_response
from app.core.config import Settings, get_settings
from app.db.session import get_session
from app.modules.auth_users.deps import current_user
from app.modules.auth_users.schemas import AuthUser
from app.modules.demo_data.service import HireLinkCoreService

SESSION_DEPENDENCY = Depends(get_session)
SETTINGS_DEPENDENCY = Depends(get_settings)
USER_DEPENDENCY = Depends(current_user)

router = APIRouter(tags=["hirelink-core"])


def request_id(request: Request) -> UUID:
    return UUID(str(request.state.request_id))


def core_service(
    session: Session = SESSION_DEPENDENCY,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> HireLinkCoreService:
    return HireLinkCoreService(session, settings)


CORE_SERVICE_DEPENDENCY = Depends(core_service)


@router.get("/jobs")
def list_jobs(
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response({"jobs": service.list_jobs(user)}, request_id=request_id(request))


@router.post("/jobs")
def create_job(
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(service.create_job(user, payload), request_id=request_id(request))


@router.post("/jobs/{job_id}/parse")
def parse_job(
    job_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(service.parse_job(user, job_id), request_id=request_id(request))


@router.get("/resumes")
def list_resumes(
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response({"resumes": service.list_resumes(user)}, request_id=request_id(request))


@router.post("/resumes")
def create_resume(
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(service.create_resume(user, payload), request_id=request_id(request))


@router.post("/applications")
def create_application(
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.create_application(user, payload), request_id=request_id(request)
    )


@router.get("/candidate/applications")
def candidate_applications(
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        {"applications": service.candidate_applications(user)}, request_id=request_id(request)
    )


@router.get("/hr/jobs/{job_id}/candidates")
def hr_candidates(
    job_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(service.hr_candidates(user, job_id), request_id=request_id(request))


@router.get("/applications/{application_id}")
def application_detail(
    application_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.application_detail(user, application_id), request_id=request_id(request)
    )


@router.post("/applications/{application_id}/trial-task")
def trial_task(
    application_id: str,
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.update_trial_task(user, application_id, payload), request_id=request_id(request)
    )


@router.post("/applications/{application_id}/trial-submission")
def trial_submission(
    application_id: str,
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.update_trial_submission(user, application_id, payload),
        request_id=request_id(request),
    )


@router.post("/applications/{application_id}/report/generate")
def generate_report(
    application_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.generate_report(user, application_id), request_id=request_id(request)
    )


@router.post("/applications/{application_id}/report/confirm")
def confirm_report(
    application_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.confirm_report(user, application_id), request_id=request_id(request)
    )


@router.get("/applications/{application_id}/report")
def get_report(
    application_id: str,
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.report_for_user(user, application_id), request_id=request_id(request)
    )


@router.post("/applications/{application_id}/decision")
def submit_decision(
    application_id: str,
    payload: dict[str, Any],
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response(
        service.submit_decision(user, application_id, payload), request_id=request_id(request)
    )


@router.get("/ai-runs")
def ai_runs(
    request: Request,
    user: AuthUser = USER_DEPENDENCY,
    service: HireLinkCoreService = CORE_SERVICE_DEPENDENCY,
):
    return success_response({"runs": service.list_ai_runs(user)}, request_id=request_id(request))
