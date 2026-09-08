from __future__ import annotations

import re
from io import BytesIO
from json import dumps, loads
from typing import Any, cast
from uuid import UUID, uuid4

from docx import Document
from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import Settings
from app.core.exceptions import AppException
from app.core.time import utc_now
from app.modules.auth_users.schemas import AuthUser
from app.modules.jobfit.llm import (
    PROMPT_VERSION as LLM_QUESTION_PROMPT_VERSION,
)
from app.modules.jobfit.llm import (
    FollowUpRequest,
    LLMQuestionError,
    LLMQuestionResult,
    provider_for,
)
from app.modules.jobfit.models import (
    AnswerAssessment,
    AssessmentCase,
    AssessmentReport,
    CandidateCompetencyProfile,
    CompetencyEvidence,
    InterviewMemory,
    InterviewMessage,
    InterviewSession,
    JobCompetency,
    JobCompetencyProfile,
    LLMInvocation,
    RetrievalTrace,
)
from app.modules.jobfit.profiles import COMPETENCY_PROFILES, profile_for
from app.modules.jobfit.retrieval import KNOWLEDGE_VERSION, retrieve
from app.modules.jobfit.schemas import AnswerCreate, InterviewStatus, NextAction
from app.modules.resumes.models import Resume


def _json(value: Any) -> str:
    return dumps(value, ensure_ascii=False, separators=(",", ":"))


def _load(value: str) -> Any:
    return loads(value)


