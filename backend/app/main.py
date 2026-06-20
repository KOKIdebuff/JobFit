from collections.abc import AsyncIterator, Iterable
from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api.router import create_api_router
from app.contracts.api import SuccessResponse, success_response
from app.core.config import Settings, get_settings
from app.core.error_handlers import register_exception_handlers
from app.core.logging import configure_logging, get_logger, new_operation_id
from app.core.middleware import RequestContextMiddleware
from app.modules.auth_users.router import router as auth_router
from app.modules.demo_data.router import router as core_router
from app.modules.human_interviews.router import router as human_interviews_router
from app.modules.notifications.router import router as notifications_router


class HealthData(BaseModel):
    status: str = "ok"


def create_app(
    settings: Settings | None = None,
    module_routers: Iterable[APIRouter] = (),
) -> FastAPI:
    effective_settings = settings or get_settings()
    configure_logging(effective_settings)
    application_logger = get_logger("application")

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        operation_id = new_operation_id()
        application_logger.info(
            "application.started",
            request_id=operation_id,
            environment=effective_settings.environment,
        )
        try:
            yield
        finally:
            application_logger.info(
                "application.stopped",
                request_id=operation_id,
                environment=effective_settings.environment,
            )

    application = FastAPI(
        title=effective_settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )
    application.state.settings = effective_settings
    cors_origins = [
        origin.strip()
        for origin in effective_settings.cors_allow_origins.split(",")
        if origin.strip()
    ]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    if settings is not None:
        application.dependency_overrides[get_settings] = lambda: effective_settings

    application.add_middleware(RequestContextMiddleware)
    register_exception_handlers(application)

    @application.get("/health", response_model=SuccessResponse[HealthData], tags=["system"])
    async def health(request: Request) -> SuccessResponse[HealthData]:
        request_id = UUID(str(request.state.request_id))
        return success_response(HealthData(), request_id=request_id)

    application.include_router(
        create_api_router(
            (
                auth_router,
                core_router,
                human_interviews_router,
                notifications_router,
                *tuple(module_routers),
            )
        )
    )
    return application


app = create_app()
