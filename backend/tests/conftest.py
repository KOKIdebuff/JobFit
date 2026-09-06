from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.db.base import Base
from app.db.session import create_database_engine
from app.main import create_app
from app.modules.ai_runs import models as ai_runs_models
from app.modules.applications_matches import models as applications_matches_models
from app.modules.auth_users import models as auth_user_models
from app.modules.human_interviews import models as human_interviews_models
from app.modules.jobfit import models as jobfit_models
from app.modules.jobs import models as jobs_models
from app.modules.notifications import models as notifications_models
from app.modules.reports import models as reports_models
from app.modules.resumes import models as resumes_models
from app.modules.trials import models as trials_models


def _load_models() -> None:
    _ = (
        ai_runs_models,
        applications_matches_models,
        auth_user_models,
        human_interviews_models,
        jobs_models,
        jobfit_models,
        notifications_models,
        reports_models,
        resumes_models,
        trials_models,
    )


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    database_path = tmp_path / "hirelink-test.db"
    return Settings(
        environment="test",
        log_level="INFO",
        database_url=f"sqlite:///{database_path.as_posix()}",
    )


@pytest.fixture
def application(test_settings: Settings) -> Iterator[FastAPI]:
    _load_models()
    engine = create_database_engine(test_settings)
    Base.metadata.create_all(bind=engine)
    try:
        yield create_app(settings=test_settings)
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(application: FastAPI) -> Iterator[TestClient]:
    with TestClient(application, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture
def db_session(application: FastAPI, test_settings: Settings) -> Iterator[Session]:
    del application
    engine = create_database_engine(test_settings)
    with Session(engine) as session:
        yield session
