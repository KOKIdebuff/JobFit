from time import perf_counter
from uuid import UUID, uuid4

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.logging import get_logger


def valid_request_id(value: str | None) -> UUID | None:
    if value is None:
        return None
    try:
        parsed = UUID(value)
    except ValueError:
        return None
    if parsed.version != 4 or value != str(parsed):
        return None
    return parsed


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = valid_request_id(request.headers.get("X-Request-ID")) or uuid4()
        request.state.request_id = request_id
        request.state.error_code = None
        started_at = perf_counter()

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=str(request_id),
            user_id=None,
        )

        try:
            response = await call_next(request)
            duration_ms = round((perf_counter() - started_at) * 1_000, 3)
            get_logger("http").info(
                "request.completed",
                duration_ms=duration_ms,
                error_code=request.state.error_code,
                http_method=request.method,
                http_path=request.url.path,
                http_status=response.status_code,
            )
            response.headers["X-Request-ID"] = str(request_id)
            return response
        finally:
            structlog.contextvars.clear_contextvars()
