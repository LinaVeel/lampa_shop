from fastapi import APIRouter, Depends, Query
from psycopg.errors import UniqueViolation

from app.db import fetch_all, fetch_one
from app.deps import require_admin
from app.errors import BadRequestError, NotFoundError
from app.helpers import build_pagination, normalize_slug
from app.schemas import CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.post("/", dependencies=[Depends(require_admin)])
def create_category(payload: CategoryCreate):
    if payload.parent_id is not None:
        parent = fetch_one(
            "SELECT id FROM categories WHERE id = %s", [payload.parent_id]
        )
        if parent is None:
            raise NotFoundError("Parent category not found")

    try:
        row = fetch_one(
            """
            INSERT INTO categories (name, slug, parent_id)
            VALUES (%s, %s, %s)
            RETURNING id, name, slug, parent_id, created_at
            """,
            [payload.name, normalize_slug(payload.slug), payload.parent_id],
        )
    except UniqueViolation:
        raise BadRequestError("Category slug must be unique")

    return {"data": row}


@router.get("/")
def get_categories(
    parent_id: int | None = Query(default=None, gt=0),
    page: int = Query(default=1, gt=0),
    limit: int = Query(default=20, gt=0, le=100),
):
    page, offset = build_pagination(page, limit)

    where_parts: list[str] = []
    values: list = []

    if parent_id is not None:
        where_parts.append("parent_id = %s")
        values.append(parent_id)

    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

    total_row = fetch_one(
        f"SELECT COUNT(*)::int AS total FROM categories {where_clause}", values
    )
    rows = fetch_all(
        f"""
        SELECT id, name, slug, parent_id, created_at
        FROM categories
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


@router.get("/{category_id}")
def get_category_by_id(category_id: int):
    row = fetch_one(
        "SELECT id, name, slug, parent_id, created_at FROM categories WHERE id = %s",
        [category_id],
    )
    if row is None:
        raise NotFoundError("Category not found")
    return {"data": row}


@router.patch("/{category_id}", dependencies=[Depends(require_admin)])
def update_category(category_id: int, payload: CategoryUpdate):
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise BadRequestError("No fields to update")

    if updates.get("parent_id") == category_id:
        raise BadRequestError("Category cannot be parent of itself")

    if updates.get("parent_id") is not None:
        parent = fetch_one(
            "SELECT id FROM categories WHERE id = %s", [updates["parent_id"]]
        )
        if parent is None:
            raise NotFoundError("Parent category not found")

    set_parts: list[str] = []
    values: list = []

    if "name" in updates:
        set_parts.append("name = %s")
        values.append(updates["name"])

    if "slug" in updates:
        set_parts.append("slug = %s")
        values.append(normalize_slug(updates["slug"]))

    if "parent_id" in updates:
        set_parts.append("parent_id = %s")
        values.append(updates["parent_id"])

    try:
        row = fetch_one(
            f"""
            UPDATE categories
            SET {', '.join(set_parts)}
            WHERE id = %s
            RETURNING id, name, slug, parent_id, created_at
            """,
            [*values, category_id],
        )
    except UniqueViolation:
        raise BadRequestError("Category slug must be unique")

    if row is None:
        raise NotFoundError("Category not found")

    return {"data": row}


@router.delete("/{category_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_category(category_id: int):
    row = fetch_one("DELETE FROM categories WHERE id = %s RETURNING id", [category_id])
    if row is None:
        raise NotFoundError("Category not found")
    return None
