import logging
import sys
from typing import Any
from uuid import uuid4

import structlog

from app.core.config import Settings
from app.core.time import to_utc_z, utc_now


def _add_contract_fields(
    logger: Any,
    method_name: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    del logger, method_name
    event_dict.setdefault("timestamp", to_utc_z(utc_now()))
    event_dict.setdefault("module", "core")
    event_dict.setdefault("request_id", None)
    event_dict.setdefault("user_id", None)
    event_dict.setdefault("duration_ms", None)
    event_dict.setdefault("error_code", None)
    return event_dict


def configure_logging(settings: Settings) -> None:
    level = getattr(logging, settings.log_level)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            _add_contract_fields,
            structlog.processors.JSONRenderer(sort_keys=True),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=False,
    )


def get_logger(module: str) -> structlog.typing.FilteringBoundLogger:
    return structlog.get_logger().bind(module=module)


def new_operation_id() -> str:
    return str(uuid4())
