from decimal import Decimal

from fastapi import APIRouter, Depends, status

from app import db
from app.deps import require_admin
from app.errors import BadRequestError, NotFoundError
from app.schemas import (
    OrderFromCartCreate,
    PickupOrderCreate,
    OrderTrackRequest,
    OrderStatusUpdateAdmin,
    OrderItemAdminCreate,
    OrderItemAdminUpdate,
    OrderItemResponse,
    OrderResponse,
)

router = APIRouter(prefix="/orders", tags=["orders"])


async def _get_order(order_id: int) -> dict:
    order = await db.fetch_one(
        """
        SELECT id, session_id, recipient_name, recipient_phone, tracking_number,
               delivery_type, delivery_address, pickup_point_id, payment_method,
               payment_status, status, status_updated_at, total_amount, comment,
               created_at, updated_at
        FROM orders
        WHERE id = %s
        """,
        (order_id,),
    )
    if not order:
        raise NotFoundError("Order not found")
    return order


async def _get_cart(session_id: str) -> dict:
    cart = await db.fetch_one(
        "SELECT id FROM carts WHERE session_id = %s",
        (session_id,),
    )
    if not cart:
        raise NotFoundError("Cart not found")
    return cart


async def _recalculate_order_total(order_id: int) -> Decimal:
    items = await db.fetch_all(
        "SELECT quantity, unit_price FROM order_items WHERE order_id = %s",
        (order_id,),
    )
    total = sum(
        (item["quantity"] * item["unit_price"] for item in items), Decimal("0.00")
    )
    await db.execute(
        "UPDATE orders SET total_amount = %s WHERE id = %s",
        (total, order_id),
    )
    return total


