from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import CHAR, DateTime
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.types import TypeDecorator


class GUID(TypeDecorator[UUID]):
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value: UUID | str | None, dialect: Dialect) -> str | None:
        del dialect
        if value is None:
            return None
        return str(value if isinstance(value, UUID) else UUID(value))

    def process_result_value(self, value: str | None, dialect: Dialect) -> UUID | None:
        del dialect
        return UUID(value) if value is not None else None


class UTCDateTime(TypeDecorator[datetime]):
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        del dialect
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("datetime must be timezone-aware")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        del dialect
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    @property
    def python_type(self) -> type[datetime]:
        return datetime

    def copy(self, **kw: Any) -> "UTCDateTime":
        del kw
        return UTCDateTime()
