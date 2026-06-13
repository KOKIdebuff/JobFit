from math import ceil

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

    @classmethod
    def from_total(cls, *, params: PaginationParams, total: int) -> "PaginationMeta":
        return cls(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=ceil(total / params.page_size) if total else 0,
        )
