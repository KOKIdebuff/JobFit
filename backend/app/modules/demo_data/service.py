# ruff: noqa: E501, RUF001
from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import Settings
from app.core.exceptions import AppException
from app.core.time import utc_now
from app.modules.ai_runs.service import AiRunService
from app.modules.applications_matches.models import Application, MatchResult, RecruitmentDecision
from app.modules.auth_users.models import User
from app.modules.auth_users.schemas import AuthUser
from app.modules.auth_users.service import DEMO_CANDIDATE_EMAIL, DEMO_HR_EMAIL, AuthService
from app.modules.jobs.models import Job
from app.modules.reports.models import EvaluationReport
from app.modules.resumes.models import Resume
from app.modules.trials.models import TrialSubmission, TrialTask

DEMO_JOB_ID = "job_ai_pm_campus_001"
DEMO_APPLICATION_ID = "application_ai_pm_li_001"
DEMO_RESUME_ID = "resume_li_ai_pm_v2"
DEMO_MATCH_ID = "match_result_li_ai_pm_001"
DEMO_TRIAL_TASK_ID = "trial_task_application_ai_pm_li_001"
DEMO_TRIAL_SUBMISSION_ID = "trial_submission_application_ai_pm_li_001"
DEMO_REPORT_ID = "evaluation_report_application_ai_pm_li_001"
DEMO_DECISION_ID = "recruitment_decision_application_ai_pm_li_001"


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


def now_iso() -> str:
    return utc_now().isoformat()


def new_public_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def demo_profile() -> dict[str, Any]:
    return {
        "must_have": ["需求分析", "AI 产品理解", "数据分析", "项目推进"],
        "nice_to_have": ["RAG", "Prompt Engineering", "校园产品实践"],
        "responsibilities": ["设计 AI 招聘分析功能", "推进 MVP 验证", "基于数据复盘产品效果"],
        "risks": ["需要确认 AI 风险意识", "需要验证复杂需求拆解能力"],
    }


