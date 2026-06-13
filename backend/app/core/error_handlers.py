from typing import Any
from uuid import UUID, uuid4

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.contracts.api import ErrorInfo, ErrorResponse, ResponseMeta
from app.contracts.errors import ERROR_DEFINITIONS, ErrorCode
from app.core.exceptions import AppException

logger = structlog.get_logger(__name__)


def request_id_from(request: Request) -> UUID:
    request_id = getattr(request.state, "request_id", None)
    return UUID(str(request_id)) if request_id is not None else uuid4()


def error_json_response(
    *,
    request: Request,
    code: ErrorCode,
    status_code: int,
    message: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    request.state.error_code = code.value
    response = ErrorResponse(
        error=ErrorInfo(code=code.value, message=message, details=details),
        meta=ResponseMeta(request_id=request_id_from(request)),
    )
    return JSONResponse(status_code=status_code, content=response.model_dump(mode="json"))


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return error_json_response(
        request=request,
        code=exc.code,
        status_code=exc.status_code,
        message=exc.public_message,
        details=exc.details,
    )


def _validation_reason(error: dict[str, Any]) -> str:
    error_type = str(error.get("type", "invalid"))
    context = error.get("ctx") or {}
    if error_type == "less_than_equal" and "le" in context:
        return f"must_be_less_than_or_equal_to_{context['le']}"
    if error_type == "greater_than_equal" and "ge" in context:
        return f"must_be_greater_than_or_equal_to_{context['ge']}"
    return error_type.replace(".", "_")


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    fields = []
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part not in {"body", "query", "path"}]
        fields.append({"field": ".".join(location), "reason": _validation_reason(error)})

    definition = ERROR_DEFINITIONS[ErrorCode.COMMON_VALIDATION_FAILED]
    return error_json_response(
        request=request,
        code=ErrorCode.COMMON_VALIDATION_FAILED,
        status_code=definition.status_code,
        message=definition.message,
        details={"fields": fields},
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    status_to_code = {
        401: ErrorCode.AUTH_UNAUTHORIZED,
        403: ErrorCode.AUTH_FORBIDDEN,
        429: ErrorCode.AUTH_RATE_LIMITED,
    }
    code = status_to_code.get(exc.status_code, ErrorCode.COMMON_BAD_REQUEST)
    definition = ERROR_DEFINITIONS[code]
    return error_json_response(
        request=request,
        code=code,
        status_code=definition.status_code,
        message=definition.message,
    )


async def unknown_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "request.unhandled_exception",
        module="core",
        error_code=ErrorCode.COMMON_INTERNAL_ERROR.value,
        exception_type=type(exc).__name__,
    )
    definition = ERROR_DEFINITIONS[ErrorCode.COMMON_INTERNAL_ERROR]
    return error_json_response(
        request=request,
        code=ErrorCode.COMMON_INTERNAL_ERROR,
        status_code=definition.status_code,
        message=definition.message,
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unknown_exception_handler)
