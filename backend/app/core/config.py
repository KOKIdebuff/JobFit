from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="JOBFIT_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        populate_by_name=True,
    )

    app_name: str = "JobFit API"
    environment: Literal["development", "test", "production"] = Field(
        default="development",
        validation_alias=AliasChoices("JOBFIT_ENVIRONMENT", "HIRELINK_ENVIRONMENT"),
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", validation_alias=AliasChoices("JOBFIT_LOG_LEVEL", "HIRELINK_LOG_LEVEL")
    )
    database_url: str = Field(
        default="sqlite:///./data/jobfit.db",
        validation_alias=AliasChoices("JOBFIT_DATABASE_URL", "HIRELINK_DATABASE_URL"),
    )
    sqlite_busy_timeout_ms: int = Field(
        default=5_000,
        ge=0,
        validation_alias=AliasChoices(
            "JOBFIT_SQLITE_BUSY_TIMEOUT_MS", "HIRELINK_SQLITE_BUSY_TIMEOUT_MS"
        ),
    )
    jwt_secret: str = Field(
        default="jobfit-dev-only-change-me-32-byte-minimum",
        validation_alias=AliasChoices("JOBFIT_JWT_SECRET", "HIRELINK_JWT_SECRET"),
    )
    jwt_algorithm: str = "HS256"
    auth_cookie_name: str = Field(
        default="jobfit_session",
        validation_alias=AliasChoices("JOBFIT_AUTH_COOKIE_NAME", "HIRELINK_AUTH_COOKIE_NAME"),
    )
    auth_token_expires_seconds: int = Field(default=3_600, ge=60)
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cors_allow_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    llm_provider: Literal["deterministic", "openai_compatible"] = "deterministic"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    llm_timeout_seconds: int = Field(default=30, ge=1, le=120)
    allow_demo_provider: bool = True
    max_upload_bytes: int = Field(default=5_000_000, ge=1_024, le=20_000_000)

    @model_validator(mode="after")
    def validate_secure_runtime(self) -> "Settings":
        if self.environment == "production":
            if self.jwt_secret in {"", "jobfit-dev-only-change-me-32-byte-minimum"}:
                raise ValueError("JOBFIT_JWT_SECRET must be configured in production")
            if "llm_provider" not in self.model_fields_set:
                raise ValueError("JOBFIT_LLM_PROVIDER must be explicitly configured in production")
            if self.llm_provider == "deterministic" and (
                "allow_demo_provider" not in self.model_fields_set or not self.allow_demo_provider
            ):
                raise ValueError(
                    "production deterministic provider requires explicit "
                    "JOBFIT_ALLOW_DEMO_PROVIDER=true"
                )
        if self.llm_provider == "openai_compatible" and not (
            self.llm_base_url and self.llm_api_key and self.llm_model
        ):
            raise ValueError("openai_compatible provider requires base URL, API key and model")
        if self.llm_provider == "openai_compatible":
            parsed = urlsplit(self.llm_base_url)
            if parsed.scheme not in {"http", "https"} or not parsed.hostname:
                raise ValueError("JOBFIT_LLM_BASE_URL must be an absolute http(s) URL")
            if parsed.username or parsed.password or parsed.query or parsed.fragment:
                raise ValueError(
                    "JOBFIT_LLM_BASE_URL must not include userinfo, query or fragment"
                )
            if self.environment == "production" and parsed.scheme != "https":
                raise ValueError("JOBFIT_LLM_BASE_URL must use https in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
