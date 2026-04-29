import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


def _to_int(value: Optional[str], default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


class Settings:
    port: int = _to_int(os.getenv("PORT"), 4002)
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://lampashop:lampashop@localhost:5432/carts_orders_db",
    )
    admin_api_key: str = os.getenv("ADMIN_API_KEY", "change-me")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
