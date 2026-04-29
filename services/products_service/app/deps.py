from fastapi import Header

from app.config import settings
from app.errors import UnauthorizedError


def require_admin(
    x_admin_api_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> None:
    token = x_admin_api_key

    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if token != settings.admin_api_key:
        raise UnauthorizedError()
