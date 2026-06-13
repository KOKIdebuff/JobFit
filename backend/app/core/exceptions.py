from typing import Any

from app.contracts.errors import ERROR_DEFINITIONS, ErrorCode


class AppException(Exception):
    def __init__(
        self,
        code: ErrorCode,
        *,
        message: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        definition = ERROR_DEFINITIONS[code]
        self.code = code
        self.status_code = definition.status_code
        self.public_message = message or definition.message
        self.details = details
        super().__init__(self.public_message)
