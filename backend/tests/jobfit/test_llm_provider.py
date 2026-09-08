from __future__ import annotations

import json
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import Settings
from app.modules.jobfit import llm
from app.modules.jobfit.llm import (
    TRUNCATION_MARKER,
    FollowUpRequest,
    LLMQuestionError,
    LLMQuestionResult,
)
from app.modules.jobfit.models import AnswerAssessment, InterviewSession, LLMInvocation
from app.modules.jobfit.retrieval import KNOWLEDGE_VERSION
from app.modules.jobfit.schemas import NextAction


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
                    "候选人 AI 算法工程师\n我负责 RAG 系统的检索、重排、评估和上线监控。\n",
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


def _strong_answer() -> str:
    return (
        "我负责 RAG 服务的检索、重排和生成链路设计。先通过 Recall@20、延迟和错误样本定位问题，"
        "再权衡召回率、成本和 P95 延迟，使用灰度发布验证方案；上线后召回率提升 12%，延迟降低 25%。"
    )


def _answer_payload(
    interview: dict[str, Any], request_id: str = "llm-request-0001"
) -> dict[str, Any]:
    return {
        "question_id": interview["current_question"],
        "answer": _strong_answer(),
        "input_method": "text",
        "client_request_id": request_id,
        "expected_session_version": interview["version"],
    }


def _openai_settings(**overrides: Any) -> Settings:
    values: dict[str, Any] = {
        "environment": "test",
        "llm_provider": "openai_compatible",
        "llm_base_url": "https://provider.example.test/v1",
        "llm_api_key": "unit-test-key",
        "llm_model": "unit-test-model",
    }
    values.update(overrides)
    return Settings(**values)


def _follow_up_request(template_question: str = "请说明你的取舍依据？") -> FollowUpRequest:
    return FollowUpRequest(
        job_title="AI 算法工程师",
        competency_name="AI / LLM 知识",
        competency_description="模型、RAG、评估与应用边界",
        action=NextAction.SCENARIO,
        previous_answer="候选人回答",
        difficulty=3,
        retrieval_chunks=[],
        knowledge_version=KNOWLEDGE_VERSION,
        summary_memory="",
        evidence_memory=[],
        template_question=template_question,
    )


@pytest.mark.parametrize(
    "base_url",
    [
        "ftp://provider.example.test",
        "https://user:pass@provider.example.test/v1",
        "https://provider.example.test/v1?api_key=no",
        "https://provider.example.test/v1#fragment",
    ],
)
def test_openai_provider_rejects_unsafe_base_url(base_url: str) -> None:
    with pytest.raises(ValidationError):
        _openai_settings(llm_base_url=base_url)


def test_openai_provider_requires_https_in_production() -> None:
    with pytest.raises(ValidationError):
        _openai_settings(
            environment="production",
            jwt_secret="a-secure-production-secret-with-more-than-32-bytes",
            llm_base_url="http://provider.example.test/v1",
        )


def test_deterministic_provider_returns_the_existing_template_without_network() -> None:
    result = llm.provider_for(Settings()).generate_follow_up(_follow_up_request())

    assert result.question == "请说明你的取舍依据？"
    assert result.provider == "deterministic"
    assert result.model == "deterministic-template-v1"
    assert result.knowledge_version == KNOWLEDGE_VERSION


def test_openai_provider_sends_bounded_untrusted_rag_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, Any] = {}
    real_client = httpx.Client

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["authorization"] = request.headers["authorization"]
        captured["body"] = json.loads(request.content)
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"question":"请说明你的取舍依据？"}'}}]},
        )

    def client_factory(*args: Any, **kwargs: Any) -> httpx.Client:
        captured["client_kwargs"] = kwargs
        return real_client(transport=httpx.MockTransport(handler), **kwargs)

    monkeypatch.setattr("app.modules.jobfit.llm.httpx.Client", client_factory)
    result = llm.generate_interview_question(
        _openai_settings(),
        job_title="AI 算法工程师",
        competency_name="AI / LLM 知识",
        competency_description="模型、RAG、评估与应用边界",
        action=NextAction.SCENARIO,
        previous_answer="a" * 1200 + "not-in-prompt",
        difficulty=3,
        retrieval_chunks=[
            {
                "source_id": "jobfit-kb-2026.09.v1:ai_engineer:ai_llm_knowledge",
                "score": 3.2,
                "text": "retrieval evidence " + "k" * 1_000,
            }
        ],
        knowledge_version=KNOWLEDGE_VERSION,
        summary_memory="s" * 1200 + "not-in-prompt",
        evidence_memory=[{"level": 3, "strength": 0.7}],
    )

    assert result.question == "请说明你的取舍依据？"
    assert result.knowledge_version == KNOWLEDGE_VERSION
    assert captured["url"] == "https://provider.example.test/v1/chat/completions"
    assert captured["authorization"] == "Bearer unit-test-key"
    assert captured["client_kwargs"]["follow_redirects"] is False
    prompt = captured["body"]["messages"]
    assert "不可信 data" in prompt[0]["content"]
    context = json.loads(prompt[1]["content"])
    assert context["knowledge_version"] == KNOWLEDGE_VERSION
    assert context["retrieved_knowledge"][0]["source_id"].endswith("ai_llm_knowledge")
    assert context["retrieved_knowledge"][0]["text"].startswith("retrieval evidence ")
    assert len(context["retrieved_knowledge"][0]["text"]) == 800
    assert context["retrieved_knowledge"][0]["text"].endswith(TRUNCATION_MARKER)
    assert context["previous_answer"].endswith(TRUNCATION_MARKER)
    assert len(context["previous_answer"]) == 1200
    assert "not-in-prompt" not in context["previous_answer"]
    assert context["summary_memory"].startswith(TRUNCATION_MARKER)
    assert len(context["summary_memory"]) == 1200
    assert context["summary_memory"].endswith("not-in-prompt")


