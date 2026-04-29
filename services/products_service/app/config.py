import os
from dotenv import load_dotenv

load_dotenv()


def _to_int(value: str | None, fallback: int) -> int:
    if value is None:
        return fallback
    try:
        return int(value)
    except ValueError:
        return fallback


class Settings:
    port: int = _to_int(os.getenv("PORT"), 4001)
    database_url: str = os.getenv("DATABASE_URL", "")
    admin_api_key: str = os.getenv("ADMIN_API_KEY", "")


settings = Settings()

if not settings.database_url:
    raise RuntimeError("DATABASE_URL is required")

if not settings.admin_api_key:
    raise RuntimeError("ADMIN_API_KEY is required")
