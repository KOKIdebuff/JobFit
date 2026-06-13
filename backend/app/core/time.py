from datetime import UTC, datetime


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_utc_z(value: datetime) -> str:
    if value.tzinfo is None:
        raise ValueError("datetime must be timezone-aware")
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
