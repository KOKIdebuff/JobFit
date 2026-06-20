from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="HIRELINK_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "HireLink API"
    environment: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    database_url: str = "sqlite:///./data/hirelink.db"
    sqlite_busy_timeout_ms: int = Field(default=5_000, ge=0)
    jwt_secret: str = "hirelink-dev-only-change-me-32-byte-minimum"
    jwt_algorithm: str = "HS256"
    auth_cookie_name: str = "hirelink_session"
    auth_token_expires_seconds: int = Field(default=3_600, ge=60)
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cors_allow_origins: str = "http://127.0.0.1:5173,http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
