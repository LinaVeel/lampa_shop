from fastapi import Header
from typing import Optional

from app.config import settings
from app.errors import UnauthorizedError


async def require_admin(
    x_admin_api_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
) -> bool:
    """Dependency to check admin API key."""
    token = x_admin_api_key

    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]

    if not token or token != settings.admin_api_key:
        raise UnauthorizedError("Invalid or missing admin API key")

    return True
