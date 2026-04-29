from fastapi import APIRouter, Depends, Query

from app.db import fetch_all, fetch_one
from app.deps import require_admin
from app.errors import BadRequestError, NotFoundError
from app.helpers import build_pagination
from app.schemas import ProductImageCreate, ProductImageUpdate

router = APIRouter(prefix="/api/product-images", tags=["Product Images"])


@router.post("/", dependencies=[Depends(require_admin)], status_code=201)
def create_product_image(payload: ProductImageCreate):
    product = fetch_one("SELECT id FROM products WHERE id = %s", [payload.product_id])
    if product is None:
        raise NotFoundError("Product not found")

    row = fetch_one(
        """
        INSERT INTO product_images (product_id, url, is_main, sort_order)
        VALUES (%s, %s, %s, %s)
        RETURNING id, product_id, url, is_main, sort_order
        """,
        [payload.product_id, str(payload.url), payload.is_main, payload.sort_order],
    )
    return {"data": row}


@router.get("/")
def get_product_images(
    product_id: int | None = Query(default=None, gt=0),
    page: int = Query(default=1, gt=0),
    limit: int = Query(default=20, gt=0, le=100),
):
    page, offset = build_pagination(page, limit)

    where_parts: list[str] = []
    values: list = []

    if product_id is not None:
        where_parts.append("product_id = %s")
        values.append(product_id)

    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

    total_row = fetch_one(
        f"SELECT COUNT(*)::int AS total FROM product_images {where_clause}", values
    )
    rows = fetch_all(
        f"""
        SELECT id, product_id, url, is_main, sort_order
        FROM product_images
        {where_clause}
        ORDER BY sort_order ASC, id DESC
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


@router.get("/{image_id}")
def get_product_image_by_id(image_id: int):
    row = fetch_one(
        "SELECT id, product_id, url, is_main, sort_order FROM product_images WHERE id = %s",
        [image_id],
    )
    if row is None:
        raise NotFoundError("Product image not found")
    return {"data": row}


@router.put("/{image_id}", dependencies=[Depends(require_admin)])
def update_product_image(image_id: int, payload: ProductImageUpdate):
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise BadRequestError("No fields to update")

    if updates.get("product_id") is not None:
        product = fetch_one(
            "SELECT id FROM products WHERE id = %s", [updates["product_id"]]
        )
        if product is None:
            raise NotFoundError("Product not found")

    set_parts: list[str] = []
    values: list = []

    if "product_id" in updates:
        set_parts.append("product_id = %s")
        values.append(updates["product_id"])

    if "url" in updates:
        set_parts.append("url = %s")
        values.append(str(updates["url"]))

    if "is_main" in updates:
        set_parts.append("is_main = %s")
        values.append(updates["is_main"])

    if "sort_order" in updates:
        set_parts.append("sort_order = %s")
        values.append(updates["sort_order"])

    row = fetch_one(
        f"""
        UPDATE product_images
        SET {', '.join(set_parts)}
        WHERE id = %s
        RETURNING id, product_id, url, is_main, sort_order
        """,
        [*values, image_id],
    )

    if row is None:
        raise NotFoundError("Product image not found")

    return {"data": row}


@router.delete("/{image_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_product_image(image_id: int):
    row = fetch_one("DELETE FROM product_images WHERE id = %s RETURNING id", [image_id])
    if row is None:
        raise NotFoundError("Product image not found")
    return None
