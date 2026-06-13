from collections.abc import Iterable

from fastapi import APIRouter

API_V1_PREFIX = "/api/v1"


def create_api_router(module_routers: Iterable[APIRouter] = ()) -> APIRouter:
    router = APIRouter(prefix=API_V1_PREFIX)
    for module_router in module_routers:
        router.include_router(module_router)
    return router
