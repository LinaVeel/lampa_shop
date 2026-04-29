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
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchall()


async def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchone()


async def execute(query: str, params: tuple = ()) -> int:
    """Execute query and return number of affected rows."""
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            await conn.commit()
            return cur.rowcount
