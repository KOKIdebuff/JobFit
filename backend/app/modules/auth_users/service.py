from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

import jwt
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.contracts.errors import ErrorCode
from app.core.config import Settings
from app.core.exceptions import AppException
from app.modules.auth_users.models import Organization, User
from app.modules.auth_users.repository import AuthUsersRepository
from app.modules.auth_users.schemas import AuthUser, RegisterRequest, UserRole

DEMO_PASSWORD = "HireLinkDemo2026!"
DEMO_HR_EMAIL = "hr.demo@hirelink.local"
DEMO_CANDIDATE_EMAIL = "candidate.demo@hirelink.local"

password_hasher = PasswordHash.recommended()


class AuthService:
    def __init__(self, session: Session, settings: Settings) -> None:
        self.session = session
        self.settings = settings
        self.repository = AuthUsersRepository(session)

    def register(self, payload: RegisterRequest) -> AuthUser:
        if self.repository.get_user_by_email(payload.email) is not None:
            raise AppException(ErrorCode.USER_CONFLICT, details={"field": "email"})
        if self.repository.get_user_by_username(payload.username) is not None:
            raise AppException(ErrorCode.USER_CONFLICT, details={"field": "username"})

        organization_id = self._organization_id_for(payload.role, payload.organization_name)
        user = self.repository.create_user(
            email=payload.email,
            username=payload.username,
            display_name=payload.display_name,
            role=payload.role,
            password_hash=password_hasher.hash(payload.password),
            organization_id=organization_id,
        )
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise AppException(ErrorCode.USER_CONFLICT) from exc
        return self.to_auth_user(user)

    def authenticate(self, identifier: str, password: str) -> AuthUser:
        self.ensure_demo_accounts()
        user = self.repository.get_user_by_identifier(identifier)
        if user is None or not password_hasher.verify(password, user.password_hash):
            raise AppException(ErrorCode.AUTH_UNAUTHORIZED)
        return self.to_auth_user(user)

    def create_token(self, user: AuthUser) -> str:
        now = datetime.now(UTC)
        payload: dict[str, Any] = {
            "sub": str(user.id),
            "role": user.role,
            "iat": int(now.timestamp()),
            "exp": int(
                (now + timedelta(seconds=self.settings.auth_token_expires_seconds)).timestamp()
            ),
        }
        return jwt.encode(payload, self.settings.jwt_secret, algorithm=self.settings.jwt_algorithm)

    def user_from_token(self, token: str | None) -> AuthUser:
        if not token:
            raise AppException(ErrorCode.AUTH_UNAUTHORIZED)
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret,
                algorithms=[self.settings.jwt_algorithm],
            )
            user_id = UUID(str(payload["sub"]))
        except jwt.ExpiredSignatureError as exc:
            raise AppException(ErrorCode.AUTH_TOKEN_EXPIRED) from exc
        except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
            raise AppException(ErrorCode.AUTH_UNAUTHORIZED) from exc

        user = self.repository.get_user_by_id(user_id)
        if user is None:
            raise AppException(ErrorCode.AUTH_UNAUTHORIZED)
        return self.to_auth_user(user)

    def ensure_demo_accounts(self) -> None:
        organization = self._get_or_create_organization("星河智能")
        hr_user = self.repository.get_user_by_email(DEMO_HR_EMAIL)
        if hr_user is None:
            self.repository.create_user(
                email=DEMO_HR_EMAIL,
                username="hr_demo",
                display_name="陈经理",
                role="hr",
                password_hash=password_hasher.hash(DEMO_PASSWORD),
                organization_id=organization.id,
            )
        else:
            hr_user.display_name = "陈经理"
            hr_user.organization_id = organization.id

        candidate_user = self.repository.get_user_by_email(DEMO_CANDIDATE_EMAIL)
        if candidate_user is None:
            self.repository.create_user(
                email=DEMO_CANDIDATE_EMAIL,
                username="candidate_demo",
                display_name="李同学",
                role="candidate",
                password_hash=password_hasher.hash(DEMO_PASSWORD),
                organization_id=None,
            )
        else:
            candidate_user.display_name = "李同学"
            candidate_user.organization_id = None
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()

    def to_auth_user(self, user: User) -> AuthUser:
        organization_name = user.organization.name if user.organization is not None else None
        return AuthUser(
            id=user.id,
            email=user.email,
            username=user.username,
            display_name=user.display_name,
            role=cast(UserRole, user.role),
            organization_id=user.organization_id,
            organization_name=organization_name,
            created_at=user.created_at,
        )

    def _organization_id_for(self, role: str, organization_name: str | None) -> UUID | None:
        if role != "hr":
            return None
        organization = self._get_or_create_organization(organization_name or "HireLink Demo")
        return organization.id

    def _get_or_create_organization(self, name: str) -> Organization:
        existing = self.repository.get_organization_by_name(name)
        if existing is not None:
            return existing
        return self.repository.create_organization(name)
