from typing import Any, Dict, List, Optional

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

pool: Optional[AsyncConnectionPool] = None


def init_pool(database_url: str) -> None:
    global pool
    pool = AsyncConnectionPool(database_url, open=False)


async def open_pool() -> None:
    if pool:
        await pool.open()


async def close_pool() -> None:
    if pool:
        await pool.close()


async def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, params)
            rows = await cur.fetchall()
            return [dict(row) for row in rows]


async def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, params)
            row = await cur.fetchone()
            return dict(row) if row else None


async def execute(query: str, params: tuple = ()) -> int:
    """Execute query and return number of affected rows."""
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            await conn.commit()
            return cur.rowcount
