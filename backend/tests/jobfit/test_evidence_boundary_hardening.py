from __future__ import annotations

from json import dumps, loads
from pathlib import Path
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, func, inspect, select
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import get_settings
from app.modules.jobfit.evidence_hardening import (
    EVIDENCE_BOUNDARY_JUDGMENT_SCHEMA_VERSION,
    EVIDENCE_BOUNDARY_POLICY_VERSION,
    EvidenceBoundaryJudgmentPayload,
    EvidenceBoundaryPolicyError,
    build_evidence_boundary_judgment,
    select_effective_focus,
)
from app.modules.jobfit.llm import (
    SEMANTIC_JUDGMENT_PROMPT_VERSION,
    SemanticEvaluationRequest,
    SemanticJudgmentResponse,
    SemanticJudgmentResult,
)
from app.modules.jobfit.models import (
    AnswerAssessment,
    CompetencyEvidence,
    EvidenceBoundaryJudgment,
    InterviewMessage,
    InterviewSession,
    LLMInvocation,
    RAGReasoningTrace,
    SemanticJudgment,
)
from app.modules.jobfit.schemas import NextAction
from app.modules.jobfit.service import ADAPTIVE_FOCUS_LABELS


def _data(response: Any) -> dict[str, Any]:
    assert response.status_code == 200, response.text
    return response.json()["data"]  # type: ignore[no-any-return]


def _login(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": "candidate.demo@hirelink.local", "password": "HireLinkDemo2026!"},
    )
    assert response.status_code == 200


def _prepare_interview(client: TestClient) -> dict[str, Any]:
    _login(client)
    resume = _data(
        client.post(
            "/api/v1/resumes/upload",
            files={
                "file": (
                    "resume.txt",
                    "候选人 AI 算法工程师\n我负责 RAG 系统检索、重排与评估。\n",
                    "text/plain",
                )
            },
        )
    )
    candidate = _data(client.post("/api/v1/candidate-profiles", json={"resume_id": resume["id"]}))
    job = _data(
        client.post(
            "/api/v1/job-profiles",
            json={
                "job_role": "ai_engineer",
                "title": "AI 算法工程师",
                "jd_text": "负责 RAG、模型评估和 AI 工程交付",
                "difficulty": 2,
            },
        )
    )
    assessment = _data(
        client.post(
            "/api/v1/assessments",
            json={
                "resume_id": resume["id"],
                "candidate_profile_id": candidate["id"],
                "job_profile_id": job["id"],
            },
        )
    )
    interview = _data(
        client.post("/api/v1/interview-sessions", json={"assessment_id": assessment["id"]})
    )
    return _data(client.post(f"/api/v1/interview-sessions/{interview['id']}/start"))


def _payload(interview: dict[str, Any], answer: str, request_id: str) -> dict[str, Any]:
    return {
        "question_id": interview["current_question"],
        "answer": answer,
        "input_method": "text",
        "client_request_id": request_id,
        "expected_session_version": interview["version"],
    }


def _semantic_judgment(
    *, contradictions: list[dict[str, str]] | None = None
) -> SemanticJudgmentResponse:
    return SemanticJudgmentResponse.model_validate(
        {
            "summary": "受限语义摘要，不用于 P1-05 持久化。",
            "covered_dimensions": [],
            "missing_dimensions": [],
            "contradictions": contradictions or [],
            "confidence": 0.8,
        }
    )


class _FixedSemanticProvider:
    def __init__(self, judgment: SemanticJudgmentResponse) -> None:
        self.judgment = judgment

    def generate_semantic_judgment(
        self, request: SemanticEvaluationRequest
    ) -> SemanticJudgmentResult:
        del request
        return SemanticJudgmentResult(
            judgment=self.judgment,
            provider="mock",
            model="mock-semantic-v1",
            prompt_version=SEMANTIC_JUDGMENT_PROMPT_VERSION,
            duration_ms=0,
        )


