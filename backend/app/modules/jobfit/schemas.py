from __future__ import annotations

from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class InterviewStatus(StrEnum):
    PREPARING = "PREPARING"
    ASKING = "ASKING"
    WAITING_FOR_ANSWER = "WAITING_FOR_ANSWER"
    EVALUATING = "EVALUATING"
    DECIDING = "DECIDING"
    COMPLETED = "COMPLETED"
    REPORT_GENERATION = "REPORT_GENERATION"
    FAILED = "FAILED"


class NextAction(StrEnum):
    FOLLOW_UP = "FOLLOW_UP"
    CHALLENGE = "CHALLENGE"
    REQUEST_EXAMPLE = "REQUEST_EXAMPLE"
    SCENARIO = "SCENARIO"
    INCREASE_DIFFICULTY = "INCREASE_DIFFICULTY"
    DECREASE_DIFFICULTY = "DECREASE_DIFFICULTY"
    CLARIFY = "CLARIFY"
    NEXT_COMPETENCY = "NEXT_COMPETENCY"
    END_INTERVIEW = "END_INTERVIEW"


class CandidateProfileCreate(BaseModel):
    resume_id: str


class JobProfileCreate(BaseModel):
    job_role: Literal["ai_engineer", "java_engineer", "product_manager"]
    title: str = Field(min_length=2, max_length=160)
    jd_text: str = Field(default="", max_length=30_000)
    difficulty: int = Field(default=2, ge=1, le=5)


class AssessmentCreate(BaseModel):
    resume_id: str
    candidate_profile_id: str
    job_profile_id: str


class InterviewSessionCreate(BaseModel):
    assessment_id: str


class AnswerCreate(BaseModel):
    question_id: str = Field(min_length=3, max_length=120)
    answer: str = Field(min_length=1, max_length=12_000)
    input_method: Literal["text", "speech_to_text"] = "text"
    client_request_id: str = Field(min_length=8, max_length=80)
    expected_session_version: int = Field(ge=0)

    @field_validator("answer")
    @classmethod
    def normalize_answer(cls, value: str) -> str:
        return value.strip()


class CompetencyItem(BaseModel):
    id: str
    name: str
    description: str
    weight: float = Field(gt=0, le=1)
    rubric: dict[str, str]
    question_strategy: list[str]
    evidence_requirements: list[str]


class CompetencyProfile(BaseModel):
    id: str
    name: str
    version: str
    competencies: list[CompetencyItem]

    @model_validator(mode="after")
    def validate_weights(self) -> CompetencyProfile:
        if abs(sum(item.weight for item in self.competencies) - 1.0) > 0.001:
            raise ValueError("competency weights must total 1.0")
        return self


class JobFitEnvelope(BaseModel):
    data: dict[str, Any]
