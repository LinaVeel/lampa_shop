from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import settings

pool = ConnectionPool(conninfo=settings.database_url, open=False)


def fetch_all(
    sql: str, params: list[Any] | tuple[Any, ...] | None = None
) -> list[dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params or [])
            rows = cur.fetchall()
            return [dict(row) for row in rows]


def fetch_one(
    sql: str, params: list[Any] | tuple[Any, ...] | None = None
) -> dict[str, Any] | None:
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params or [])
            row = cur.fetchone()
            return dict(row) if row else None


def execute(sql: str, params: list[Any] | tuple[Any, ...] | None = None) -> None:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or [])
        conn.commit()