def test_policy_maps_only_current_textual_demonstration_and_semantic_kinds() -> None:
    strong = build_evidence_boundary_judgment(
        answer="我负责设计检索服务，权衡延迟和成本，故障时会回退并复盘。",
        evidence_strength=0.65,
        semantic_judgment=_semantic_judgment(),
    )
    assert strong.model_dump() == {
        "evidence_strength_band": "sufficient",
        "ownership": "explicit",
        "contradiction": "none_detected",
        "contradiction_kinds": [],
        "competency_boundary": "demonstrated",
        "reason_codes": [],
    }

    weak = build_evidence_boundary_judgment(
        answer="团队做过相关项目。",
        evidence_strength=0.44,
        semantic_judgment=_semantic_judgment(
            contradictions=[{"kind": "scope_mismatch", "detail": "受限 detail 不得进入 P1-05"}]
        ),
    )
    assert weak.evidence_strength_band == "weak"
    assert weak.ownership == "not_demonstrated"
    assert weak.contradiction == "needs_clarification"
    assert weak.contradiction_kinds == ["scope_mismatch"]
    assert weak.competency_boundary == "not_demonstrated"
    assert weak.reason_codes == [
        "semantic_contradiction",
        "ownership_not_demonstrated",
        "evidence_below_sufficient",
        "boundary_not_demonstrated",
    ]

    negated_ownership = build_evidence_boundary_judgment(
        answer="我没有负责上线，只参与旁观。",
        evidence_strength=0.65,
        semantic_judgment=_semantic_judgment(),
    )
    assert negated_ownership.ownership == "not_demonstrated"


