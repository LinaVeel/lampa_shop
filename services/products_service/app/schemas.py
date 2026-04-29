from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class Pagination(BaseModel):
    page: int
    limit: int
    total: int


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    parent_id: int | None = Field(default=None, gt=0)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    parent_id: int | None = Field(default=None, gt=0)


class ProductCreate(BaseModel):
    category_id: int | None = Field(default=None, gt=0)
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    category_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductImageCreate(BaseModel):
    product_id: int = Field(gt=0)
    url: HttpUrl
    is_main: bool = False
    sort_order: int = 0


class ProductImageUpdate(BaseModel):
    product_id: int | None = Field(default=None, gt=0)
    url: HttpUrl | None = None
    is_main: bool | None = None
    sort_order: int | None = None


class ListResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    data: list[dict]
    pagination: Pagination


class ItemResponse(BaseModel):
    data: dict
