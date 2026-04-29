from fastapi import Header
from typing import Optional

from app.auth import verify_token
from app.errors import UnauthorizedError


async def get_current_admin(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to get current admin from token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid authorization header")

    token = authorization[7:]
    payload = verify_token(token)

    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")

    return {"admin_id": payload.get("admin_id")}
