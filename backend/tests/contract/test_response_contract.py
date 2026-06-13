import json
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Body, Query, Request
from fastapi.testclient import TestClient

from app.contracts.api import success_response
from app.contracts.errors import ErrorCode
from app.contracts.pagination import PaginationMeta, PaginationParams
from app.core.config import Settings
from app.core.exceptions import AppException
from app.db.session import create_database_engine
from app.main import create_app


def assert_error_contract(response: Any, *, status_code: int, code: ErrorCode) -> None:
    assert response.status_code == status_code
    payload = response.json()
    assert payload["success"] is False
    assert payload["error"]["code"] == code.value
    assert set(payload["meta"]) >= {"request_id", "timestamp"}
    UUID(payload["meta"]["request_id"], version=4)
    assert payload["meta"]["timestamp"].endswith("Z")


def test_application_lifespan_and_openapi(test_settings: Settings) -> None:
    application = create_app(settings=test_settings)
    database_path = Path(test_settings.database_url.removeprefix("sqlite:///"))
    assert not database_path.exists()

    with TestClient(application) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/health" in response.json()["paths"]
    assert application.state.settings is test_settings
    assert not database_path.exists()


def test_health_uses_unified_success_contract(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"] == {"status": "ok"}
    assert payload["meta"]["timestamp"].endswith("Z")
    assert response.headers["X-Request-ID"] == payload["meta"]["request_id"]
    UUID(payload["meta"]["request_id"], version=4)


def test_valid_uuid4_request_id_is_reused(client: TestClient) -> None:
    request_id = str(uuid4())

    response = client.get("/health", headers={"X-Request-ID": request_id})

    assert response.headers["X-Request-ID"] == request_id
    assert response.json()["meta"]["request_id"] == request_id


def test_invalid_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "not-a-valid-request-id"})

    generated = response.headers["X-Request-ID"]
    assert generated != "not-a-valid-request-id"
    assert str(UUID(generated, version=4)) == generated


def test_non_canonical_uuid4_request_id_is_replaced(client: TestClient) -> None:
    uppercase_request_id = str(uuid4()).upper()

    response = client.get("/health", headers={"X-Request-ID": uppercase_request_id})

    assert response.headers["X-Request-ID"] != uppercase_request_id


def test_module_router_is_mounted_under_api_v1(test_settings: Settings) -> None:
    router = APIRouter(prefix="/examples")

    @router.get("")
    async def example(request: Request) -> Any:
        return success_response({"mounted": True}, request_id=UUID(str(request.state.request_id)))

    application = create_app(settings=test_settings, module_routers=[router])

    with TestClient(application) as client:
        response = client.get("/api/v1/examples")

    assert response.status_code == 200
    assert response.json()["data"] == {"mounted": True}


def test_empty_paginated_response_keeps_complete_metadata(test_settings: Settings) -> None:
    router = APIRouter()

    @router.get("/items")
    async def items(request: Request) -> Any:
        pagination = PaginationMeta.from_total(params=PaginationParams(), total=0)
        return success_response(
            [],
            request_id=UUID(str(request.state.request_id)),
            pagination=pagination,
        )

    application = create_app(settings=test_settings, module_routers=[router])

    with TestClient(application) as client:
        response = client.get("/api/v1/items")

    assert response.status_code == 200
    assert response.json()["data"] == []
    assert response.json()["meta"]["pagination"] == {
        "page": 1,
        "page_size": 20,
        "total": 0,
        "total_pages": 0,
    }


def test_validation_errors_are_sanitized(test_settings: Settings) -> None:
    router = APIRouter()

    @router.get("/validated")
    async def validated(
        request: Request,
        page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    ) -> Any:
        return success_response(
            {"page_size": page_size},
            request_id=UUID(str(request.state.request_id)),
        )

    application = create_app(settings=test_settings, module_routers=[router])

    with TestClient(application) as client:
        response = client.get("/api/v1/validated?page_size=101")

    assert_error_contract(
        response,
        status_code=422,
        code=ErrorCode.COMMON_VALIDATION_FAILED,
    )
    assert response.json()["error"]["details"] == {
        "fields": [
            {
                "field": "page_size",
                "reason": "must_be_less_than_or_equal_to_100",
            }
        ]
    }
    assert "101" not in response.text


