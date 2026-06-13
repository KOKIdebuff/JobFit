from enum import StrEnum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AIOperationContext(BaseModel):
    actor_id: UUID
    resource_type: str
    resource_id: UUID


class StructuredGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    operation: str
    schema_version: str
    prompt_version: str
    input_data: dict[str, Any] = Field(alias="input")
    context: AIOperationContext


class StructuredGenerationResult(BaseModel):
    status: Literal["pending", "running", "completed", "failed"]
    data: dict[str, Any]
    provider: str
    model: str
    prompt_version: str
    schema_version: str
    duration_ms: int
    fallback_source: str | None = None


class AIErrorCategory(StrEnum):
    TIMEOUT = "timeout"
    UNAVAILABLE = "unavailable"
    PROVIDER_ERROR = "provider_error"
    INVALID_OUTPUT = "invalid_output"
    CONTENT_REJECTED = "content_rejected"
    CONFIGURATION_ERROR = "configuration_error"