def demo_detail() -> dict[str, Any]:
    timestamp = now_iso()
    return {
        "page_status": "ready",
        "candidate": {
            "id": "candidate_li_001",
            "candidate_id": "candidate_li_001",
            "name": "李同学",
            "school": "星河大学",
            "major": "计算机科学与技术",
            "education": "本科",
            "graduationYear": 2026,
            "gpa": "3.8/4.0",
            "email_masked": "l***@example.com",
            "phone_masked": "138****2026",
            "status": "active",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "resume": {
            "id": DEMO_RESUME_ID,
            "resume_id": DEMO_RESUME_ID,
            "candidate_id": "candidate_li_001",
            "version": "AI 产品经理求职简历 V2",
            "rawText": "星河大学计算机科学与技术本科，GPA 3.8/4.0。主导 AI 简历助手需求定义、原型设计和匹配规则设计，参与 RAG 知识库项目。",
            "status": "active",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "candidate_profile": {
            "id": "candidate_profile_li_001",
            "candidate_profile_id": "candidate_profile_li_001",
            "candidate_id": "candidate_li_001",
            "resume_id": DEMO_RESUME_ID,
            "targetRole": "AI 产品经理",
            "summary": "具备 AI 产品实践和数据分析能力，但商业化判断与复杂项目推进仍需验证。",
            "skills": ["LLM", "RAG", "数据分析", "需求分析", "SQL"],
            "categories": [
                {
                    "id": "profile_core_skills",
                    "label": "核心技能",
                    "conclusion": "核心技能与岗位要求匹配。",
                    "evidence_ids": ["evidence_project"],
                    "tone": "positive",
                },
                {
                    "id": "profile_to_verify",
                    "label": "待验证能力",
                    "conclusion": "需要验证需求优先级、项目推进和 AI 风险意识。",
                    "evidence_ids": ["evidence_project"],
                    "tone": "warning",
                },
            ],
            "strengths": ["AI 产品实践", "数据分析", "技术沟通"],
            "projectHighlights": ["AI 简历助手", "校园知识库 RAG 项目"],
            "verificationNeeds": ["需求优先级判断", "复杂项目推进", "AI 风险意识"],
            "evidence": [
                {
                    "conclusion": "AI 简历助手项目",
                    "excerpt": "主导需求定义、原型设计和匹配规则设计。",
                }
            ],
            "status": "generated",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "application": {
            "id": DEMO_APPLICATION_ID,
            "application_id": DEMO_APPLICATION_ID,
            "job_id": DEMO_JOB_ID,
            "candidate_id": "candidate_li_001",
            "resume_id": DEMO_RESUME_ID,
            "appliedAt": timestamp,
            "favorite": False,
            "priority": False,
            "stage": "待生成验证方案",
            "status": "待生成验证方案",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "job": {
            "id": DEMO_JOB_ID,
            "job_id": DEMO_JOB_ID,
            "title": "AI 产品经理（校招）",
            "company": "星河智能",
            "owner": "陈经理",
            "status": "published",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "job_profile": {
            "mustHave": ["需求分析", "AI 产品理解", "数据分析", "项目推进"],
            "niceToHave": ["RAG", "提示词工程", "校园产品实践"],
        },
        "match_result": {
            "id": DEMO_MATCH_ID,
            "match_result_id": DEMO_MATCH_ID,
            "job_id": DEMO_JOB_ID,
            "candidate_id": "candidate_li_001",
            "application_id": DEMO_APPLICATION_ID,
            "candidate_profile_id": "candidate_profile_li_001",
            "total": 86,
            "ruleVersion": "match_rule_v1",
            "deterministicNotice": "分数由规则计算。",
            "aiNotice": "AI 只负责解释，不做最终招聘决定。",
            "sources": ["岗位画像", "候选人画像", "申请信息"],
            "reasons": ["AI 产品项目与岗位职责相关", "技能覆盖主要要求", "具备数据分析能力"],
            "gaps": ["商业化判断证据不足", "复杂项目推进待验证"],
            "risks": ["校园项目真实负责边界需要确认"],
            "dimensions": [],
            "evidence": [],
            "generatedAt": timestamp,
            "status": "completed",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "evidence_items": [
            {
                "id": "evidence_project",
                "job_id": DEMO_JOB_ID,
                "candidate_id": "candidate_li_001",
                "application_id": DEMO_APPLICATION_ID,
                "resume_id": DEMO_RESUME_ID,
                "type": "项目经历",
                "title": "AI 简历助手项目",
                "excerpt": "主导需求定义、原型设计和匹配规则设计。",
                "abilities": ["需求分析", "AI 产品理解"],
                "status": "active",
                "data_source": "mock",
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        ],
        "validation_recommendations": [
            {
                "id": "recommendation_priority",
                "job_id": DEMO_JOB_ID,
                "candidate_id": "candidate_li_001",
                "application_id": DEMO_APPLICATION_ID,
                "title": "建议重点验证需求优先级判断",
                "method": "结构化面试问题",
                "source": "岗位必备能力 + 候选人证据不足",
                "status": "pending",
                "data_source": "mock",
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        ],
        "hr_note": {
            "id": "hr_note_application_ai_pm_li_001",
            "application_id": DEMO_APPLICATION_ID,
            "content": "",
            "status": "empty",
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "ai_run": {
            "id": "ai_run_application_ai_pm_li_001",
            "application_id": DEMO_APPLICATION_ID,
            "status": "idle",
            "activeStep": 0,
            "data_source": "mock",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
        "assessment_plan": {
            "status": "ungenerated",
            "source": "ai",
            "focus": ["需求优先级判断", "复杂项目推进", "AI 风险意识"],
            "estimatedMinutes": "35 分钟",
            "interviewQuestions": [],
            "task": {
                "title": "设计 AI 简历分析功能的 MVP 验证方案",
                "background": "公司计划验证面向校招场景的 AI 简历分析能力。",
                "deliverables": ["500-800 字方案说明", "核心指标与风险清单"],
                "estimatedMinutes": 35,
            },
        },
    }


def demo_trial_state() -> dict[str, Any]:
    return {
        "job": {
            "id": DEMO_JOB_ID,
            "title": "AI 产品经理（校招）",
            "company": "星河智能",
            "owner": "陈经理",
        },
        "candidate": {
            "id": "candidate_li_001",
            "name": "李同学",
            "matchScore": 86,
            "strengths": ["LLM 产品经验", "需求分析", "数据分析"],
            "gaps": ["复杂需求拆解", "AI 风险意识", "MVP 范围控制"],
        },
        "application": {
            "id": DEMO_APPLICATION_ID,
            "stage": "待生成岗位能力试炼",
            "reportIncluded": False,
            "resubmissionAllowed": False,
        },
        "trial_task": {
            "id": DEMO_TRIAL_TASK_ID,
            "status": "ungenerated",
            "source": "ai",
            "title": "设计一套 AI 简历分析功能的 MVP 方案",
            "background": "公司计划为校招平台增加 AI 简历分析功能。",
            "requirements": [
                "明确目标用户和核心问题",
                "设计 MVP 功能范围",
                "说明 AI 与普通程序的职责边界",
            ],
            "deliverables": ["500-800 字方案说明", "核心指标与风险清单"],
            "deadline": "2026-06-18T18:00:00Z",
            "estimatedMinutes": 45,
            "criteria": [
                {"id": "understanding", "label": "问题理解", "score": 25},
                {"id": "completeness", "label": "方案完整性", "score": 25},
                {"id": "scope", "label": "MVP 范围控制", "score": 20},
                {"id": "risk", "label": "AI 风险意识", "score": 20},
                {"id": "clarity", "label": "表达清晰度", "score": 10},
            ],
        },
        "trial_submission": {
            "status": "empty",
            "body": "",
            "prototypeUrl": "",
            "attachments": [],
            "submitCount": 0,
            "saveFailNext": False,
        },
        "trial_evaluation": None,
        "ai_run": {"status": "idle", "activeStep": -1, "failNext": False},
    }


def preset_submission() -> dict[str, Any]:
    return {
        "body": "首版只处理候选人主动上传的简历，规则程序负责文件类型、字段完整性和确定性校验，生成式 AI 负责归纳经历、解释岗位差距并给出待确认建议。所有 AI 结果都需要用户确认后才能写入画像。",
        "prototypeUrl": "https://example.com/hirelink-demo",
        "attachments": [{"name": "mvp-plan.pdf", "size": 2480000, "type": "application/pdf"}],
    }


def preset_evaluation() -> dict[str, Any]:
    return {
        "total": 88,
        "dimensions": [
            {
                "id": "understanding",
                "label": "问题理解",
                "score": 25,
                "achieved": 23,
                "evidence": "明确限定目标用户场景。",
            },
            {
                "id": "completeness",
                "label": "方案完整性",
                "score": 25,
                "achieved": 22,
                "evidence": "覆盖上传、提取、分析和确认闭环。",
            },
        ],
        "highlight": "能区分规则程序和生成式 AI 的职责。",
        "gap": "指标定义仍可更具体。",
        "risk": "需要明确错误字段修正率的统计口径。",
        "disclaimer": "AI 参考评价，不代表最终招聘决定。",
    }


def create_report_payload(status: str) -> dict[str, Any]:
    return {
        "id": DEMO_REPORT_ID,
        "applicationId": DEMO_APPLICATION_ID,
        "status": status,
        "version": 1,
        "generatedAt": now_iso(),
        "summary": {
            "candidateName": "李同学",
            "jobTitle": "AI 产品经理（校招）",
            "totalScore": 86,
            "applicationDisplayId": DEMO_APPLICATION_ID,
        },
        "overall": "候选人与岗位具备较高相关性，建议 HR 结合试炼任务继续复核。",
        "hrReview": {
            "reviewed": status == "confirmed",
            "confirmed": status == "confirmed",
            "note": "",
            "priority": False,
            "growthActions": [],
        },
        "sections": [
            {
                "id": "match",
                "title": "匹配证据",
                "items": [
                    {
                        "title": "AI 产品实践",
                        "summary": "项目经历与岗位职责相关。",
                        "candidateFeedback": {"demonstratedBehavior": "能说明产品判断过程。"},
                    }
                ],
            }
        ],
        "generationActiveStep": 0,
    }


class HireLinkCoreService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.ai_runs = AiRunService(session)

    def ensure_demo_data(self) -> None:
        AuthService(self.session, self.settings).ensure_demo_accounts()
        hr = self._user_by_email(DEMO_HR_EMAIL)
        candidate = self._user_by_email(DEMO_CANDIDATE_EMAIL)
        job = self.session.scalar(select(Job).where(Job.public_id == DEMO_JOB_ID))
        if job is None:
            job = Job(
                public_id=DEMO_JOB_ID,
                created_by=hr.id,
                title="AI 产品经理（校招）",
                company="星河智能",
                location="北京",
                employment_type="campus",
                status="published",
                jd_text="负责 AI 招聘分析功能的 MVP 设计与验证。",
                profile_json=dumps(demo_profile()),
                data_source="mock",
            )
            self.session.add(job)
            self.session.flush()
        resume = self.session.scalar(select(Resume).where(Resume.public_id == DEMO_RESUME_ID))
        if resume is None:
            resume = Resume(
                public_id=DEMO_RESUME_ID,
                owner_id=candidate.id,
                file_name="li-ai-pm-resume.txt",
                mime_type="text/plain",
                size_bytes=512,
                raw_text=demo_detail()["resume"]["rawText"],
                structured_json=dumps({"skills": ["LLM", "RAG", "SQL"]}),
                status="completed",
                data_source="mock",
            )
            self.session.add(resume)
            self.session.flush()
        application = self.session.scalar(
            select(Application).where(Application.public_id == DEMO_APPLICATION_ID)
        )
        if application is None:
            application = Application(
                public_id=DEMO_APPLICATION_ID,
                job_id=job.id,
                candidate_id=candidate.id,
                resume_id=resume.id,
                status="applied",
                detail_json=dumps(demo_detail()),
            )
            self.session.add(application)
            self.session.flush()
        if (
            self.session.scalar(
                select(MatchResult).where(MatchResult.application_id == application.id)
            )
            is None
        ):
            self.session.add(
                MatchResult(
                    public_id=DEMO_MATCH_ID,
                    application_id=application.id,
                    total_score=86,
                    payload_json=dumps(loads_dict(application.detail_json)["match_result"]),
                    data_source="mock",
                )
            )
        if (
            self.session.scalar(select(TrialTask).where(TrialTask.application_id == application.id))
            is None
        ):
            trial = demo_trial_state()
            self.session.add(
                TrialTask(
                    public_id=DEMO_TRIAL_TASK_ID,
                    application_id=application.id,
                    status="ungenerated",
                    source="mock",
                    payload_json=dumps(trial["trial_task"]),
                    created_by=hr.id,
                )
            )
        if (
            self.session.scalar(
                select(TrialSubmission).where(TrialSubmission.application_id == application.id)
            )
            is None
        ):
            self.session.add(
                TrialSubmission(
                    public_id=DEMO_TRIAL_SUBMISSION_ID,
                    application_id=application.id,
                    status="empty",
                    attachments_json="[]",
                )
            )
        if (
            self.session.scalar(
                select(EvaluationReport).where(EvaluationReport.application_id == application.id)
            )
            is None
        ):
            self.session.add(
                EvaluationReport(
                    public_id=DEMO_REPORT_ID,
                    application_id=application.id,
                    status="not_generated",
                    hr_payload_json=dumps(create_report_payload("not_generated")),
                    candidate_payload_json=dumps(create_report_payload("not_generated")),
                    data_source="mock",
                )
            )
        if (
            self.session.scalar(
                select(RecruitmentDecision).where(
                    RecruitmentDecision.application_id == application.id
                )
            )
            is None
        ):
            self.session.add(
                RecruitmentDecision(
                    public_id=DEMO_DECISION_ID,
                    application_id=application.id,
                    status="pending",
                    version=0,
                    history_json="[]",
                )
            )
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()

    def list_jobs(self, user: AuthUser) -> list[dict[str, Any]]:
        self.ensure_demo_data()
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        jobs = self.session.scalars(
            select(Job).where(Job.created_by == user.id).order_by(Job.created_at.desc())
        ).all()
        return [self.job_dto(job) for job in jobs]

    def create_job(self, user: AuthUser, payload: dict[str, Any]) -> dict[str, Any]:
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        job = Job(
            public_id=new_public_id("job"),
            created_by=user.id,
            title=str(payload.get("title") or "未命名岗位"),
            company=str(payload.get("company") or user.organization_name or "HireLink"),
            location=str(payload.get("location") or ""),
            employment_type=str(payload.get("employment_type") or "full_time"),
            status="draft",
            jd_text=str(payload.get("jd_text") or ""),
            profile_json=dumps({}),
            data_source="mock",
        )
        self.session.add(job)
        self.session.commit()
        return self.job_dto(job)

    def parse_job(self, user: AuthUser, job_public_id: str) -> dict[str, Any]:
        job = self.get_hr_job(user, job_public_id)
        job.status = "pending_confirmation"
        job.profile_json = dumps(demo_profile())
        job.updated_at = utc_now()
        self.ai_runs.create_run(
            public_id=f"ai_job_parse_{job.public_id}_{int(utc_now().timestamp())}",
            actor_id=user.id,
            operation="job_parse",
            prompt_version="job_parse_prompt_v1",
            schema_version="job_parse_v1",
            input_summary={"job_id": job.public_id},
            output_summary={"status": "pending_confirmation"},
            duration_ms=900,
        )
        self.session.commit()
        return self.job_dto(job)

    def list_resumes(self, user: AuthUser) -> list[dict[str, Any]]:
        self.ensure_demo_data()
        resumes = self.session.scalars(
            select(Resume).where(Resume.owner_id == user.id).order_by(Resume.created_at.desc())
        ).all()
        return [self.resume_dto(resume) for resume in resumes]

    def create_resume(self, user: AuthUser, payload: dict[str, Any]) -> dict[str, Any]:
        if user.role != "candidate":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        resume = Resume(
            public_id=new_public_id("resume"),
            owner_id=user.id,
            file_name=str(payload.get("file_name") or "resume.txt"),
            mime_type=str(payload.get("mime_type") or "text/plain"),
            size_bytes=int(payload.get("size_bytes") or 0),
            raw_text=str(payload.get("raw_text") or ""),
            structured_json=dumps({"source": "manual"}),
            status="completed",
            data_source="mock",
        )
        self.session.add(resume)
        self.ai_runs.create_run(
            public_id=f"ai_resume_parse_{resume.public_id}",
            actor_id=user.id,
            operation="resume_parse",
            prompt_version="resume_parse_prompt_v1",
            schema_version="resume_parse_v1",
            input_summary={"resume_id": resume.public_id},
            output_summary={"status": "completed"},
            duration_ms=900,
        )
        self.session.commit()
        return self.resume_dto(resume)

    def create_application(self, user: AuthUser, payload: dict[str, Any]) -> dict[str, Any]:
        if user.role != "candidate":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        job = self.public_job(str(payload.get("job_id") or ""))
        resume = self.session.scalar(
            select(Resume).where(
                Resume.public_id == str(payload.get("resume_id") or ""), Resume.owner_id == user.id
            )
        )
        if resume is None:
            raise AppException(ErrorCode.RESUME_NOT_FOUND)
        existing = self.session.scalar(
            select(Application).where(
                Application.job_id == job.id, Application.candidate_id == user.id
            )
        )
        if existing is not None:
            raise AppException(ErrorCode.APPLICATION_CONFLICT)
        application_public_id = new_public_id("application")
        detail = self.new_application_detail(user, job, resume, application_public_id)
        application = Application(
            public_id=application_public_id,
            job_id=job.id,
            candidate_id=user.id,
            resume_id=resume.id,
            status="applied",
            detail_json=dumps(detail),
        )
        self.session.add(application)
        self.session.flush()
        self._ensure_application_state(application, job.created_by)
        self.session.commit()
        return self.application_detail(user, application.public_id)

    def hr_candidates(self, user: AuthUser, job_public_id: str) -> dict[str, Any]:
        job = self.get_hr_job(user, job_public_id)
        applications = self.session.scalars(
            select(Application)
            .where(Application.job_id == job.id)
            .order_by(Application.created_at.desc())
        ).all()
        return {
            "job": self.job_dto(job),
            "candidates": [self.candidate_summary(app) for app in applications],
        }

    def application_detail(self, user: AuthUser, application_public_id: str) -> dict[str, Any]:
        self.ensure_demo_data()
        app = self.application_for_user(user, application_public_id)
        detail = loads_dict(app.detail_json)
        detail["trial_state"] = self.trial_state(app)
        detail["decision"] = self.decision_dto(app)
        return detail

    def candidate_applications(self, user: AuthUser) -> list[dict[str, Any]]:
        self.ensure_demo_data()
        if user.role != "candidate":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        apps = self.session.scalars(
            select(Application).where(Application.candidate_id == user.id)
        ).all()
        return [
            {
                "application_id": app.public_id,
                "job_id": app.job.public_id,
                "job_title": app.job.title,
                "company": app.job.company,
                "status": app.status,
                "trial_url": f"/candidate/applications/{app.public_id}/trial",
                "report_url": f"/candidate/applications/{app.public_id}/report",
            }
            for app in apps
        ]

    def update_trial_task(
        self, user: AuthUser, application_public_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        task = self.require_trial_task(app)
        data = loads_dict(task.payload_json) or demo_trial_state()["trial_task"]
        action = str(payload.get("action") or "generate")
        if action == "generate":
            data = demo_trial_state()["trial_task"]
            data["status"] = "draft"
            data["generatedAt"] = now_iso()
            task.status = "draft"
            self.ai_runs.create_run(
                public_id=f"ai_trial_task_{app.public_id}_{int(utc_now().timestamp())}",
                actor_id=user.id,
                application_id=app.id,
                operation="trial_task_generate",
                prompt_version="trial_task_prompt_v1",
                schema_version="trial_task_v1",
                input_summary={"application_id": app.public_id},
                output_summary={"status": "draft"},
                duration_ms=1200,
            )
        elif action == "publish":
            data["status"] = "published"
            data["publishedAt"] = now_iso()
            task.status = "published"
            task.published_at = utc_now()
        elif action == "update":
            next_task = payload.get("task")
            if isinstance(next_task, dict):
                data.update(next_task)
            data["status"] = "draft"
            task.status = "draft"
        task.payload_json = dumps(data)
        task.updated_at = utc_now()
        self.session.commit()
        return self.trial_state(app)

    def update_trial_submission(
        self, user: AuthUser, application_public_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        if user.role != "candidate":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        task = self.require_trial_task(app)
        submission = self.require_trial_submission(app)
        action = str(payload.get("action") or "draft")
        if action == "start":
            task.status = "in_progress"
            submission.status = "in_progress"
        elif action == "preset":
            preset = preset_submission()
            submission.body = str(preset["body"])
            submission.prototype_url = str(preset["prototypeUrl"])
            submission.attachments_json = dumps(preset["attachments"])
            submission.status = "in_progress"
        elif action == "draft":
            submission.body = str(payload.get("body") or submission.body)
            submission.prototype_url = str(
                payload.get("prototype_url")
                or payload.get("prototypeUrl")
                or submission.prototype_url
            )
            attachments = payload.get("attachments")
            if isinstance(attachments, list):
                submission.attachments_json = dumps(attachments)
            submission.status = "draft_saved"
        elif action == "submit":
            if submission.submit_count > 0:
                raise AppException(ErrorCode.TRIAL_SUBMISSION_LIMIT_REACHED)
            submission.status = "submitted"
            submission.submit_count += 1
            submission.submitted_at = utc_now()
            submission.evaluation_json = dumps(preset_evaluation())
            task.status = "evaluated"
            self.ai_runs.create_run(
                public_id=f"ai_trial_evaluation_{app.public_id}_{int(utc_now().timestamp())}",
                actor_id=user.id,
                application_id=app.id,
                operation="trial_submission_evaluate",
                prompt_version="trial_eval_prompt_v1",
                schema_version="trial_eval_v1",
                input_summary={"application_id": app.public_id},
                output_summary={"status": "evaluated"},
                duration_ms=1500,
            )
        submission.updated_at = utc_now()
        task.updated_at = utc_now()
        self.session.commit()
        return self.trial_state(app)

    def generate_report(self, user: AuthUser, application_public_id: str) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        report = self.require_report(app)
        report.status = "pending_review"
        report.version += 1
        report.generated_at = utc_now()
        report.hr_payload_json = dumps(create_report_payload("pending_review"))
        report.candidate_payload_json = dumps(create_report_payload("pending_review"))
        report.updated_at = utc_now()
        self.ai_runs.create_run(
            public_id=f"ai_report_{app.public_id}_{int(utc_now().timestamp())}",
            actor_id=user.id,
            application_id=app.id,
            operation="report_generate",
            prompt_version="report_prompt_v1",
            schema_version="report_v1",
            input_summary={"application_id": app.public_id},
            output_summary={"status": "pending_review"},
            duration_ms=1800,
        )
        self.session.commit()
        return self.report_for_user(user, application_public_id)

    def confirm_report(self, user: AuthUser, application_public_id: str) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        report = self.require_report(app)
        if report.status not in {"pending_review", "fallback", "stale"}:
            raise AppException(ErrorCode.REPORT_INVALID_STATE)
        report.status = "confirmed"
        report.confirmed_at = utc_now()
        report.confirmed_by = user.id
        report.hr_payload_json = dumps(create_report_payload("confirmed"))
        report.candidate_payload_json = dumps(create_report_payload("confirmed"))
        report.updated_at = utc_now()
        self.session.commit()
        return self.report_for_user(user, application_public_id)

    def report_for_user(self, user: AuthUser, application_public_id: str) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        report = self.require_report(app)
        if user.role == "candidate" and report.status != "confirmed":
            raise AppException(ErrorCode.REPORT_NOT_CONFIRMED)
        payload = loads_dict(
            report.hr_payload_json if user.role == "hr" else report.candidate_payload_json
        )
        payload["status"] = report.status
        payload["version"] = report.version
        payload["confirmedAt"] = report.confirmed_at.isoformat() if report.confirmed_at else None
        return {"report": payload, "access": "allowed"}

    def submit_decision(
        self, user: AuthUser, application_public_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        app = self.application_for_user(user, application_public_id)
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        decision = self.require_decision(app)
        reason = str(payload.get("reason") or "").strip()
        outcome = str(payload.get("outcome") or "").strip()
        if not reason or outcome not in {"advance_to_human_interview", "hold", "reject"}:
            raise AppException(ErrorCode.COMMON_VALIDATION_FAILED)
        history = loads_list(decision.history_json)
        now = utc_now()
        decision.status = "submitted"
        decision.outcome = outcome
        decision.reason = reason
        decision.internal_note = (
            str(payload.get("internal_note") or payload.get("internalNote") or "").strip() or None
        )
        decision.decided_by = user.id
        decision.version += 1
        decision.updated_at = now
        history.insert(
            0,
            {
                "id": f"decision_history_{app.public_id}_v{decision.version}",
                "applicationId": app.public_id,
                "nextOutcome": outcome,
                "reason": reason,
                "operatorName": user.display_name,
                "createdAt": now.isoformat(),
            },
        )
        decision.history_json = dumps(history)
        self.session.commit()
        return self.decision_dto(app)

    def list_ai_runs(self, user: AuthUser) -> list[dict[str, Any]]:
        self.ensure_demo_data()
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        runs = self.ai_runs.list_runs()
        allowed_job_ids = set(
            self.session.scalars(select(Job.id).where(Job.created_by == user.id)).all()
        )
        result: list[dict[str, Any]] = []
        for run in runs:
            if run.application is None:
                if run.actor_id == user.id:
                    result.append(self.ai_runs.to_dto(run).model_dump(mode="json"))
                continue
            if run.application.job_id in allowed_job_ids:
                result.append(self.ai_runs.to_dto(run).model_dump(mode="json"))
        self.session.commit()
        return result

    def get_hr_job(self, user: AuthUser, public_id: str) -> Job:
        self.ensure_demo_data()
        if user.role != "hr":
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        job = self.session.scalar(
            select(Job).where(Job.public_id == public_id, Job.created_by == user.id)
        )
        if job is None:
            raise AppException(ErrorCode.JOB_NOT_FOUND)
        return job

    def public_job(self, public_id: str) -> Job:
        self.ensure_demo_data()
        job = self.session.scalar(select(Job).where(Job.public_id == public_id))
        if job is None:
            raise AppException(ErrorCode.JOB_NOT_FOUND)
        return job

    def application_for_user(self, user: AuthUser, public_id: str) -> Application:
        self.ensure_demo_data()
        app = self.session.scalar(select(Application).where(Application.public_id == public_id))
        if app is None:
            raise AppException(ErrorCode.APPLICATION_NOT_FOUND)
        if user.role == "candidate" and app.candidate_id != user.id:
            raise AppException(ErrorCode.APPLICATION_NOT_FOUND)
        if user.role == "hr" and app.job.created_by != user.id:
            raise AppException(ErrorCode.APPLICATION_NOT_FOUND)
        return app

    def _user_by_email(self, email: str) -> User:
        user = self.session.scalar(select(User).where(User.email == email))
        if user is None:
            raise AppException(ErrorCode.USER_NOT_FOUND)
        return user

    def new_application_detail(
        self, user: AuthUser, job: Job, resume: Resume, application_public_id: str
    ) -> dict[str, Any]:
        detail = demo_detail()
        timestamp = now_iso()
        detail["candidate"].update(
            {
                "id": str(user.id),
                "candidate_id": str(user.id),
                "name": user.display_name,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        )
        detail["resume"].update(
            {
                "id": resume.public_id,
                "resume_id": resume.public_id,
                "candidate_id": str(user.id),
                "version": resume.file_name,
                "rawText": resume.raw_text,
                "status": resume.status,
                "created_at": resume.created_at.isoformat(),
                "updated_at": resume.updated_at.isoformat(),
            }
        )
        detail["application"].update(
            {
                "id": application_public_id,
                "application_id": application_public_id,
                "job_id": job.public_id,
                "candidate_id": str(user.id),
                "resume_id": resume.public_id,
                "appliedAt": timestamp,
                "stage": "已申请",
                "status": "applied",
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        )
        detail["job"].update(
            {
                "id": job.public_id,
                "job_id": job.public_id,
                "title": job.title,
                "company": job.company,
                "status": job.status,
                "created_at": job.created_at.isoformat(),
                "updated_at": job.updated_at.isoformat(),
            }
        )
        detail["match_result"].update(
            {
                "id": f"match_result_{application_public_id}",
                "match_result_id": f"match_result_{application_public_id}",
                "job_id": job.public_id,
                "candidate_id": str(user.id),
                "application_id": application_public_id,
                "total": 0,
                "status": "pending",
            }
        )
        return detail

    def _ensure_application_state(self, app: Application, created_by: UUID | None = None) -> None:
        if app.match_result is None:
            app.match_result = MatchResult(
                public_id=new_public_id("match_result"),
                application_id=app.id,
                total_score=0,
                payload_json=dumps({"status": "pending"}),
                data_source="mock",
            )
        if app.trial_task is None:
            trial = demo_trial_state()
            app.trial_task = TrialTask(
                public_id=new_public_id("trial_task"),
                application_id=app.id,
                status="ungenerated",
                source="mock",
                payload_json=dumps(trial["trial_task"]),
                created_by=created_by,
            )
        if app.trial_submission is None:
            app.trial_submission = TrialSubmission(
                public_id=new_public_id("trial_submission"),
                application_id=app.id,
                status="empty",
                attachments_json="[]",
            )
        if app.report is None:
            app.report = EvaluationReport(
                public_id=new_public_id("evaluation_report"),
                application_id=app.id,
                status="not_generated",
                hr_payload_json=dumps(create_report_payload("not_generated")),
                candidate_payload_json=dumps(create_report_payload("not_generated")),
                data_source="mock",
            )
        if app.decision is None:
            app.decision = RecruitmentDecision(
                public_id=new_public_id("recruitment_decision"),
                application_id=app.id,
                status="pending",
                version=0,
                history_json="[]",
            )

    def job_dto(self, job: Job) -> dict[str, Any]:
        return {
            "id": str(job.id),
            "job_id": job.public_id,
            "public_id": job.public_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "employment_type": job.employment_type,
            "status": job.status,
            "profile": loads_dict(job.profile_json),
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
        }

    def resume_dto(self, resume: Resume) -> dict[str, Any]:
        return {
            "id": str(resume.id),
            "resume_id": resume.public_id,
            "public_id": resume.public_id,
            "file_name": resume.file_name,
            "mime_type": resume.mime_type,
            "size_bytes": resume.size_bytes,
            "raw_text": resume.raw_text,
            "structured": loads_dict(resume.structured_json),
            "status": resume.status,
            "created_at": resume.created_at.isoformat(),
        }

    def candidate_summary(self, app: Application) -> dict[str, Any]:
        detail = loads_dict(app.detail_json)
        candidate = detail.get("candidate", {})
        if not isinstance(candidate, dict):
            candidate = {}
        return {
            "application_id": app.public_id,
            "name": candidate.get("name", "候选人"),
            "title": app.job.title,
            "score": app.match_result.total_score if app.match_result else 0,
            "tags": candidate.get("skills", ["AI 产品", "数据分析"]),
            "location": app.job.location,
            "note": "待验证能力证据",
            "detail": detail,
            "decision": self.decision_dto(app),
        }

    def trial_state(self, app: Application) -> dict[str, Any]:
        state = demo_trial_state()
        task = self.require_trial_task(app)
        submission = self.require_trial_submission(app)
        state["trial_task"] = loads_dict(task.payload_json) or state["trial_task"]
        state["trial_task"]["status"] = task.status
        state["trial_submission"].update(
            {
                "status": submission.status,
                "body": submission.body,
                "prototypeUrl": submission.prototype_url,
                "attachments": loads_list(submission.attachments_json),
                "submittedAt": submission.submitted_at.isoformat()
                if submission.submitted_at
                else None,
                "submitCount": submission.submit_count,
            }
        )
        if submission.evaluation_json:
            state["trial_evaluation"] = loads_dict(submission.evaluation_json)
            state["ai_run"] = {"status": "completed", "activeStep": 5, "failNext": False}
        return state

    def decision_dto(self, app: Application) -> dict[str, Any]:
        decision = self.require_decision(app)
        return {
            "id": decision.public_id,
            "applicationId": app.public_id,
            "status": decision.status,
            "outcome": decision.outcome,
            "reason": decision.reason,
            "internalNote": decision.internal_note,
            "updatedAt": decision.updated_at.isoformat(),
            "version": decision.version,
            "history": loads_list(decision.history_json),
        }

    def require_trial_task(self, app: Application) -> TrialTask:
        if app.trial_task is None:
            raise AppException(ErrorCode.TRIAL_NOT_FOUND)
        return app.trial_task

    def require_trial_submission(self, app: Application) -> TrialSubmission:
        if app.trial_submission is None:
            raise AppException(ErrorCode.TRIAL_NOT_FOUND)
        return app.trial_submission

    def require_report(self, app: Application) -> EvaluationReport:
        if app.report is None:
            raise AppException(ErrorCode.REPORT_NOT_FOUND)
        return app.report

    def require_decision(self, app: Application) -> RecruitmentDecision:
        if app.decision is None:
            raise AppException(ErrorCode.APPLICATION_NOT_FOUND)
        return app.decision
