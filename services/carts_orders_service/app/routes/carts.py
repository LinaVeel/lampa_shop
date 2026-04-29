import uuid

from fastapi import APIRouter

from app import db
from app.errors import BadRequestError, NotFoundError
from app.schemas import CartItemCreate, CartItemResponse, CartItemUpdate, CartResponse

router = APIRouter(prefix="/carts", tags=["carts"])


async def _get_cart(session_id: str) -> dict:
    cart = await db.fetch_one(
        "SELECT id, session_id, created_at, updated_at FROM carts WHERE session_id = %s",
        (session_id,),
    )
    if not cart:
        raise NotFoundError("Cart not found")
    return cart


async def _get_cart_item(session_id: str, item_id: int) -> dict:
    cart = await _get_cart(session_id)
    item = await db.fetch_one(
        """
        SELECT id, cart_id, product_id, product_name, price_snapshot, quantity
        FROM cart_items
        WHERE id = %s AND cart_id = %s
        """,
        (item_id, cart["id"]),
    )
    if not item:
        raise NotFoundError("Cart item not found")
    return item


@router.post("", response_model=CartResponse)
async def create_cart() -> dict:
    session_id = str(uuid.uuid4())
    cart = await db.fetch_one(
        """
        INSERT INTO carts (session_id)
        VALUES (%s)
        RETURNING id, session_id, created_at, updated_at
        """,
        (session_id,),
    )
    if not cart:
        raise BadRequestError("Failed to create cart")
    return cart


@router.get("/{session_id}", response_model=CartResponse)
async def get_cart(session_id: str) -> dict:
    return await _get_cart(session_id)


@router.delete("/{session_id}")
async def delete_cart(session_id: str) -> dict:
    cart = await _get_cart(session_id)
    await db.execute("DELETE FROM carts WHERE id = %s", (cart["id"],))
    return {"id": cart["id"], "session_id": session_id}


@router.get("/{session_id}/items", response_model=list[CartItemResponse])
async def get_cart_items(session_id: str) -> list[dict]:
    cart = await _get_cart(session_id)
    return await db.fetch_all(
        """
        SELECT id, cart_id, product_id, product_name, price_snapshot, quantity
        FROM cart_items
        WHERE cart_id = %s
        ORDER BY id
        """,
        (cart["id"],),
    )


@router.post("/{session_id}/items", response_model=CartItemResponse)
async def add_cart_item(session_id: str, payload: CartItemCreate) -> dict:
    cart = await _get_cart(session_id)
    existing = await db.fetch_one(
        "SELECT id FROM cart_items WHERE cart_id = %s AND product_id = %s",
        (cart["id"], payload.product_id),
    )

    if existing:
        await db.execute(
            "UPDATE cart_items SET quantity = quantity + %s WHERE id = %s",
            (payload.quantity, existing["id"]),
        )
        item = await db.fetch_one(
            """
            SELECT id, cart_id, product_id, product_name, price_snapshot, quantity
            FROM cart_items
            WHERE id = %s
            """,
            (existing["id"],),
        )
    else:
        item = await db.fetch_one(
            """
            INSERT INTO cart_items (cart_id, product_id, product_name, price_snapshot, quantity)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, cart_id, product_id, product_name, price_snapshot, quantity
            """,
            (
                cart["id"],
                payload.product_id,
                payload.product_name,
                payload.price_snapshot,
                payload.quantity,
            ),
        )

    if not item:
        raise BadRequestError("Failed to add cart item")
    return item


@router.patch("/{session_id}/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    session_id: str, item_id: int, payload: CartItemUpdate
) -> dict:
    await _get_cart_item(session_id, item_id)
    await db.execute(
        "UPDATE cart_items SET quantity = %s WHERE id = %s",
        (payload.quantity, item_id),
    )
    item = await db.fetch_one(
        """
        SELECT id, cart_id, product_id, product_name, price_snapshot, quantity
        FROM cart_items
        WHERE id = %s
        """,
        (item_id,),
    )
    if not item:
        raise NotFoundError("Cart item not found")
    return item


@router.delete("/{session_id}/items/{item_id}")
async def delete_cart_item(session_id: str, item_id: int) -> dict:
    await _get_cart_item(session_id, item_id)
    await db.execute("DELETE FROM cart_items WHERE id = %s", (item_id,))
    return {"id": item_id}


@router.delete("/{session_id}/items")
async def clear_cart(session_id: str) -> dict:
    cart = await _get_cart(session_id)
    await db.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart["id"],))
    return {"session_id": session_id}