@pytest.mark.parametrize(
    "content",
    [
        "not-json",
        '{"question":"有效问题？","extra":"not-allowed"}',
        '{"question":"   "}',
        '{"question":"问题一？问题二？"}',
        '{"question":"```markdown\n问题？\n```"}',
    ],
)
def test_openai_provider_rejects_invalid_structured_output(
    monkeypatch: pytest.MonkeyPatch,
    content: str,
) -> None:
    real_client = httpx.Client

    def handler(request: httpx.Request) -> httpx.Response:
        del request
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})

    def client_factory(*args: Any, **kwargs: Any) -> httpx.Client:
        return real_client(transport=httpx.MockTransport(handler), **kwargs)

    monkeypatch.setattr("app.modules.jobfit.llm.httpx.Client", client_factory)
    with pytest.raises(LLMQuestionError) as raised:
        llm.generate_interview_question(
            _openai_settings(),
            job_title="AI 算法工程师",
            competency_name="工程能力",
            competency_description="工程交付",
            action=NextAction.SCENARIO,
            previous_answer="回答",
            difficulty=2,
            retrieval_chunks=[],
            knowledge_version=KNOWLEDGE_VERSION,
            summary_memory="",
            evidence_memory=[],
        )
    assert raised.value.code == ErrorCode.AI_INVALID_OUTPUT


@pytest.mark.parametrize(
    ("exception", "expected_code"),
    [
        (httpx.ReadTimeout("timeout"), ErrorCode.AI_TIMEOUT),
        (httpx.ConnectError("offline"), ErrorCode.AI_PROVIDER_ERROR),
    ],
)
def test_openai_provider_maps_transport_failures(
    monkeypatch: pytest.MonkeyPatch,
    exception: httpx.RequestError,
    expected_code: ErrorCode,
) -> None:
    class FailingClient:
        def __init__(self, **kwargs: Any) -> None:
            del kwargs

        def __enter__(self) -> FailingClient:
            return self

        def __exit__(self, *args: Any) -> None:
            return None

        def post(self, *args: Any, **kwargs: Any) -> httpx.Response:
            del args, kwargs
            raise exception

    monkeypatch.setattr("app.modules.jobfit.llm.httpx.Client", FailingClient)
    with pytest.raises(LLMQuestionError) as raised:
        llm.generate_interview_question(
            _openai_settings(),
            job_title="AI 算法工程师",
            competency_name="工程能力",
            competency_description="工程交付",
            action=NextAction.SCENARIO,
            previous_answer="回答",
            difficulty=2,
            retrieval_chunks=[],
            knowledge_version=KNOWLEDGE_VERSION,
            summary_memory="",
            evidence_memory=[],
        )
    assert raised.value.code == expected_code


