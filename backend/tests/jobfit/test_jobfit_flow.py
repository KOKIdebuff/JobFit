from typing import Any

from fastapi.testclient import TestClient


def _login(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": "candidate.demo@hirelink.local", "password": "HireLinkDemo2026!"},
    )
    assert response.status_code == 200


def _data(response: Any) -> dict[str, Any]:
    assert response.status_code == 200, response.text
    return response.json()["data"]  # type: ignore[no-any-return]


def test_competency_profiles_have_valid_weights(client: TestClient) -> None:
    _login(client)
    profiles = _data(client.get("/api/v1/competency-profiles"))["profiles"]
    assert {item["id"] for item in profiles} == {
        "ai_engineer",
        "java_engineer",
        "product_manager",
    }
    for profile in profiles:
        assert abs(sum(item["weight"] for item in profile["competencies"]) - 1.0) < 0.001
        assert all(
            set(item["rubric"]) == {"L0", "L1", "L2", "L3", "L4", "L5"}
            for item in profile["competencies"]
        )


def test_adaptive_interview_persists_evidence_memory_rag_and_report(
    client: TestClient,
) -> None:
    _login(client)
    resume_text = (
        "张同学 AI 算法工程师\n某大学计算机科学本科\n"
        "我负责 RAG 知识库项目，使用 Python 和 LangChain，完成检索、重排和评估。\n"
        "项目上线后持续分析召回率、延迟和错误样本。"
    )
    resume = _data(
        client.post(
            "/api/v1/resumes/upload",
            files={"file": ("resume.txt", resume_text.encode(), "text/plain")},
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
    interview = _data(client.post(f"/api/v1/interview-sessions/{interview['id']}/start"))
    session_id = interview["id"]
    actions: list[str] = []
    for index in range(12):
        answer = (
            f"第 {index + 1} 轮我负责这个真实项目的设计和实现。"
            "我先用分层指标定位检索、重排与生成阶段，再基于错误样本验证假设；"
            "随后权衡召回率、延迟、成本和一致性，灰度上线后延迟降低 25%，"
            "召回率提升 12%。如果指标回退，我会停止发布并复盘边界。"
        )
        interview = _data(
            client.post(
                f"/api/v1/interview-sessions/{session_id}/answers",
                json={
                    "question_id": interview["current_question"],
                    "answer": answer,
                    "input_method": "speech_to_text" if index == 1 else "text",
                    "client_request_id": f"request-{index:04d}",
                    "expected_session_version": interview["version"],
                },
            )
        )
        actions.append(interview["next_action"])
        if interview["status"] == "COMPLETED":
            break

    assert interview["status"] == "COMPLETED"
    assert interview["turn_count"] >= 8
    assert actions.count("INCREASE_DIFFICULTY") >= 1
    assert any(action in {"SCENARIO", "NEXT_COMPETENCY"} for action in actions)

    restored = _data(client.get(f"/api/v1/interview-sessions/{session_id}"))
    assert restored["turn_count"] == interview["turn_count"]
    assert any(
        message["role"] == "user" and message["input_method"] == "speech_to_text"
        for message in restored["messages"]
    )
    evidence = _data(client.get(f"/api/v1/interview-sessions/{session_id}/evidence"))
    assert len(evidence["evidence"]) == interview["turn_count"]
    assert max(item["supported_level"] for item in evidence["evidence"]) >= 3
    memory = _data(client.get(f"/api/v1/interview-sessions/{session_id}/memory"))
    assert memory["summary_memory"]
    assert memory["evidence_memory"]
    traces = _data(client.get(f"/api/v1/interview-sessions/{session_id}/retrieval-traces"))
    assert traces["traces"]
    assert all(item["source_ids"] for item in traces["traces"])

    report = _data(client.post(f"/api/v1/interview-sessions/{session_id}/report"))
    expected = round(sum(item["score"] * item["weight"] for item in report["competency_scores"]))
    assert report["fit_score"] == expected
    assert all("evidence_ids" in item for item in report["competency_scores"])
    assert all(item["priority"] in {"P0", "P1", "P2"} for item in report["recommendations"])


def test_production_rejects_default_secret() -> None:
    from pydantic import ValidationError

    from app.core.config import Settings

    try:
        Settings(environment="production")
    except ValidationError:
        pass
    else:
        raise AssertionError("production must reject the development JWT secret")
