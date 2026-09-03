from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.contracts.api import success_response
from app.contracts.errors import ErrorCode
from app.db.base import Base
from app.db.session import create_database_engine
from app.main import create_app
from app.modules.auth_users.deps import require_role
from app.modules.auth_users.repository import AuthUsersRepository
from app.modules.auth_users.schemas import AuthUser
from app.modules.auth_users.service import (
    DEMO_CANDIDATE_EMAIL,
    DEMO_HR_EMAIL,
    DEMO_PASSWORD,
    password_hasher,
)


def assert_error_contract(response: Any, *, status_code: int, code: ErrorCode) -> None:
    assert response.status_code == status_code
    payload = response.json()
    assert payload["success"] is False
    assert payload["error"]["code"] == code.value
    assert set(payload["meta"]) >= {"request_id", "timestamp"}


def test_demo_hr_can_login_and_read_me(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": DEMO_HR_EMAIL, "password": DEMO_PASSWORD},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["user"]["role"] == "hr"
    assert payload["data"]["user"]["email"] == DEMO_HR_EMAIL
    assert payload["data"]["user"]["display_name"] == "陈经理"
    assert payload["data"]["user"]["organization_name"] == "星河智能"
    assert "hirelink_session" in response.cookies

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    me_user = me.json()["data"]["user"]
    assert me_user["email"] == DEMO_HR_EMAIL
    assert me_user["display_name"] == "陈经理"
    assert me_user["organization_name"] == "星河智能"


def test_candidate_demo_can_login(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": DEMO_CANDIDATE_EMAIL, "password": DEMO_PASSWORD},
    )

    assert response.status_code == 200
    user = response.json()["data"]["user"]
    assert user["role"] == "candidate"
    assert user["email"] == DEMO_CANDIDATE_EMAIL
    assert user["display_name"] == "李同学"
    assert user["organization_name"] is None


def test_demo_accounts_are_repaired_when_hr_demo_already_exists(
    client: TestClient,
    db_session: Session,
) -> None:
    repository = AuthUsersRepository(db_session)
    organization = repository.create_organization("Legacy Org")
    repository.create_user(
        email=DEMO_HR_EMAIL,
        username="hr_demo",
        display_name="Broken HR",
        role="hr",
        password_hash=password_hasher.hash(DEMO_PASSWORD),
        organization_id=organization.id,
    )
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": DEMO_CANDIDATE_EMAIL, "password": DEMO_PASSWORD},
    )

    assert response.status_code == 200
    user = response.json()["data"]["user"]
    assert user["email"] == DEMO_CANDIDATE_EMAIL
    assert user["display_name"] == "李同学"

    db_session.expire_all()
    hr_user = repository.get_user_by_email(DEMO_HR_EMAIL)
    assert hr_user is not None
    assert hr_user.display_name == "陈经理"
    assert hr_user.organization is not None
    assert hr_user.organization.name == "星河智能"


def test_login_failure_uses_unified_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": DEMO_HR_EMAIL, "password": "wrong-password"},
    )

    assert_error_contract(response, status_code=401, code=ErrorCode.AUTH_UNAUTHORIZED)


def test_me_requires_cookie(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")

    assert_error_contract(response, status_code=401, code=ErrorCode.AUTH_UNAUTHORIZED)


def test_register_creates_candidate_and_sets_cookie(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new.candidate@hirelink.local",
            "username": "new_candidate",
            "display_name": "新候选人",
            "password": "Candidate2026!",
            "role": "candidate",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["data"]["user"]["role"] == "candidate"
    assert payload["data"]["user"]["email"] == "new.candidate@hirelink.local"
    assert payload["data"]["user"]["display_name"] == "新候选人"
    assert payload["data"]["user"]["organization_id"] is None
    assert payload["data"]["user"]["organization_name"] is None
    assert "hirelink_session" in response.cookies

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["data"]["user"]["email"] == "new.candidate@hirelink.local"


def test_register_conflict_returns_user_conflict(client: TestClient) -> None:
    payload = {
        "email": "duplicate@hirelink.local",
        "username": "duplicate_user",
        "display_name": "重复用户",
        "password": "Candidate2026!",
        "role": "candidate",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)

    assert_error_contract(second, status_code=409, code=ErrorCode.USER_CONFLICT)


def test_logout_clears_cookie(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"identifier": DEMO_HR_EMAIL, "password": DEMO_PASSWORD},
    )
    assert login.status_code == 200

    logout = client.post("/api/v1/auth/logout")

    assert logout.status_code == 200
    assert logout.json()["data"] == {"logged_out": True}
    assert "hirelink_session" in logout.headers.get("set-cookie", "")


def test_require_role_blocks_candidate(test_settings: Any) -> None:
    router = APIRouter()
    hr_only_dependency = Depends(require_role("hr"))

    @router.get("/hr-only")
    async def hr_only(
        request: Request,
        user: AuthUser = hr_only_dependency,
    ) -> Any:
        del user
        return success_response({"ok": True}, request_id=request.state.request_id)

    engine = create_database_engine(test_settings)
    Base.metadata.create_all(bind=engine)
    try:
        application = create_app(settings=test_settings, module_routers=[router])
        with TestClient(application, raise_server_exceptions=False) as client:
            login = client.post(
                "/api/v1/auth/login",
                json={"identifier": DEMO_CANDIDATE_EMAIL, "password": DEMO_PASSWORD},
            )
            assert login.status_code == 200
            response = client.get("/api/v1/hr-only")
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

    assert_error_contract(response, status_code=403, code=ErrorCode.AUTH_FORBIDDEN)
