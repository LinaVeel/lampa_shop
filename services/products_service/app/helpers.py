import re
from typing import Any

from app.errors import BadRequestError


_slug_re = re.compile(r"[^a-z0-9-]+")
_dash_re = re.compile(r"-+")


def normalize_slug(value: str) -> str:
    slug = value.strip().lower().replace("_", "-").replace(" ", "-")
    slug = _slug_re.sub("-", slug)
    slug = _dash_re.sub("-", slug).strip("-")
    if not slug:
        raise BadRequestError("Slug cannot be empty")
    return slug


def build_pagination(page: int, limit: int) -> tuple[int, int]:
    return page, (page - 1) * limit


def to_int(value: Any, default: int) -> int:
    if value is None:
        return default
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        return default
