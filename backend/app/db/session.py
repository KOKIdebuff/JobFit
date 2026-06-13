from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings


def create_database_engine(settings: Settings) -> Engine:
    connect_args: dict[str, object] = {}
    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(settings.database_url, connect_args=connect_args)

    if settings.database_url.startswith("sqlite"):
        busy_timeout_ms = settings.sqlite_busy_timeout_ms

        @event.listens_for(engine, "connect")
        def configure_sqlite(dbapi_connection: object, connection_record: object) -> None:
            del connection_record
            cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
            try:
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute(f"PRAGMA busy_timeout={busy_timeout_ms:d}")
            finally:
                cursor.close()

    return engine


@lru_cache
def get_engine() -> Engine:
    return create_database_engine(get_settings())


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session]:
    with get_session_factory()() as session:
        yield session
