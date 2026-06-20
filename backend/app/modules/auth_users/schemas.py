from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

UserRole = Literal["candidate", "hr"]


class AuthUser(BaseModel):
    id: UUID
    email: str
    username: str
    display_name: str
    role: UserRole
    organization_id: UUID | None
    organization_name: str | None
    created_at: datetime


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    username: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    display_name: str = Field(min_length=1, max_length=120)
    organization_name: str | None = Field(default=None, max_length=120)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("invalid_email")
        return normalized

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.replace("_", "").replace("-", "").isalnum():
            raise ValueError("invalid_username")
        return normalized

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("organization_name")
    @classmethod
    def normalize_organization_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()


class AuthSessionResponse(BaseModel):
    user: AuthUser


class LogoutResponse(BaseModel):
    logged_out: bool = True
