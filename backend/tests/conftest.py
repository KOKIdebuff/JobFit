from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    database_path = tmp_path / "hirelink-test.db"
    return Settings(
        environment="test",
        log_level="INFO",
        database_url=f"sqlite:///{database_path.as_posix()}",
    )


@pytest.fixture
def application(test_settings: Settings) -> FastAPI:
    return create_app(settings=test_settings)


@pytest.fixture
def client(application: FastAPI) -> Iterator[TestClient]:
    with TestClient(application, raise_server_exceptions=False) as test_client:
        yield test_client