@pytest.mark.parametrize(
    "payload",
    [
        {
            "evidence_strength_band": "sufficient",
            "ownership": "explicit",
            "contradiction": "none_detected",
            "contradiction_kinds": ["claim_conflict"],
            "competency_boundary": "demonstrated",
            "reason_codes": [],
        },
        {
            "evidence_strength_band": "partial",
            "ownership": "not_demonstrated",
            "contradiction": "none_detected",
            "contradiction_kinds": [],
            "competency_boundary": "not_demonstrated",
            "reason_codes": ["ownership_not_demonstrated"],
            "candidate_answer": "must be rejected",
        },
    ],
)
def test_hardening_payload_rejects_inconsistent_or_extra_fields(payload: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        EvidenceBoundaryJudgmentPayload.model_validate(payload)


def test_policy_applies_only_same_competency_and_keeps_existing_focus_enums() -> None:
    judgment = build_evidence_boundary_judgment(
        answer="团队负责相关项目。",
        evidence_strength=0.5,
        semantic_judgment=_semantic_judgment(),
    )
    same = select_effective_focus(
        judgment=judgment,
        base_focus="tradeoff",
        applies_to_same_competency=True,
    )
    assert same.base_focus == "tradeoff"
    assert same.effective_focus == "personal_action"
    assert same.applied is True

    switched = select_effective_focus(
        judgment=judgment,
        base_focus="tradeoff",
        applies_to_same_competency=False,
    )
    assert switched.base_focus == switched.effective_focus == "tradeoff"
    assert switched.applied is False

    ended = select_effective_focus(
        judgment=judgment,
        base_focus=None,
        applies_to_same_competency=True,
    )
    assert ended.base_focus is ended.effective_focus is None
    assert ended.applied is False


def test_private_hardening_persists_and_only_changes_same_action_focus(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.modules.jobfit.service.semantic_provider_for",
        lambda settings: _FixedSemanticProvider(_semantic_judgment()),
    )
    interview = _prepare_interview(client)
    answer = "团队负责过相关项目，具体指标还需要确认。"
    updated = _data(
        client.post(
            f"/api/v1/interview-sessions/{interview['id']}/answers",
            json=_payload(interview, answer, "hardening-private-request"),
        )
    )

    assert updated["next_action"] == "SCENARIO"
    assert updated["current_competency_id"] == "technical_foundation"
    assert ADAPTIVE_FOCUS_LABELS["personal_action"] in updated["messages"][-1]["content"]
    assert answer not in updated["messages"][-1]["content"]
    assert "evidence_boundary_judgment" not in updated
    assert set(updated["new_evidence"]) == {
        "id",
        "competency_id",
        "source",
        "question_id",
        "answer_id",
        "signal",
        "strength",
        "polarity",
        "supported_level",
        "verified",
    }

    db_session.expire_all()
    record = db_session.scalar(select(EvidenceBoundaryJudgment))
    evidence = db_session.scalar(select(CompetencyEvidence))
    semantic = db_session.scalar(select(SemanticJudgment))
    assessment = db_session.scalar(select(AnswerAssessment))
    rag_trace = db_session.scalar(select(RAGReasoningTrace))
    assert record is not None
    assert evidence is not None
    assert semantic is not None
    assert assessment is not None
    assert rag_trace is not None
    assert record.answer_id == evidence.answer_id == semantic.answer_id == assessment.answer_id
    assert record.competency_evidence_id == evidence.id
    assert record.semantic_judgment_id == semantic.id
    assert record.schema_version == EVIDENCE_BOUNDARY_JUDGMENT_SCHEMA_VERSION
    assert record.policy_version == EVIDENCE_BOUNDARY_POLICY_VERSION
    assert record.base_focus == "tradeoff"
    assert record.effective_focus == rag_trace.focus == "personal_action"
    assert record.applied is True
    persisted_payload = loads(record.judgment_json)
    assert persisted_payload["ownership"] == "not_demonstrated"
    assert persisted_payload["reason_codes"]
    assert answer not in dumps(persisted_payload, ensure_ascii=False)
    assert {"summary", "detail", "signal", "prompt", "response", "api_key"}.isdisjoint(
        persisted_payload
    )
    assert {column.name for column in EvidenceBoundaryJudgment.__table__.columns}.isdisjoint(
        {"candidate_answer", "summary", "detail", "signal", "prompt", "response", "api_key"}
    )


def test_ending_answer_persists_not_applied_hardening(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.modules.jobfit.service.JobFitService._decide",
        lambda self, interview, assessment, competency_turns, competencies: (
            NextAction.END_INTERVIEW
        ),
    )
    interview = _prepare_interview(client)
    updated = _data(
        client.post(
            f"/api/v1/interview-sessions/{interview['id']}/answers",
            json=_payload(interview, "团队完成过项目。", "hardening-end-request"),
        )
    )

    assert updated["status"] == "COMPLETED"
    assert updated["next_action"] == "END_INTERVIEW"
    db_session.expire_all()
    record = db_session.scalar(select(EvidenceBoundaryJudgment))
    assert record is not None
    assert record.base_focus is None
    assert record.effective_focus is None
    assert record.applied is False


def test_duplicate_and_stale_requests_do_not_repeat_hardening(
    client: TestClient,
    db_session: Session,
) -> None:
    interview = _prepare_interview(client)
    answer_url = f"/api/v1/interview-sessions/{interview['id']}/answers"
    payload = _payload(interview, "团队负责相关项目。", "hardening-duplicate-request")
    first = _data(client.post(answer_url, json=payload))
    duplicate = _data(client.post(answer_url, json=payload))
    stale = client.post(
        answer_url,
        json={
            **payload,
            "client_request_id": "hardening-stale-request",
            "expected_session_version": duplicate["version"],
        },
    )

    assert duplicate["version"] == first["version"]
    assert stale.status_code == 409
    db_session.expire_all()
    assert db_session.scalar(select(func.count(EvidenceBoundaryJudgment.id))) == 1
    assert db_session.scalar(select(func.count(RAGReasoningTrace.id))) == 1


def test_hardening_policy_failure_rolls_back_current_turn(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    interview = _prepare_interview(client)

    def fail_policy(**kwargs: Any) -> EvidenceBoundaryJudgmentPayload:
        del kwargs
        raise EvidenceBoundaryPolicyError("safe local policy failure")

    monkeypatch.setattr("app.modules.jobfit.service.build_evidence_boundary_judgment", fail_policy)
    response = client.post(
        f"/api/v1/interview-sessions/{interview['id']}/answers",
        json=_payload(interview, "团队负责相关项目。", "hardening-failure-request"),
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == ErrorCode.AI_INVALID_OUTPUT.value
    db_session.expire_all()
    session = db_session.scalar(
        select(InterviewSession).where(InterviewSession.public_id == interview["id"])
    )
    assert session is not None
    assert session.status == "WAITING_FOR_ANSWER"
    assert session.version == interview["version"]
    assert (
        db_session.scalar(
            select(func.count(InterviewMessage.id)).where(InterviewMessage.session_id == session.id)
        )
        == 1
    )
    assert (
        db_session.scalar(
            select(func.count(AnswerAssessment.id)).where(AnswerAssessment.session_id == session.id)
        )
        == 0
    )
    assert (
        db_session.scalar(
            select(func.count(CompetencyEvidence.id)).where(
                CompetencyEvidence.session_id == session.id
            )
        )
        == 0
    )
    assert (
        db_session.scalar(
            select(func.count(SemanticJudgment.id)).where(SemanticJudgment.session_id == session.id)
        )
        == 0
    )
    assert (
        db_session.scalar(
            select(func.count(EvidenceBoundaryJudgment.id)).where(
                EvidenceBoundaryJudgment.session_id == session.id
            )
        )
        == 0
    )
    invocation = db_session.scalar(select(LLMInvocation))
    assert invocation is not None
    assert invocation.status == "failed"
    assert invocation.error_code == ErrorCode.AI_INVALID_OUTPUT.value


def test_evidence_boundary_migration_upgrades_and_downgrades(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    backend_root = Path(__file__).resolve().parents[2]
    database_path = tmp_path / "evidence-boundary-migration.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "migrations"))
    monkeypatch.setenv("JOBFIT_DATABASE_URL", database_url)
    get_settings.cache_clear()
    engine = create_engine(database_url)

    try:
        command.upgrade(config, "20260909_0008")
        assert "evidence_boundary_judgments" not in inspect(engine).get_table_names()

        command.upgrade(config, "20260909_0009")
        inspector = inspect(engine)
        assert {
            "id",
            "session_id",
            "question_id",
            "answer_id",
            "competency_id",
            "competency_evidence_id",
            "semantic_judgment_id",
            "schema_version",
            "policy_version",
            "base_focus",
            "effective_focus",
            "applied",
            "judgment_json",
            "created_at",
        }.issubset(
            {column["name"] for column in inspector.get_columns("evidence_boundary_judgments")}
        )
        assert {
            ("answer_id",),
            ("competency_evidence_id",),
            ("semantic_judgment_id",),
        }.issubset(
            {
                tuple(constraint["column_names"])
                for constraint in inspector.get_unique_constraints("evidence_boundary_judgments")
            }
        )
        assert {
            ("session_id", "interview_sessions", "CASCADE"),
            ("competency_evidence_id", "competency_evidence", None),
            ("semantic_judgment_id", "semantic_judgments", "CASCADE"),
        }.issubset(
            {
                (
                    foreign_key["constrained_columns"][0],
                    foreign_key["referred_table"],
                    foreign_key.get("options", {}).get("ondelete"),
                )
                for foreign_key in inspector.get_foreign_keys("evidence_boundary_judgments")
            }
        )
        assert {"ix_evidence_boundary_judgments_session_id": ("session_id",)}.items() <= {
            index["name"]: tuple(index["column_names"])
            for index in inspector.get_indexes("evidence_boundary_judgments")
        }.items()

        command.downgrade(config, "20260909_0008")
        tables_after_downgrade = set(inspect(engine).get_table_names())
        assert "evidence_boundary_judgments" not in tables_after_downgrade
        assert "rag_reasoning_traces" in tables_after_downgrade
        assert "semantic_judgments" in tables_after_downgrade
    finally:
        engine.dispose()
        get_settings.cache_clear()