def test_business_exception_maps_code_and_status(test_settings: Settings) -> None:
    router = APIRouter()

    @router.get("/invalid-state")
    async def invalid_state() -> None:
        raise AppException(
            ErrorCode.JOB_INVALID_STATE,
            details={"current_state": "draft", "required_state": "confirmed"},
        )

    application = create_app(settings=test_settings, module_routers=[router])

    with TestClient(application) as client:
        response = client.get("/api/v1/invalid-state")

    assert_error_contract(response, status_code=409, code=ErrorCode.JOB_INVALID_STATE)
    assert response.json()["error"]["details"]["current_state"] == "draft"


def test_unknown_exception_is_sanitized_in_response_and_logs(
    test_settings: Settings,
    capsys: Any,
) -> None:
    router = APIRouter()
    secret_message = "resume-private-text-should-not-leak"
    bearer = "Bearer private-jwt-value"
    cookie = "session=private-cookie-value"

    @router.post("/explode")
    async def explode(payload: Annotated[dict[str, Any], Body()]) -> None:
        del payload
        raise RuntimeError(secret_message)

    application = create_app(settings=test_settings, module_routers=[router])

    with TestClient(application, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/explode?token=query-secret",
            headers={"Authorization": bearer, "Cookie": cookie},
            json={"resume_text": "private-resume-body"},
        )

    assert_error_contract(response, status_code=500, code=ErrorCode.COMMON_INTERNAL_ERROR)
    output = capsys.readouterr().out
    assert secret_message not in output
    assert bearer not in output
    assert cookie not in output
    assert "query-secret" not in output
    assert "private-resume-body" not in output
    assert "RuntimeError" in output


def test_unknown_route_uses_temporary_common_bad_request_mapping(client: TestClient) -> None:
    response = client.get("/does-not-exist")

    assert_error_contract(response, status_code=400, code=ErrorCode.COMMON_BAD_REQUEST)


def test_method_not_allowed_uses_temporary_common_bad_request_mapping(
    client: TestClient,
) -> None:
    response = client.post("/health")

    assert_error_contract(response, status_code=400, code=ErrorCode.COMMON_BAD_REQUEST)


def test_request_log_contains_required_contract_fields(
    client: TestClient,
    capsys: Any,
) -> None:
    client.get("/health")

    output = capsys.readouterr().out
    records = [json.loads(line) for line in output.splitlines() if line.startswith("{")]
    request_record = next(record for record in records if record["event"] == "request.completed")

    assert request_record["level"] == "info"
    assert request_record["module"] == "http"
    assert request_record["request_id"]
    assert request_record["user_id"] is None
    assert request_record["duration_ms"] >= 0
    assert request_record["error_code"] is None
    assert request_record["http_method"] == "GET"
    assert request_record["http_path"] == "/health"
    assert request_record["http_status"] == 200
    assert request_record["timestamp"].endswith("Z")


def test_settings_read_hirelink_prefixed_environment(monkeypatch: Any) -> None:
    monkeypatch.setenv("HIRELINK_ENVIRONMENT", "test")
    monkeypatch.setenv("HIRELINK_LOG_LEVEL", "WARNING")

    settings = Settings()

    assert settings.environment == "test"
    assert settings.log_level == "WARNING"


def test_test_database_does_not_use_development_path(test_settings: Settings) -> None:
    assert test_settings.environment == "test"
    assert test_settings.database_url != "sqlite:///./data/hirelink.db"
    assert "hirelink-test.db" in test_settings.database_url


def test_sqlite_engine_enables_foreign_keys_and_busy_timeout(
    test_settings: Settings,
) -> None:
    test_settings.sqlite_busy_timeout_ms = 7_500
    engine = create_database_engine(test_settings)

    try:
        with engine.connect() as connection:
            foreign_keys = connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one()
            busy_timeout = connection.exec_driver_sql("PRAGMA busy_timeout").scalar_one()
    finally:
        engine.dispose()

    assert foreign_keys == 1
    assert busy_timeout == 7_500
