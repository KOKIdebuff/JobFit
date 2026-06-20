from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status

from app.contracts.api import SuccessResponse, success_response
from app.core.config import Settings, get_settings
from app.modules.auth_users.deps import current_user, get_auth_service
from app.modules.auth_users.schemas import (
    AuthSessionResponse,
    AuthUser,
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
)
from app.modules.auth_users.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
AUTH_SERVICE_DEPENDENCY = Depends(get_auth_service)
SETTINGS_DEPENDENCY = Depends(get_settings)
CURRENT_USER_DEPENDENCY = Depends(current_user)


def _request_id(request: Request) -> UUID:
    return UUID(str(request.state.request_id))


def _set_auth_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_token_expires_seconds,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


@router.post(
    "/register",
    response_model=SuccessResponse[AuthSessionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    service: AuthService = AUTH_SERVICE_DEPENDENCY,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> SuccessResponse[AuthSessionResponse]:
    user = service.register(payload)
    _set_auth_cookie(response, service.create_token(user), settings)
    return success_response(AuthSessionResponse(user=user), request_id=_request_id(request))


@router.post("/login", response_model=SuccessResponse[AuthSessionResponse])
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: AuthService = AUTH_SERVICE_DEPENDENCY,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> SuccessResponse[AuthSessionResponse]:
    user = service.authenticate(payload.identifier, payload.password)
    _set_auth_cookie(response, service.create_token(user), settings)
    return success_response(AuthSessionResponse(user=user), request_id=_request_id(request))


@router.post("/logout", response_model=SuccessResponse[LogoutResponse])
async def logout(
    request: Request,
    response: Response,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> SuccessResponse[LogoutResponse]:
    response.delete_cookie(settings.auth_cookie_name, path="/")
    return success_response(LogoutResponse(), request_id=_request_id(request))


@router.get("/me", response_model=SuccessResponse[AuthSessionResponse])
async def me(
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
) -> SuccessResponse[AuthSessionResponse]:
    return success_response(AuthSessionResponse(user=user), request_id=_request_id(request))
