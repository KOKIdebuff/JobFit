from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

AiRunStatus = Literal["pending", "running", "completed", "failed"]


class AiRunDto(BaseModel):
    id: UUID
    public_id: str
    application_id: UUID | None
    application_public_id: str | None = None
    operation: str
    status: AiRunStatus
    provider: str
    model: str
    prompt_version: str
    schema_version: str
    duration_ms: int
    started_at: datetime
    completed_at: datetime | None
    fallback_source: str | None
    error_code: str | None
    input_summary: dict[str, Any]
    output_summary: dict[str, Any]
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class AiRunListResponse(BaseModel):
    runs: list[AiRunDto]