def _public(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def _bounded(value: float) -> float:
    return round(max(0.0, min(1.0, value)), 3)


class JobFitService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    def templates(self) -> list[dict[str, Any]]:
        return list(COMPETENCY_PROFILES.values())

    def _owned(self, model: type[Any], public_id: str, user: AuthUser) -> Any:
        item = self.session.scalar(select(model).where(model.public_id == public_id))
        if item is None:
            raise AppException(ErrorCode.COMMON_BAD_REQUEST, message="资源不存在")
        owner = getattr(item, "owner_id", getattr(item, "candidate_id", None))
        if owner is not None and owner != user.id:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        return item

    def extract_resume(self, filename: str, content_type: str, content: bytes) -> str:
        if len(content) > self.settings.max_upload_bytes:
            raise AppException(ErrorCode.FILE_TOO_LARGE)
        extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        allowed = {
            ".txt": {"text/plain", "application/octet-stream"},
            ".pdf": {"application/pdf", "application/octet-stream"},
            ".docx": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/octet-stream",
            },
        }
        if extension not in allowed:
            raise AppException(ErrorCode.FILE_UNSUPPORTED_TYPE)
        if content_type not in allowed[extension]:
            raise AppException(ErrorCode.FILE_MIME_MISMATCH)
        try:
            if extension == ".pdf":
                if not content.startswith(b"%PDF"):
                    raise AppException(ErrorCode.FILE_MIME_MISMATCH)
                text = "\n".join(
                    page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages
                )
            elif extension == ".docx":
                if not content.startswith(b"PK"):
                    raise AppException(ErrorCode.FILE_MIME_MISMATCH)
                text = "\n".join(
                    paragraph.text for paragraph in Document(BytesIO(content)).paragraphs
                )
            else:
                text = content.decode("utf-8-sig")
        except AppException:
            raise
        except Exception as exc:
            raise AppException(ErrorCode.RESUME_TEXT_EXTRACTION_FAILED) from exc
        normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip()).strip()
        if len(normalized) < 20:
            raise AppException(ErrorCode.FILE_TEXT_NOT_EXTRACTABLE)
        return normalized[:100_000]

    def save_resume(
        self, user: AuthUser, filename: str, content_type: str, content: bytes
    ) -> dict[str, Any]:
        text = self.extract_resume(filename, content_type, content)
        resume = Resume(
            public_id=_public("resume"),
            owner_id=user.id,
            file_name=filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1][:255],
            mime_type=content_type,
            size_bytes=len(content),
            raw_text=text,
            structured_json=_json(self._structure_resume(text)),
            status="completed",
            data_source="parsed",
        )
        self.session.add(resume)
        self.session.commit()
        return self.resume_dto(resume)

    def _structure_resume(self, text: str) -> dict[str, Any]:
        skill_terms = [
            "Python",
            "Java",
            "Spring",
            "Redis",
            "MySQL",
            "RAG",
            "LLM",
            "LangChain",
            "PyTorch",
            "TensorFlow",
            "SQL",
            "Docker",
            "Kubernetes",
            "产品设计",
            "需求分析",
            "数据分析",
            "用户研究",
        ]
        skills = [term for term in skill_terms if term.lower() in text.lower()]
        lines = text.splitlines()
        projects = [
            line[:300] for line in lines if re.search(r"项目|project|rag|系统", line, re.I)
        ][:8]
        experience = [
            line[:300] for line in lines if re.search(r"工作|实习|负责|主导|开发", line, re.I)
        ][:8]
        education = [line[:300] for line in lines if re.search(r"大学|学院|本科|硕士|博士", line)][
            :5
        ]
        return {
            "skills": skills,
            "projects": projects,
            "experience": experience,
            "education": education,
        }

    def resume_dto(self, resume: Resume) -> dict[str, Any]:
        return {
            "id": resume.public_id,
            "file_name": resume.file_name,
            "mime_type": resume.mime_type,
            "size_bytes": resume.size_bytes,
            "status": resume.status,
            "structured": _load(resume.structured_json),
            "created_at": resume.created_at.isoformat(),
        }

    def list_resumes(self, user: AuthUser) -> list[dict[str, Any]]:
        rows = self.session.scalars(
            select(Resume).where(Resume.owner_id == user.id).order_by(Resume.created_at.desc())
        )
        return [self.resume_dto(row) for row in rows]

    def get_resume(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        return self.resume_dto(self._owned(Resume, public_id, user))

    def create_candidate_profile(self, resume_id: str, user: AuthUser) -> dict[str, Any]:
        resume: Resume = self._owned(Resume, resume_id, user)
        structured = _load(resume.structured_json)
        evidence = [
            {"source": "resume", "excerpt": line[:240]}
            for line in resume.raw_text.splitlines()[:12]
        ]
        profile = CandidateCompetencyProfile(
            public_id=_public("candidate_profile"),
            owner_id=user.id,
            resume_id=resume.id,
            skills_json=_json(structured["skills"]),
            projects_json=_json(structured["projects"]),
            experience_json=_json(structured["experience"]),
            education_json=_json(structured["education"]),
            competency_tags_json=_json(structured["skills"][:8]),
            resume_evidence_json=_json(evidence),
        )
        self.session.add(profile)
        self.session.commit()
        return self.candidate_profile_dto(profile)

    def candidate_profile_dto(self, profile: CandidateCompetencyProfile) -> dict[str, Any]:
        return {
            "id": profile.public_id,
            "skills": _load(profile.skills_json),
            "projects": _load(profile.projects_json),
            "experience": _load(profile.experience_json),
            "education": _load(profile.education_json),
            "competency_tags": _load(profile.competency_tags_json),
            "resume_evidence": _load(profile.resume_evidence_json),
            "data_source": profile.data_source,
        }

    def get_candidate_profile(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        return self.candidate_profile_dto(self._owned(CandidateCompetencyProfile, public_id, user))

    def create_job_profile(
        self, role: str, title: str, jd_text: str, difficulty: int, user: AuthUser
    ) -> dict[str, Any]:
        template = profile_for(role)
        profile = JobCompetencyProfile(
            public_id=_public("job_profile"),
            owner_id=user.id,
            job_role=role,
            title=title,
            jd_text=jd_text,
            difficulty=difficulty,
            profile_version=template["version"],
            source_profile_id=template["id"],
        )
        self.session.add(profile)
        self.session.flush()
        for index, item in enumerate(template["competencies"]):
            self.session.add(
                JobCompetency(
                    profile_id=profile.id,
                    competency_id=item["id"],
                    name=item["name"],
                    description=item["description"],
                    weight=item["weight"],
                    rubric_json=_json(item["rubric"]),
                    question_strategy_json=_json(item["question_strategy"]),
                    evidence_requirements_json=_json(item["evidence_requirements"]),
                    display_order=index,
                )
            )
        self.session.commit()
        return self.job_profile_dto(profile)

    def _competencies(self, profile_id: UUID) -> list[JobCompetency]:
        return list(
            self.session.scalars(
                select(JobCompetency)
                .where(JobCompetency.profile_id == profile_id)
                .order_by(JobCompetency.display_order)
            )
        )

    def job_profile_dto(self, profile: JobCompetencyProfile) -> dict[str, Any]:
        return {
            "id": profile.public_id,
            "job_role": profile.job_role,
            "title": profile.title,
            "jd_text": profile.jd_text,
            "difficulty": profile.difficulty,
            "profile_version": profile.profile_version,
            "competencies": [
                {
                    "id": item.competency_id,
                    "name": item.name,
                    "description": item.description,
                    "weight": item.weight,
                    "rubric": _load(item.rubric_json),
                    "question_strategy": _load(item.question_strategy_json),
                    "evidence_requirements": _load(item.evidence_requirements_json),
                }
                for item in self._competencies(profile.id)
            ],
        }

    def get_job_profile(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        return self.job_profile_dto(self._owned(JobCompetencyProfile, public_id, user))

    def create_assessment(
        self, resume_id: str, candidate_profile_id: str, job_profile_id: str, user: AuthUser
    ) -> dict[str, Any]:
        resume: Resume = self._owned(Resume, resume_id, user)
        candidate = self._owned(CandidateCompetencyProfile, candidate_profile_id, user)
        job = self._owned(JobCompetencyProfile, job_profile_id, user)
        if candidate.resume_id != resume.id:
            raise AppException(ErrorCode.COMMON_VALIDATION_FAILED, message="候选人画像与简历不匹配")
        assessment = AssessmentCase(
            public_id=_public("assessment"),
            candidate_id=user.id,
            resume_id=resume.id,
            candidate_profile_id=candidate.id,
            job_profile_id=job.id,
        )
        self.session.add(assessment)
        self.session.commit()
        return {
            "id": assessment.public_id,
            "status": assessment.status,
            "resume_id": resume_id,
            "candidate_profile_id": candidate_profile_id,
            "job_profile_id": job_profile_id,
        }

    def _assessment(self, public_id: str, user: AuthUser) -> AssessmentCase:
        return cast(AssessmentCase, self._owned(AssessmentCase, public_id, user))

    def assessment_dto(self, assessment: AssessmentCase, user: AuthUser) -> dict[str, Any]:
        self._assessment(assessment.public_id, user)
        resume = self.session.get(Resume, assessment.resume_id)
        candidate = self.session.get(CandidateCompetencyProfile, assessment.candidate_profile_id)
        job = self.session.get(JobCompetencyProfile, assessment.job_profile_id)
        assert resume is not None and candidate is not None and job is not None
        return {
            "id": assessment.public_id,
            "status": assessment.status,
            "resume_id": resume.public_id,
            "candidate_profile_id": candidate.public_id,
            "job_profile_id": job.public_id,
        }

    def get_assessment(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        return self.assessment_dto(self._assessment(public_id, user), user)

    def create_interview(self, assessment_id: str, user: AuthUser) -> dict[str, Any]:
        assessment = self._assessment(assessment_id, user)
        existing = self.session.scalar(
            select(InterviewSession).where(InterviewSession.assessment_id == assessment.id)
        )
        if existing:
            return self.session_dto(existing, user)
        interview = InterviewSession(public_id=_public("interview"), assessment_id=assessment.id)
        self.session.add(interview)
        self.session.flush()
        self.session.add(InterviewMemory(session_id=interview.id))
        self.session.commit()
        return self.session_dto(interview, user)

    def _interview(self, public_id: str, user: AuthUser) -> InterviewSession:
        interview = self.session.scalar(
            select(InterviewSession).where(InterviewSession.public_id == public_id)
        )
        if interview is None:
            raise AppException(ErrorCode.INTERVIEW_NOT_FOUND)
        assessment = self.session.get(AssessmentCase, interview.assessment_id)
        if assessment is None or assessment.candidate_id != user.id:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        return interview

    def get_interview(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        return self.session_dto(self._interview(public_id, user), user)

    def _context(
        self, interview: InterviewSession
    ) -> tuple[AssessmentCase, JobCompetencyProfile, list[JobCompetency]]:
        assessment = self.session.get(AssessmentCase, interview.assessment_id)
        assert assessment is not None
        job = self.session.get(JobCompetencyProfile, assessment.job_profile_id)
        assert job is not None
        return assessment, job, self._competencies(job.id)

    def start(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        interview = self._interview(public_id, user)
        if interview.status == InterviewStatus.WAITING_FOR_ANSWER:
            return self.session_dto(interview, user)
        if interview.status != InterviewStatus.PREPARING:
            raise AppException(ErrorCode.INTERVIEW_INVALID_STATE)
        _, job, competencies = self._context(interview)
        first = competencies[0]
        interview.status = InterviewStatus.ASKING
        interview.current_competency_id = first.competency_id
        interview.current_difficulty = max(1, job.difficulty - 1)
        interview.started_at = utc_now()
        question = self._question(
            job, first, NextAction.FOLLOW_UP, None, interview.current_difficulty
        )
        self._save_question(interview, first, question, "STRUCTURED_OPENING")
        interview.status = InterviewStatus.WAITING_FOR_ANSWER
        interview.version += 1
        self.session.commit()
        return self.session_dto(interview, user)

    def _save_question(
        self, interview: InterviewSession, competency: JobCompetency, text: str, strategy: str
    ) -> InterviewMessage:
        turn = interview.turn_count + 1
        message = InterviewMessage(
            public_id=_public("q"),
            session_id=interview.id,
            turn_index=turn,
            role="assistant",
            content=text,
            competency_id=competency.competency_id,
            question_strategy=strategy,
            difficulty=interview.current_difficulty,
        )
        self.session.add(message)
        return message

    def _question(
        self,
        job: JobCompetencyProfile,
        competency: JobCompetency,
        action: NextAction,
        previous: str | None,
        difficulty: int,
    ) -> str:
        reference = ""
        if previous:
            snippet = re.sub(r"\s+", " ", previous)[:70]
            reference = f"你刚才提到“{snippet}”。"
        prompts = {
            NextAction.FOLLOW_UP: f"请结合一个真实经历，介绍你在{competency.name}方面承担的具体工作。",  # noqa: E501
            NextAction.CLARIFY: "这里我想确认得更准确一些：你所说的结果具体指什么，你本人负责了哪一部分？",  # noqa: E501
            NextAction.REQUEST_EXAMPLE: f"请给出一个你亲自处理的{competency.name}实例，并说明行动和可验证结果。",  # noqa: E501
            NextAction.SCENARIO: f"假设项目在上线后出现关键指标明显下降，你会如何运用{competency.name}定位并处理？",  # noqa: E501
            NextAction.CHALLENGE: "我注意到这与前面的描述存在一点张力。请说明两种说法的适用条件和真实边界。",  # noqa: E501
            NextAction.INCREASE_DIFFICULTY: f"我们再深入一点：如果资源受限且方案存在明显权衡，你会如何设计{competency.name}方案并验证取舍？",  # noqa: E501
            NextAction.DECREASE_DIFFICULTY: f"这个问题偏实践，我们换个角度：先说说你理解的{competency.name}核心目标是什么。",  # noqa: E501
            NextAction.NEXT_COMPETENCY: f"接下来聊聊{competency.name}。请从一个你最熟悉的项目场景开始。",  # noqa: E501
            NextAction.END_INTERVIEW: "感谢你的分享，本次面试信息已经足够，我将整理评估报告。",
        }
        return f"{reference}{prompts[action]}（当前难度 L{difficulty}）"

    def _assess(self, answer: str, difficulty: int) -> dict[str, Any]:
        length = len(answer)
        has_number = bool(re.search(r"\d|%|百分", answer))
        has_action = bool(re.search(r"我|负责|实现|定位|设计|优化|验证|上线|复盘", answer))
        has_tradeoff = bool(re.search(r"权衡|取舍|成本|延迟|一致性|风险|边界", answer))
        vague = bool(re.search(r"大概|可能|应该|不清楚|不知道|忘了", answer))
        relevance = _bounded(0.45 + min(length, 180) / 400 + (0.15 if has_action else 0))
        depth = _bounded(0.2 + min(length, 240) / 350 + (0.15 if has_tradeoff else 0))
        correctness = _bounded(
            0.55
            + (0.15 if has_action else 0)
            + (0.1 if has_tradeoff else 0)
            - (0.2 if vague else 0)
        )
        specificity = _bounded(
            0.2 + (0.3 if has_action else 0) + (0.25 if has_number else 0) + min(length, 160) / 800
        )
        strength = _bounded((depth + specificity + correctness) / 3)
        uncertainty = _bounded((0.7 if vague else 0.15) + (0.2 if length < 30 else 0))
        supported_level = 1
        if length >= 45:
            supported_level = 2
        if has_action and length >= 80:
            supported_level = 3
        if has_action and has_tradeoff and length >= 120:
            supported_level = 4
        if has_action and has_tradeoff and has_number and length >= 160:
            supported_level = 5
        return {
            "relevance": relevance,
            "depth": depth,
            "correctness": correctness,
            "specificity": specificity,
            "evidence_strength": strength,
            "uncertainty": uncertainty,
            "supported_level": min(supported_level, difficulty + 1),
            "has_example": has_action,
            "has_tradeoff": has_tradeoff,
            "missing_points": [
                label
                for condition, label in (
                    (has_action, "缺少个人行动"),
                    (has_number, "缺少可验证结果"),
                    (has_tradeoff, "缺少取舍或边界"),
                )
                if not condition
            ],
            "contradictions": [],
        }

    def _decide(
        self,
        interview: InterviewSession,
        assessment: dict[str, Any],
        competency_turns: int,
        competencies: list[JobCompetency],
    ) -> NextAction:
        if interview.turn_count + 1 >= 12:
            return NextAction.END_INTERVIEW
        if assessment["uncertainty"] >= 0.65 or assessment["relevance"] < 0.5:
            return NextAction.CLARIFY
        if not assessment["has_example"] and competency_turns < 2:
            return NextAction.REQUEST_EXAMPLE
        if assessment["evidence_strength"] >= 0.72 and interview.current_difficulty < 5:
            return NextAction.INCREASE_DIFFICULTY
        if assessment["evidence_strength"] < 0.45 and competency_turns < 2:
            return NextAction.DECREASE_DIFFICULTY
        covered = set(_load(interview.covered_competencies_json))
        if competency_turns >= 2:
            covered.add(interview.current_competency_id)
            interview.covered_competencies_json = _json(sorted(covered))
            if interview.turn_count + 1 >= 8 and len(covered) >= min(4, len(competencies)):
                return NextAction.END_INTERVIEW
            return NextAction.NEXT_COMPETENCY
        return NextAction.SCENARIO

    def _record_llm_invocation(
        self,
        *,
        interview: InterviewSession,
        turn_index: int,
        status: str,
        error_code: ErrorCode | None = None,
        duration_ms: int = 0,
        provider: str | None = None,
        model: str | None = None,
        prompt_version: str | None = None,
        knowledge_version: str | None = None,
    ) -> LLMInvocation:
        invocation = LLMInvocation(
            public_id=_public("llm"),
            session_id=interview.id,
            turn_index=turn_index,
            purpose="follow_up_from_answer",
            provider=provider or self.settings.llm_provider,
            model=model or self.settings.llm_model or "deterministic-v1",
            prompt_version=prompt_version or LLM_QUESTION_PROMPT_VERSION,
            knowledge_version=knowledge_version or KNOWLEDGE_VERSION,
            status=status,
            error_code=error_code.value if error_code else None,
            duration_ms=duration_ms,
        )
        self.session.add(invocation)
        return invocation

    def _memory_context(self, interview: InterviewSession) -> tuple[str, list[dict[str, Any]]]:
        memory = self.session.scalar(
            select(InterviewMemory).where(InterviewMemory.session_id == interview.id)
        )
        if memory is None:
            return "", []
        return memory.summary_memory, cast(list[dict[str, Any]], _load(memory.evidence_memory_json))

    def _generate_next_question(
        self,
        *,
        interview: InterviewSession,
        job: JobCompetencyProfile,
        competency: JobCompetency,
        action: NextAction,
        previous_answer: str,
        difficulty: int,
        retrieved: list[dict[str, Any]],
    ) -> tuple[str, LLMQuestionResult | None]:
        summary_memory, evidence_memory = self._memory_context(interview)
        request = FollowUpRequest(
            job_title=job.title,
            competency_name=competency.name,
            competency_description=competency.description,
            action=action,
            previous_answer=previous_answer,
            difficulty=difficulty,
            retrieval_chunks=retrieved,
            knowledge_version=KNOWLEDGE_VERSION,
            summary_memory=summary_memory,
            evidence_memory=evidence_memory,
            template_question=self._question(job, competency, action, previous_answer, difficulty),
        )
        result = provider_for(self.settings).generate_follow_up(request)
        return result.question, result

    def answer(self, public_id: str, payload: AnswerCreate, user: AuthUser) -> dict[str, Any]:
        interview = self._interview(public_id, user)
        duplicate = self.session.scalar(
            select(InterviewMessage).where(
                InterviewMessage.session_id == interview.id,
                InterviewMessage.client_request_id == payload.client_request_id,
            )
        )
        if duplicate:
            return self.session_dto(interview, user)
        if interview.status != InterviewStatus.WAITING_FOR_ANSWER:
            raise AppException(ErrorCode.INTERVIEW_INVALID_STATE)
        if interview.version != payload.expected_session_version:
            raise AppException(
                ErrorCode.INTERVIEW_CONFLICT, details={"current_version": interview.version}
            )
        question = self.session.scalar(
            select(InterviewMessage).where(
                InterviewMessage.session_id == interview.id,
                InterviewMessage.public_id == payload.question_id,
                InterviewMessage.role == "assistant",
            )
        )
        if question is None:
            raise AppException(ErrorCode.INTERVIEW_CONFLICT, message="问题与当前会话不匹配")
        if question.turn_index != interview.turn_count + 1:
            raise AppException(ErrorCode.INTERVIEW_CONFLICT, message="问题不是当前待回答问题")
        answered_current_turn = self.session.scalar(
            select(InterviewMessage).where(
                InterviewMessage.session_id == interview.id,
                InterviewMessage.role == "user",
                InterviewMessage.turn_index == question.turn_index,
            )
        )
        if answered_current_turn is not None:
            raise AppException(ErrorCode.INTERVIEW_CONFLICT, message="当前问题已回答")
        _, job, competencies = self._context(interview)
        competency = next(
            item for item in competencies if item.competency_id == question.competency_id
        )
        interview.status = InterviewStatus.EVALUATING
        result = self._assess(payload.answer, interview.current_difficulty)
        competency_turns = (
            len(
                list(
                    self.session.scalars(
                        select(InterviewMessage).where(
                            InterviewMessage.session_id == interview.id,
                            InterviewMessage.role == "user",
                            InterviewMessage.competency_id == competency.competency_id,
                        )
                    )
                )
            )
            + 1
        )
        interview.status = InterviewStatus.DECIDING
        action = self._decide(interview, result, competency_turns, competencies)
        next_competency = competency
        next_difficulty = interview.current_difficulty
        retrieved: list[dict[str, Any]] = []
        next_question = ""
        llm_result: LLMQuestionResult | None = None
        if action != NextAction.END_INTERVIEW:
            if action == NextAction.INCREASE_DIFFICULTY:
                next_difficulty = min(5, interview.current_difficulty + 1)
            elif action == NextAction.DECREASE_DIFFICULTY:
                next_difficulty = max(1, interview.current_difficulty - 1)
            if action == NextAction.NEXT_COMPETENCY:
                index = next(
                    i
                    for i, item in enumerate(competencies)
                    if item.competency_id == competency.competency_id
                )
                next_competency = competencies[(index + 1) % len(competencies)]
                next_difficulty = max(1, job.difficulty)
            retrieved = retrieve(job.job_role, next_competency.competency_id, payload.answer)
            try:
                next_question, llm_result = self._generate_next_question(
                    interview=interview,
                    job=job,
                    competency=next_competency,
                    action=action,
                    previous_answer=payload.answer,
                    difficulty=next_difficulty,
                    retrieved=retrieved,
                )
            except LLMQuestionError as exc:
                self.session.rollback()
                self._record_llm_invocation(
                    interview=interview,
                    turn_index=question.turn_index,
                    status="failed",
                    error_code=exc.code,
                    duration_ms=exc.duration_ms,
                )
                self.session.commit()
                raise AppException(exc.code, message=str(exc)) from exc
        answer = InterviewMessage(
            public_id=_public("a"),
            session_id=interview.id,
            turn_index=question.turn_index,
            role="user",
            content=payload.answer,
            input_method=payload.input_method,
            competency_id=competency.competency_id,
            question_strategy=question.question_strategy,
            difficulty=question.difficulty,
            client_request_id=payload.client_request_id,
        )
        self.session.add(answer)
        self.session.flush()
        evidence = CompetencyEvidence(
            public_id=_public("evidence"),
            session_id=interview.id,
            competency_id=competency.competency_id,
            question_id=question.public_id,
            answer_id=answer.public_id,
            signal=f"候选人在 L{question.difficulty} 问题中给出：{payload.answer[:180]}",
            strength=result["evidence_strength"],
            polarity="supports",
            supported_level=result["supported_level"],
            verified=result["evidence_strength"] >= 0.65,
        )
        self.session.add(evidence)
        self.session.add(
            AnswerAssessment(
                public_id=_public("assessment"),
                session_id=interview.id,
                question_id=question.public_id,
                answer_id=answer.public_id,
                competency_id=competency.competency_id,
                relevance=result["relevance"],
                depth=result["depth"],
                correctness=result["correctness"],
                specificity=result["specificity"],
                evidence_strength=result["evidence_strength"],
                uncertainty=result["uncertainty"],
                missing_points_json=_json(result["missing_points"]),
                contradictions_json=_json(result["contradictions"]),
                competency_signal_json=_json({"supported_level": result["supported_level"]}),
                recommended_next_action=action,
            )
        )
        interview.turn_count += 1
        if action == NextAction.END_INTERVIEW:
            interview.status = InterviewStatus.COMPLETED
            interview.completed_at = utc_now()
        else:
            interview.current_difficulty = next_difficulty
            interview.current_competency_id = next_competency.competency_id
            self.session.add(
                RetrievalTrace(
                    public_id=_public("retrieval"),
                    session_id=interview.id,
                    turn_index=interview.turn_count + 1,
                    purpose="next_question",
                    query_summary=f"{next_competency.name}:{payload.answer[:120]}",
                    source_ids_json=_json([item["source_id"] for item in retrieved]),
                    scores_json=_json([item["score"] for item in retrieved]),
                    knowledge_version=KNOWLEDGE_VERSION,
                )
            )
            if llm_result is not None:
                self._record_llm_invocation(
                    interview=interview,
                    turn_index=question.turn_index,
                    status="succeeded",
                    duration_ms=llm_result.duration_ms,
                    provider=llm_result.provider,
                    model=llm_result.model,
                    prompt_version=llm_result.prompt_version,
                    knowledge_version=llm_result.knowledge_version,
                )
            interview.status = InterviewStatus.ASKING
            self._save_question(interview, next_competency, next_question, action)
            interview.status = InterviewStatus.WAITING_FOR_ANSWER
        interview.version += 1
        self._update_memory(interview)
        self.session.commit()
        dto = self.session_dto(interview, user)
        dto["last_answer_assessment"] = {
            key: value
            for key, value in result.items()
            if key not in {"has_example", "has_tradeoff"}
        }
        dto["next_action"] = action
        dto["new_evidence"] = self.evidence_dto(evidence)
        return dto

    def complete(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        interview = self._interview(public_id, user)
        if interview.status == InterviewStatus.COMPLETED:
            return self.session_dto(interview, user)
        if interview.status != InterviewStatus.WAITING_FOR_ANSWER or interview.turn_count < 8:
            raise AppException(
                ErrorCode.INTERVIEW_INVALID_STATE,
                message="至少完成 8 轮回答后才能主动结束面试",
            )
        interview.status = InterviewStatus.COMPLETED
        interview.completed_at = utc_now()
        interview.version += 1
        self.session.commit()
        return self.session_dto(interview, user)

    def _update_memory(self, interview: InterviewSession) -> None:
        memory = self.session.scalar(
            select(InterviewMemory).where(InterviewMemory.session_id == interview.id)
        )
        assert memory is not None
        evidence = list(
            self.session.scalars(
                select(CompetencyEvidence).where(CompetencyEvidence.session_id == interview.id)
            )
        )
        memory.evidence_memory_json = _json(
            [
                {
                    "id": item.public_id,
                    "competency_id": item.competency_id,
                    "level": item.supported_level,
                    "strength": item.strength,
                }
                for item in evidence
            ]
        )
        if interview.turn_count and interview.turn_count % 4 == 0:
            messages = list(
                self.session.scalars(
                    select(InterviewMessage)
                    .where(
                        InterviewMessage.session_id == interview.id,
                        InterviewMessage.role == "user",
                    )
                    .order_by(InterviewMessage.turn_index.desc())
                    .limit(4)
                )
            )
            block = "；".join(
                f"{item.competency_id}:{item.content[:100]}" for item in reversed(messages)
            )
            memory.summary_memory = (memory.summary_memory + "\n" + block).strip()[-4000:]
            memory.last_compacted_turn = interview.turn_count
        memory.version += 1
        memory.updated_at = utc_now()

    def session_dto(self, interview: InterviewSession, user: AuthUser) -> dict[str, Any]:
        self._interview(interview.public_id, user)
        messages = list(
            self.session.scalars(
                select(InterviewMessage)
                .where(InterviewMessage.session_id == interview.id)
                .order_by(InterviewMessage.turn_index, InterviewMessage.created_at)
            )
        )
        current = next((item for item in reversed(messages) if item.role == "assistant"), None)
        return {
            "id": interview.public_id,
            "status": interview.status,
            "current_competency_id": interview.current_competency_id,
            "current_difficulty": interview.current_difficulty,
            "turn_count": interview.turn_count,
            "version": interview.version,
            "covered_competencies": _load(interview.covered_competencies_json),
            "messages": [
                {
                    "id": item.public_id,
                    "turn_index": item.turn_index,
                    "role": item.role,
                    "content": item.content,
                    "input_method": item.input_method,
                    "competency_id": item.competency_id,
                    "strategy": item.question_strategy,
                    "difficulty": item.difficulty,
                }
                for item in messages
            ],
            "current_question": current.public_id
            if current and interview.status == InterviewStatus.WAITING_FOR_ANSWER
            else None,
        }

    def list_interviews(self, user: AuthUser) -> list[dict[str, Any]]:
        rows = self.session.scalars(
            select(InterviewSession)
            .join(AssessmentCase, AssessmentCase.id == InterviewSession.assessment_id)
            .where(AssessmentCase.candidate_id == user.id)
            .order_by(InterviewSession.created_at.desc())
        )
        return [self.session_dto(row, user) for row in rows]

    def evidence(self, public_id: str, user: AuthUser) -> list[dict[str, Any]]:
        interview = self._interview(public_id, user)
        rows = self.session.scalars(
            select(CompetencyEvidence)
            .where(CompetencyEvidence.session_id == interview.id)
            .order_by(CompetencyEvidence.created_at)
        )
        return [self.evidence_dto(row) for row in rows]

    def evidence_dto(self, item: CompetencyEvidence) -> dict[str, Any]:
        return {
            "id": item.public_id,
            "competency_id": item.competency_id,
            "source": item.source,
            "question_id": item.question_id,
            "answer_id": item.answer_id,
            "signal": item.signal,
            "strength": item.strength,
            "polarity": item.polarity,
            "supported_level": item.supported_level,
            "verified": item.verified,
        }

    def memory(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        interview = self._interview(public_id, user)
        item = self.session.scalar(
            select(InterviewMemory).where(InterviewMemory.session_id == interview.id)
        )
        assert item is not None
        recent = list(
            self.session.scalars(
                select(InterviewMessage)
                .where(InterviewMessage.session_id == interview.id)
                .order_by(InterviewMessage.created_at.desc())
                .limit(6)
            )
        )
        return {
            "working_memory": [
                {"role": row.role, "content": row.content} for row in reversed(recent)
            ],
            "summary_memory": item.summary_memory,
            "evidence_memory": _load(item.evidence_memory_json),
            "last_compacted_turn": item.last_compacted_turn,
            "version": item.version,
        }

    def traces(self, public_id: str, user: AuthUser) -> list[dict[str, Any]]:
        interview = self._interview(public_id, user)
        rows = self.session.scalars(
            select(RetrievalTrace)
            .where(RetrievalTrace.session_id == interview.id)
            .order_by(RetrievalTrace.turn_index)
        )
        return [
            {
                "id": row.public_id,
                "turn_index": row.turn_index,
                "purpose": row.purpose,
                "query_summary": row.query_summary,
                "source_ids": _load(row.source_ids_json),
                "scores": _load(row.scores_json),
                "knowledge_version": row.knowledge_version,
            }
            for row in rows
        ]

    def generate_report(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        interview = self._interview(public_id, user)
        if interview.status != InterviewStatus.COMPLETED:
            raise AppException(ErrorCode.REPORT_INVALID_STATE, message="完成面试后才能生成报告")
        existing = self.session.scalar(
            select(AssessmentReport).where(AssessmentReport.session_id == interview.id)
        )
        if existing:
            return self.report_dto(existing, user)
        _, _, competencies = self._context(interview)
        evidence = list(
            self.session.scalars(
                select(CompetencyEvidence).where(CompetencyEvidence.session_id == interview.id)
            )
        )
        scores: list[dict[str, Any]] = []
        boundaries: list[dict[str, Any]] = []
        for competency in competencies:
            items = [item for item in evidence if item.competency_id == competency.competency_id]
            verified = [item for item in items if item.verified and item.polarity == "supports"]
            level = max((item.supported_level for item in verified), default=0)
            positive_sum = sum(item.strength for item in verified)
            confidence = min(1.0, positive_sum / 2)
            required_missing = max(0.0, 1 - len(verified) / 2)
            penalty = min(20.0, required_missing * 15)
            score = round(max(0, min(100, (level / 5 * 100) * (0.8 + 0.2 * confidence) - penalty)))
            refs = [item.public_id for item in items]
            scores.append(
                {
                    "id": competency.competency_id,
                    "name": competency.name,
                    "score": score,
                    "weight": competency.weight,
                    "evidence_ids": refs,
                }
            )
            boundaries.append(
                {
                    "competency_id": competency.competency_id,
                    "name": competency.name,
                    "level": level,
                    "confidence": round(confidence, 3),
                    "evidence_ids": refs,
                }
            )
        fit_score = round(sum(item["score"] * item["weight"] for item in scores))
        strengths = [
            {
                "competency": item["name"],
                "score": item["score"],
                "evidence_ids": item["evidence_ids"],
            }
            for item in sorted(scores, key=lambda row: row["score"], reverse=True)[:3]
            if item["evidence_ids"]
        ]
        gaps = [
            {
                "competency": item["name"],
                "score": item["score"],
                "evidence_ids": item["evidence_ids"],
                "reason": "当前证据不足以支持岗位要求的能力边界",
            }
            for item in sorted(scores, key=lambda row: row["score"])[:3]
        ]
        recommendations = [
            {
                "priority": f"P{index}",
                "competency": item["competency"],
                "gap": item["reason"],
                "why": "该维度的有效 Evidence 覆盖不足或边界偏低",
                "learn": f"补齐{item['competency']}的核心原理与典型工程模式",
                "practice": "完成一次带指标、故障定位和取舍复盘的专项练习",
                "validation_project": f"提交一个可运行的{item['competency']}项目并记录验证数据",
                "evidence_ids": item["evidence_ids"],
            }
            for index, item in enumerate(gaps)
        ]
        report = AssessmentReport(
            public_id=_public("report"),
            assessment_id=interview.assessment_id,
            session_id=interview.id,
            overall_score=fit_score,
            fit_score=fit_score,
            level="优秀" if fit_score >= 80 else "胜任" if fit_score >= 65 else "待提升",
            competency_scores_json=_json(scores),
            boundaries_json=_json(boundaries),
            strengths_json=_json(strengths),
            gaps_json=_json(gaps),
            recommendations_json=_json(recommendations),
            evidence_refs_json=_json([self.evidence_dto(item) for item in evidence]),
        )
        self.session.add(report)
        self.session.commit()
        return self.report_dto(report, user)

    def report_dto(self, report: AssessmentReport, user: AuthUser) -> dict[str, Any]:
        interview = self.session.get(InterviewSession, report.session_id)
        assert interview is not None
        self._interview(interview.public_id, user)
        assessment = self.session.get(AssessmentCase, report.assessment_id)
        assert assessment is not None
        job = self.session.get(JobCompetencyProfile, assessment.job_profile_id)
        assert job is not None
        return {
            "id": report.public_id,
            "interview_id": interview.public_id,
            "target_job": job.title,
            "overall_score": report.overall_score,
            "fit_score": report.fit_score,
            "level": report.level,
            "competency_scores": _load(report.competency_scores_json),
            "boundaries": _load(report.boundaries_json),
            "strengths": _load(report.strengths_json),
            "gaps": _load(report.gaps_json),
            "recommendations": _load(report.recommendations_json),
            "evidence_refs": _load(report.evidence_refs_json),
            "generated_at": report.generated_at.isoformat(),
        }

    def get_report(self, public_id: str, user: AuthUser) -> dict[str, Any]:
        report = self.session.scalar(
            select(AssessmentReport).where(AssessmentReport.public_id == public_id)
        )
        if report is None:
            raise AppException(ErrorCode.REPORT_NOT_FOUND)
        return self.report_dto(report, user)

    def list_reports(self, user: AuthUser) -> list[dict[str, Any]]:
        rows = self.session.scalars(
            select(AssessmentReport)
            .join(AssessmentCase, AssessmentCase.id == AssessmentReport.assessment_id)
            .where(AssessmentCase.candidate_id == user.id)
            .order_by(AssessmentReport.generated_at.desc())
        )
        return [self.report_dto(row, user) for row in rows]
