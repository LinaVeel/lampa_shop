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
    port: int = _to_int(os.getenv("PORT"), 4003)
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://lampashop:lampashop@localhost:5432/admin_service_db",
    )
    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", "your-secret-key-change-in-production"
    )
    jwt_algorithm: str = "HS256"
    jwt_access_expiration_minutes: int = 30
    jwt_refresh_expiration_days: int = 7


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
