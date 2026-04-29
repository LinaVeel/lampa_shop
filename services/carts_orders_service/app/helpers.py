def build_pagination(page: int, limit: int) -> tuple[int, int]:
    """Calculate offset and limit from page number."""
    offset = (page - 1) * limit
    return offset, limit


def build_pagination_response(items: list, total: int, page: int, limit: int) -> dict:
    """Build pagination response."""
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
    }