def test_openai_follow_up_uses_rag_and_records_only_non_sensitive_audit(
    client: TestClient,
    db_session: Session,
    test_settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    test_settings.llm_provider = "openai_compatible"
    test_settings.llm_base_url = "https://provider.example.test/v1"
    test_settings.llm_api_key = "unit-test-key"
    test_settings.llm_model = "unit-test-model"
    captured: dict[str, Any] = {}

    class FakeProvider:
        def generate_follow_up(self, request: FollowUpRequest) -> LLMQuestionResult:
            captured["request"] = request
            return LLMQuestionResult(
                question="请解释你如何验证重排阶段的收益？",
                provider="openai_compatible",
                model=test_settings.llm_model,
                prompt_version=llm.PROMPT_VERSION,
                knowledge_version=request.knowledge_version,
                duration_ms=7,
            )

    def fake_provider_for(settings: Settings) -> FakeProvider:
        assert settings is test_settings
        return FakeProvider()

    monkeypatch.setattr("app.modules.jobfit.service.provider_for", fake_provider_for)
    interview = _prepare_interview(client)
    payload = _answer_payload(interview)

    response = client.post(f"/api/v1/interview-sessions/{interview['id']}/answers", json=payload)
    updated = _data(response)
    duplicate = _data(
        client.post(f"/api/v1/interview-sessions/{interview['id']}/answers", json=payload)
    )

    assert updated["messages"][-1]["content"] == "请解释你如何验证重排阶段的收益？"
    assert duplicate["version"] == updated["version"]
    request = captured["request"]
    assert request.knowledge_version == KNOWLEDGE_VERSION
    assert request.retrieval_chunks
    assert request.retrieval_chunks[0]["source_id"].startswith(KNOWLEDGE_VERSION)
    assert request.action == updated["next_action"]
    traces = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}/retrieval-traces"))
    assert traces["traces"][0]["knowledge_version"] == KNOWLEDGE_VERSION

    db_session.expire_all()
    invocations = list(db_session.scalars(select(LLMInvocation)))
    assert len(invocations) == 1
    invocation = invocations[0]
    assert invocation.status == "succeeded"
    assert invocation.provider == "openai_compatible"
    assert invocation.model == "unit-test-model"
    assert invocation.knowledge_version == KNOWLEDGE_VERSION
    assert invocation.turn_index == 1
    assert invocation.error_code is None
    assert invocation.duration_ms == 7
    assert invocation.purpose == "follow_up_from_answer"
    assert {column.name for column in LLMInvocation.__table__.columns}.isdisjoint(
        {"prompt", "prompt_hash", "response", "response_hash", "authorization", "api_key"}
    )


@pytest.mark.parametrize(
    "error_code",
    [ErrorCode.AI_TIMEOUT, ErrorCode.AI_PROVIDER_ERROR, ErrorCode.AI_INVALID_OUTPUT],
)
def test_provider_failure_is_fail_closed_and_audited(
    client: TestClient,
    db_session: Session,
    test_settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
    error_code: ErrorCode,
) -> None:
    test_settings.llm_provider = "openai_compatible"
    test_settings.llm_base_url = "https://provider.example.test/v1"
    test_settings.llm_api_key = "unit-test-key"
    test_settings.llm_model = "unit-test-model"

    class FailingProvider:
        def generate_follow_up(self, request: FollowUpRequest) -> LLMQuestionResult:
            del request
            raise LLMQuestionError(error_code, "safe provider failure", duration_ms=11)

    def failing_provider_for(settings: Settings) -> FailingProvider:
        assert settings is test_settings
        return FailingProvider()

    monkeypatch.setattr("app.modules.jobfit.service.provider_for", failing_provider_for)
    interview = _prepare_interview(client)
    before = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}"))
    before_memory = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}/memory"))
    before_evidence = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}/evidence"))
    trace_url = f"/api/v1/interview-sessions/{interview['id']}/retrieval-traces"
    before_traces = _data(client.get(trace_url))

    response = client.post(
        f"/api/v1/interview-sessions/{interview['id']}/answers",
        json=_answer_payload(interview),
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == error_code.value
    after = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}"))
    after_memory = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}/memory"))
    after_evidence = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}/evidence"))
    after_traces = _data(client.get(trace_url))
    assert after["status"] == before["status"] == "WAITING_FOR_ANSWER"
    assert after["version"] == before["version"]
    assert after["turn_count"] == before["turn_count"]
    assert len(after["messages"]) == len(before["messages"])
    assert after_memory == before_memory
    assert after_evidence == before_evidence
    assert after_traces == before_traces

    db_session.expire_all()
    session = db_session.scalar(
        select(InterviewSession).where(InterviewSession.public_id == interview["id"])
    )
    assert session is not None
    assert db_session.scalar(
        select(func.count(AnswerAssessment.id)).where(AnswerAssessment.session_id == session.id)
    ) == 0
    invocations = list(db_session.scalars(select(LLMInvocation)))
    assert len(invocations) == 1
    assert invocations[0].status == "failed"
    assert invocations[0].error_code == error_code.value
    assert invocations[0].knowledge_version == KNOWLEDGE_VERSION
    assert invocations[0].turn_index == 1
    assert invocations[0].purpose == "follow_up_from_answer"


def test_stale_question_is_rejected_without_new_persistent_turn(client: TestClient) -> None:
    interview = _prepare_interview(client)
    first_question = interview["current_question"]
    first = _data(
        client.post(
            f"/api/v1/interview-sessions/{interview['id']}/answers",
            json=_answer_payload(interview, "stale-first-request"),
        )
    )
    before = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}"))
    response = client.post(
        f"/api/v1/interview-sessions/{interview['id']}/answers",
        json={
            "question_id": first_question,
            "answer": _strong_answer(),
            "input_method": "text",
            "client_request_id": "stale-second-request",
            "expected_session_version": first["version"],
        },
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == ErrorCode.INTERVIEW_CONFLICT.value
    after = _data(client.get(f"/api/v1/interview-sessions/{interview['id']}"))
    assert len(after["messages"]) == len(before["messages"])
    assert after["version"] == before["version"]
