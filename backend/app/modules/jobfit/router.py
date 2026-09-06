from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from app.contracts.api import SuccessResponse, success_response
from app.core.config import Settings, get_settings
from app.db.session import get_session
from app.modules.auth_users.deps import current_user
from app.modules.auth_users.schemas import AuthUser
from app.modules.jobfit.schemas import (
    AnswerCreate,
    AssessmentCreate,
    CandidateProfileCreate,
    CompetencyProfile,
    InterviewSessionCreate,
    JobProfileCreate,
)
from app.modules.jobfit.service import JobFitService

router = APIRouter(tags=["jobfit"])
SESSION = Depends(get_session)
SETTINGS = Depends(get_settings)
UPLOAD = File(...)


def _request_id(request: Request) -> UUID:
    return UUID(str(request.state.request_id))


def service(session: Session = SESSION, settings: Settings = SETTINGS) -> JobFitService:
    return JobFitService(session, settings)


USER = Depends(current_user)
SERVICE = Depends(service)


@router.get("/competency-profiles")
def competency_profiles(
    request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    del user
    profiles = [CompetencyProfile.model_validate(item).model_dump() for item in domain.templates()]
    return success_response({"profiles": profiles}, request_id=_request_id(request))


@router.get("/competency-profiles/{role}")
def competency_profile(
    role: str, request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    del user
    profiles = {item["id"]: item for item in domain.templates()}
    if role not in profiles:
        from app.contracts.errors import ErrorCode
        from app.core.exceptions import AppException

        raise AppException(ErrorCode.JOB_NOT_FOUND, message="岗位胜任力模板不存在")
    data = CompetencyProfile.model_validate(profiles[role]).model_dump()
    return success_response(data, request_id=_request_id(request))


@router.post("/resumes/upload")
async def upload_resume(
    request: Request,
    file: UploadFile = UPLOAD,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    content = await file.read(domain.settings.max_upload_bytes + 1)
    data = domain.save_resume(user, file.filename or "resume.txt", file.content_type or "", content)
    return success_response(data, request_id=_request_id(request))


@router.get("/resumes")
def resumes(
    request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    return success_response({"resumes": domain.list_resumes(user)}, request_id=_request_id(request))


@router.get("/resumes/{resume_id}")
def resume(
    resume_id: str, request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    return success_response(domain.get_resume(resume_id, user), request_id=_request_id(request))


@router.post("/candidate-profiles")
def create_candidate_profile(
    payload: CandidateProfileCreate,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.create_candidate_profile(payload.resume_id, user), request_id=_request_id(request)
    )


@router.get("/candidate-profiles/{profile_id}")
def candidate_profile(
    profile_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.get_candidate_profile(profile_id, user), request_id=_request_id(request)
    )


@router.post("/job-profiles")
def create_job_profile(
    payload: JobProfileCreate,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.create_job_profile(
            payload.job_role, payload.title, payload.jd_text, payload.difficulty, user
        ),
        request_id=_request_id(request),
    )


@router.get("/job-profiles/{profile_id}")
def job_profile(
    profile_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.get_job_profile(profile_id, user), request_id=_request_id(request)
    )


@router.post("/assessments")
def create_assessment(
    payload: AssessmentCreate,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.create_assessment(
            payload.resume_id, payload.candidate_profile_id, payload.job_profile_id, user
        ),
        request_id=_request_id(request),
    )


@router.get("/assessments/{assessment_id}")
def assessment(
    assessment_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.get_assessment(assessment_id, user), request_id=_request_id(request)
    )


@router.post("/interview-sessions")
def create_interview(
    payload: InterviewSessionCreate,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.create_interview(payload.assessment_id, user), request_id=_request_id(request)
    )


@router.get("/interview-sessions")
def interviews(
    request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        {"interviews": domain.list_interviews(user)}, request_id=_request_id(request)
    )


@router.get("/interview-sessions/{session_id}")
def interview(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.get_interview(session_id, user),
        request_id=_request_id(request),
    )


@router.post("/interview-sessions/{session_id}/start")
def start_interview(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(domain.start(session_id, user), request_id=_request_id(request))


@router.post("/interview-sessions/{session_id}/answers")
def answer_interview(
    session_id: str,
    payload: AnswerCreate,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.answer(session_id, payload, user), request_id=_request_id(request)
    )


@router.post("/interview-sessions/{session_id}/complete")
def complete_interview(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(domain.complete(session_id, user), request_id=_request_id(request))


@router.get("/interview-sessions/{session_id}/evidence")
def interview_evidence(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        {"evidence": domain.evidence(session_id, user)}, request_id=_request_id(request)
    )


@router.get("/interview-sessions/{session_id}/memory")
def interview_memory(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(domain.memory(session_id, user), request_id=_request_id(request))


@router.get("/interview-sessions/{session_id}/retrieval-traces")
def retrieval_traces(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        {"traces": domain.traces(session_id, user)}, request_id=_request_id(request)
    )


@router.post("/interview-sessions/{session_id}/report")
def generate_report(
    session_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(
        domain.generate_report(session_id, user), request_id=_request_id(request)
    )


@router.get("/reports")
def reports(
    request: Request, user: AuthUser = USER, domain: JobFitService = SERVICE
) -> SuccessResponse[dict[str, Any]]:
    return success_response({"reports": domain.list_reports(user)}, request_id=_request_id(request))


@router.get("/reports/{report_id}")
def report(
    report_id: str,
    request: Request,
    user: AuthUser = USER,
    domain: JobFitService = SERVICE,
) -> SuccessResponse[dict[str, Any]]:
    return success_response(domain.get_report(report_id, user), request_id=_request_id(request))
