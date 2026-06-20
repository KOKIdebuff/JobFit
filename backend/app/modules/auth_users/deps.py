from collections.abc import Callable

import structlog
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import Settings, get_settings
from app.core.exceptions import AppException
from app.db.session import get_session
from app.modules.auth_users.schemas import AuthUser, UserRole
from app.modules.auth_users.service import AuthService

SESSION_DEPENDENCY = Depends(get_session)
SETTINGS_DEPENDENCY = Depends(get_settings)


def get_auth_service(
    session: Session = SESSION_DEPENDENCY,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> AuthService:
    return AuthService(session, settings)


AUTH_SERVICE_DEPENDENCY = Depends(get_auth_service)


def current_user(
    request: Request,
    service: AuthService = AUTH_SERVICE_DEPENDENCY,
    settings: Settings = SETTINGS_DEPENDENCY,
) -> AuthUser:
    user = service.user_from_token(request.cookies.get(settings.auth_cookie_name))
    structlog.contextvars.bind_contextvars(user_id=str(user.id))
    return user


CURRENT_USER_DEPENDENCY = Depends(current_user)


def require_role(*roles: UserRole) -> Callable[[AuthUser], AuthUser]:
    def dependency(user: AuthUser = CURRENT_USER_DEPENDENCY) -> AuthUser:
        if user.role not in roles:
            raise AppException(ErrorCode.AUTH_FORBIDDEN)
        return user

    return dependency
