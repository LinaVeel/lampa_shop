from fastapi import APIRouter, Depends, Query
from psycopg.errors import UniqueViolation

from app.db import fetch_all, fetch_one
from app.deps import require_admin
from app.errors import BadRequestError, NotFoundError
from app.helpers import build_pagination, normalize_slug
from app.schemas import ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.post("/", dependencies=[Depends(require_admin)], status_code=201)
def create_product(payload: ProductCreate):
    if payload.category_id is not None:
        category = fetch_one(
            "SELECT id FROM categories WHERE id = %s", [payload.category_id]
        )
        if category is None:
            raise NotFoundError("Category not found")

    try:
        row = fetch_one(
            """
            INSERT INTO products (category_id, name, slug, description, price, stock_quantity, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, category_id, name, slug, description, price, stock_quantity, is_active, created_at, updated_at
            """,
            [
                payload.category_id,
                payload.name,
                normalize_slug(payload.slug),
                payload.description,
                payload.price,
                payload.stock_quantity,
                payload.is_active,
            ],
        )
    except UniqueViolation:
        raise BadRequestError("Product slug must be unique")

    return {"data": row}


@router.get("/")
def get_products(
    page: int = Query(default=1, gt=0),
    limit: int = Query(default=20, gt=0, le=100),
    category_id: int | None = Query(default=None, gt=0),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1),
):
    page, offset = build_pagination(page, limit)

    where_parts: list[str] = []
    values: list = []

    if category_id is not None:
        where_parts.append("category_id = %s")
        values.append(category_id)

    if is_active is not None:
        where_parts.append("is_active = %s")
        values.append(is_active)

    if search:
        where_parts.append("search_vector @@ plainto_tsquery('simple', %s)")
        values.append(search)

    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

    total_row = fetch_one(
        f"SELECT COUNT(*)::int AS total FROM products {where_clause}", values
    )
    rows = fetch_all(
        f"""
        SELECT id, category_id, name, slug, description, price, stock_quantity, is_active, created_at, updated_at
        FROM products
        {where_clause}
        ORDER BY id DESC
        LIMIT %s OFFSET %s
        """,
        [*values, limit, offset],
    )

    return {
        "data": rows,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_row["total"] if total_row else 0,
        },
    }


@router.get("/{product_id}")
def get_product_by_id(product_id: int):
    row = fetch_one(
        """
        SELECT id, category_id, name, slug, description, price, stock_quantity, is_active, created_at, updated_at
        FROM products
        WHERE id = %s
        """,
        [product_id],
    )
    if row is None:
        raise NotFoundError("Product not found")
    return {"data": row}


@router.put("/{product_id}", dependencies=[Depends(require_admin)])
def update_product(product_id: int, payload: ProductUpdate):
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise BadRequestError("No fields to update")

    if updates.get("category_id") is not None:
        category = fetch_one(
            "SELECT id FROM categories WHERE id = %s", [updates["category_id"]]
        )
        if category is None:
            raise NotFoundError("Category not found")

    set_parts: list[str] = []
    values: list = []

    if "category_id" in updates:
        set_parts.append("category_id = %s")
        values.append(updates["category_id"])

    if "name" in updates:
        set_parts.append("name = %s")
        values.append(updates["name"])

    if "slug" in updates:
        set_parts.append("slug = %s")
        values.append(normalize_slug(updates["slug"]))

    if "description" in updates:
        set_parts.append("description = %s")
        values.append(updates["description"])

    if "price" in updates:
        set_parts.append("price = %s")
        values.append(updates["price"])

    if "stock_quantity" in updates:
        set_parts.append("stock_quantity = %s")
        values.append(updates["stock_quantity"])

    if "is_active" in updates:
        set_parts.append("is_active = %s")
        values.append(updates["is_active"])

    try:
        row = fetch_one(
            f"""
            UPDATE products
            SET {', '.join(set_parts)}
            WHERE id = %s
            RETURNING id, category_id, name, slug, description, price, stock_quantity, is_active, created_at, updated_at
            """,
            [*values, product_id],
        )
    except UniqueViolation:
        raise BadRequestError("Product slug must be unique")

    if row is None:
        raise NotFoundError("Product not found")

    return {"data": row}


@router.delete("/{product_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_product(product_id: int):
    row = fetch_one("DELETE FROM products WHERE id = %s RETURNING id", [product_id])
    if row is None:
        raise NotFoundError("Product not found")
    return None