async def _insert_order_items(order_id: int, cart_items: list[dict]) -> None:
    for item in cart_items:
        await db.execute(
            """
            INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                order_id,
                item["product_id"],
                item["product_name"],
                item["quantity"],
                item["price_snapshot"],
            ),
        )


async def _create_order_from_cart(
    session_id: str,
    recipient_name: str,
    recipient_phone: str,
    delivery_type: str,
    payment_method: str,
    delivery_address: str | None = None,
    pickup_point_id: int | None = None,
    comment: str | None = None,
) -> dict:
    cart = await _get_cart(session_id)
    cart_items = await db.fetch_all(
        """
        SELECT product_id, product_name, quantity, price_snapshot
        FROM cart_items
        WHERE cart_id = %s
        ORDER BY id
        """,
        (cart["id"],),
    )

    if not cart_items:
        raise BadRequestError("Cart is empty")

    total_amount = sum(
        (item["quantity"] * item["price_snapshot"] for item in cart_items),
        Decimal("0.00"),
    )

    order = await db.fetch_one(
        """
        INSERT INTO orders (
            session_id, recipient_name, recipient_phone, delivery_type, delivery_address,
            pickup_point_id, payment_method, total_amount, comment
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, session_id, recipient_name, recipient_phone, tracking_number,
                  delivery_type, delivery_address, pickup_point_id, payment_method,
                  payment_status, status, status_updated_at, total_amount, comment,
                  created_at, updated_at
        """,
        (
            session_id,
            recipient_name,
            recipient_phone,
            delivery_type,
            delivery_address,
            pickup_point_id,
            payment_method,
            total_amount,
            comment,
        ),
    )

    if not order:
        raise BadRequestError("Failed to create order")

    await _insert_order_items(order["id"], cart_items)
    await db.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart["id"],))

    order["total_amount"] = total_amount
    return await _get_order(order["id"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderFromCartCreate) -> dict:
    if payload.delivery_type != "delivery":
        raise BadRequestError("Use the pickup endpoint for pickup orders")
    return await _create_order_from_cart(
        session_id=payload.session_id,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        delivery_type=payload.delivery_type,
        payment_method=payload.payment_method,
        delivery_address=payload.delivery_address,
        comment=payload.comment,
    )


@router.post("/pickup", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_pickup_order(payload: PickupOrderCreate) -> dict:
    return await _create_order_from_cart(
        session_id=payload.session_id,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        delivery_type="pickup",
        payment_method=payload.payment_method,
        pickup_point_id=payload.pickup_point_id,
        comment=payload.comment,
    )


@router.post("/track", response_model=OrderResponse)
async def track_order(payload: OrderTrackRequest) -> dict:
    order = await db.fetch_one(
        """
        SELECT id, session_id, recipient_name, recipient_phone, tracking_number,
               delivery_type, delivery_address, pickup_point_id, payment_method,
               payment_status, status, status_updated_at, total_amount, comment,
               created_at, updated_at
        FROM orders
        WHERE id = %s AND recipient_phone = %s
        """,
        (payload.order_id, payload.recipient_phone),
    )
    if not order:
        raise NotFoundError("Order not found")
    return order


@router.get("/session/{session_id}", response_model=list[OrderResponse])
async def get_orders_by_session(session_id: str) -> list[dict]:
    return await db.fetch_all(
        """
        SELECT id, session_id, recipient_name, recipient_phone, tracking_number,
               delivery_type, delivery_address, pickup_point_id, payment_method,
               payment_status, status, status_updated_at, total_amount, comment,
               created_at, updated_at
        FROM orders
        WHERE session_id = %s
        ORDER BY created_at DESC
        """,
        (session_id,),
    )


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: int) -> dict:
    order = await _get_order(order_id)
    if order["status"] != "pending":
        raise BadRequestError("Only pending orders can be cancelled")

    await db.execute(
        "UPDATE orders SET status = %s WHERE id = %s",
        ("cancelled", order_id),
    )
    return await _get_order(order_id)


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    dependencies=[Depends(require_admin)],
)
async def update_order_status_admin(
    order_id: int, payload: OrderStatusUpdateAdmin
) -> dict:
    if payload.status == "shipped" and not payload.tracking_number:
        raise BadRequestError("tracking_number is required when status is shipped")

    await _get_order(order_id)
    updates = ["status = %s"]
    values: list = [payload.status]

    if payload.status == "shipped":
        updates.append("tracking_number = %s")
        values.append(payload.tracking_number)

    await db.execute(
        f"UPDATE orders SET {', '.join(updates)} WHERE id = %s",
        (*values, order_id),
    )
    return await _get_order(order_id)


@router.delete("/{order_id}", dependencies=[Depends(require_admin)])
async def delete_order_admin(order_id: int) -> dict:
    order = await _get_order(order_id)
    await db.execute("DELETE FROM orders WHERE id = %s", (order_id,))
    return {"id": order["id"]}


@router.get("/{order_id}/items", response_model=list[OrderItemResponse])
async def get_order_items(order_id: int) -> list[dict]:
    await _get_order(order_id)
    return await db.fetch_all(
        """
        SELECT id, order_id, product_id, product_name, quantity, unit_price
        FROM order_items
        WHERE order_id = %s
        ORDER BY id
        """,
        (order_id,),
    )


@router.post(
    "/{order_id}/items",
    response_model=OrderItemResponse,
    dependencies=[Depends(require_admin)],
)
async def add_order_item_admin(order_id: int, payload: OrderItemAdminCreate) -> dict:
    await _get_order(order_id)
    item = await db.fetch_one(
        """
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, order_id, product_id, product_name, quantity, unit_price
        """,
        (
            order_id,
            payload.product_id,
            payload.product_name,
            payload.quantity,
            payload.unit_price,
        ),
    )
    if not item:
        raise BadRequestError("Failed to add order item")
    await _recalculate_order_total(order_id)
    return item


@router.patch(
    "/{order_id}/items/{item_id}",
    response_model=OrderItemResponse,
    dependencies=[Depends(require_admin)],
)
async def update_order_item_admin(
    order_id: int, item_id: int, payload: OrderItemAdminUpdate
) -> dict:
    await _get_order(order_id)
    current = await db.fetch_one(
        "SELECT id FROM order_items WHERE id = %s AND order_id = %s",
        (item_id, order_id),
    )
    if not current:
        raise NotFoundError("Order item not found")

    updates: list[str] = []
    values: list = []

    if payload.product_name is not None:
        updates.append("product_name = %s")
        values.append(payload.product_name)
    if payload.quantity is not None:
        updates.append("quantity = %s")
        values.append(payload.quantity)
    if payload.unit_price is not None:
        updates.append("unit_price = %s")
        values.append(payload.unit_price)

    if not updates:
        raise BadRequestError("No fields to update")

    values.append(item_id)
    await db.execute(
        f"UPDATE order_items SET {', '.join(updates)} WHERE id = %s",
        tuple(values),
    )
    await _recalculate_order_total(order_id)
    item = await db.fetch_one(
        """
        SELECT id, order_id, product_id, product_name, quantity, unit_price
        FROM order_items
        WHERE id = %s
        """,
        (item_id,),
    )
    if not item:
        raise NotFoundError("Order item not found")
    return item


@router.delete(
    "/{order_id}/items/{item_id}",
    dependencies=[Depends(require_admin)],
)
async def delete_order_item_admin(order_id: int, item_id: int) -> dict:
    await _get_order(order_id)
    current = await db.fetch_one(
        "SELECT id FROM order_items WHERE id = %s AND order_id = %s",
        (item_id, order_id),
    )
    if not current:
        raise NotFoundError("Order item not found")

    await db.execute("DELETE FROM order_items WHERE id = %s", (item_id,))
    await _recalculate_order_total(order_id)
    return {"id": item_id}
