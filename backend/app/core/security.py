from collections.abc import Mapping, Sequence
from typing import Any

SENSITIVE_FIELD_NAMES = frozenset(
    {
        "api_key",
        "authorization",
        "cookie",
        "email",
        "id_card",
        "jwt",
        "password",
        "password_hash",
        "phone",
        "prompt",
        "secret",
        "token",
    }
)

REDACTED = "[REDACTED]"


def is_sensitive_field(name: str) -> bool:
    normalized = name.lower().replace("-", "_")
    return any(sensitive in normalized for sensitive in SENSITIVE_FIELD_NAMES)


def redact_mapping(value: Mapping[str, Any]) -> dict[str, Any]:
    redacted: dict[str, Any] = {}
    for key, item in value.items():
        if is_sensitive_field(key):
            redacted[key] = REDACTED
        elif isinstance(item, Mapping):
            redacted[key] = redact_mapping(item)
        elif isinstance(item, Sequence) and not isinstance(item, (str, bytes, bytearray)):
            redacted[key] = [
                redact_mapping(entry) if isinstance(entry, Mapping) else entry for entry in item
            ]
        else:
            redacted[key] = item
    return redacted
