from collections.abc import Generator
from functools import lru_cache
from pathlib import Path

from fastapi import Depends
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings

SETTINGS_DEPENDENCY = Depends(get_settings)


def ensure_sqlite_parent_directory(database_url: str) -> None:
    """Create the parent directory for a file-backed SQLite database when needed."""
    url = make_url(database_url)
    database = url.database
    if (
        not url.drivername.startswith("sqlite")
        or not database
        or database == ":memory:"
        or database.startswith("file:")
    ):
        return

    Path(database).expanduser().parent.mkdir(parents=True, exist_ok=True)


def _configure_sqlite_engine(engine: Engine, sqlite_busy_timeout_ms: int) -> None:
    @event.listens_for(engine, "connect")
    def configure_sqlite(dbapi_connection: object, connection_record: object) -> None:
        del connection_record
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute(f"PRAGMA busy_timeout={sqlite_busy_timeout_ms}")
        finally:
            cursor.close()


@lru_cache
def _engine_for_config(database_url: str, sqlite_busy_timeout_ms: int) -> Engine:
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        ensure_sqlite_parent_directory(database_url)
        connect_args["check_same_thread"] = False
        connect_args["timeout"] = sqlite_busy_timeout_ms / 1_000

    engine = create_engine(database_url, connect_args=connect_args)
    if database_url.startswith("sqlite"):
        _configure_sqlite_engine(engine, sqlite_busy_timeout_ms)
    return engine


def create_database_engine(settings: Settings) -> Engine:
    return _engine_for_config(settings.database_url, settings.sqlite_busy_timeout_ms)


@lru_cache
def get_engine() -> Engine:
    return create_database_engine(get_settings())


@lru_cache
def _session_factory_for_config(
    database_url: str,
    sqlite_busy_timeout_ms: int,
) -> sessionmaker[Session]:
    return sessionmaker(
        bind=_engine_for_config(database_url, sqlite_busy_timeout_ms),
        autoflush=False,
        expire_on_commit=False,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    settings = get_settings()
    return _session_factory_for_config(settings.database_url, settings.sqlite_busy_timeout_ms)


def get_session(settings: Settings = SETTINGS_DEPENDENCY) -> Generator[Session]:
    factory = _session_factory_for_config(settings.database_url, settings.sqlite_busy_timeout_ms)
    with factory() as session:
        yield session
