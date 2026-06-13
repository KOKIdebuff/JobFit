from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer

from app.contracts.pagination import PaginationMeta
from app.core.time import to_utc_z, utc_now


class ResponseMeta(BaseModel):
    request_id: UUID
    timestamp: datetime = Field(default_factory=utc_now)
    pagination: PaginationMeta | None = None

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> str:
        return to_utc_z(value)


class SuccessResponse[T](BaseModel):
    success: Literal[True] = True
    data: T
    meta: ResponseMeta


class ErrorInfo(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    success: Literal[False] = False
    error: ErrorInfo
    meta: ResponseMeta


def success_response[T](
    data: T,
    *,
    request_id: UUID,
    pagination: PaginationMeta | None = None,
) -> SuccessResponse[T]:
    return SuccessResponse(
        data=data,
        meta=ResponseMeta(request_id=request_id, pagination=pagination),
    )
