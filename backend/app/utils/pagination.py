from pydantic import BaseModel
from fastapi import Query


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int

    @classmethod
    def build(cls, items: list, total: int, page: int, page_size: int) -> "PaginatedResponse":
        pages = (total + page_size - 1) // page_size if page_size else 1
        return cls(items=items, total=total, page=page, page_size=page_size, pages=pages)


def pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)
