from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field


# Cart schemas
class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=255)
    price_snapshot: Decimal = Field(ge=0)
    quantity: int = Field(gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    name: str
    price_snapshot: Decimal
    quantity: int


class CartResponse(BaseModel):
    from datetime import datetime
    from decimal import Decimal
    from typing import Optional, Literal
    from pydantic import BaseModel, Field

    class CartCreateResponse(BaseModel):
        id: int
        session_id: str
        created_at: datetime
        updated_at: datetime

    class CartItemCreate(BaseModel):
        product_id: int = Field(gt=0)
        product_name: str = Field(min_length=1, max_length=255)
        price_snapshot: Decimal = Field(ge=0)
        quantity: int = Field(gt=0, default=1)

    class CartItemUpdate(BaseModel):
        quantity: int = Field(gt=0)

    class CartItemResponse(BaseModel):
        id: int
        cart_id: int
        product_id: int
        product_name: str
        price_snapshot: Decimal
        quantity: int

    class CartResponse(BaseModel):
        id: int
        session_id: str
        created_at: datetime
        updated_at: datetime

    class OrderFromCartCreate(BaseModel):
        session_id: str = Field(min_length=1, max_length=64)
        recipient_name: str = Field(min_length=1, max_length=150)
        recipient_phone: str = Field(min_length=1, max_length=30)
        delivery_type: Literal["delivery"]
        delivery_address: str = Field(min_length=1)
        payment_method: Literal["card_online", "cash_on_delivery"]
        comment: Optional[str] = None

    class PickupOrderCreate(BaseModel):
        session_id: str = Field(min_length=1, max_length=64)
        recipient_name: str = Field(min_length=1, max_length=150)
        recipient_phone: str = Field(min_length=1, max_length=30)
        pickup_point_id: int = Field(gt=0)
        payment_method: Literal["card_online", "cash_on_delivery"]
        comment: Optional[str] = None

    class OrderTrackRequest(BaseModel):
        order_id: int = Field(gt=0)
        recipient_phone: str = Field(min_length=1, max_length=30)

    class OrderStatusUpdateAdmin(BaseModel):
        status: Literal[
            "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"
        ]
        tracking_number: Optional[str] = Field(default=None, max_length=100)

    class OrderItemAdminCreate(BaseModel):
        product_id: int = Field(gt=0)
        product_name: str = Field(min_length=1, max_length=255)
        quantity: int = Field(gt=0, default=1)
        unit_price: Decimal = Field(ge=0)

    class OrderItemAdminUpdate(BaseModel):
        product_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
        quantity: Optional[int] = Field(default=None, gt=0)
        unit_price: Optional[Decimal] = Field(default=None, ge=0)

    class OrderItemResponse(BaseModel):
        id: int
        order_id: int
        product_id: int
        product_name: str
        quantity: int
        unit_price: Decimal

    class OrderResponse(BaseModel):
        id: int
        session_id: str
        recipient_name: str
        recipient_phone: str
        tracking_number: Optional[str]
        delivery_type: str
        delivery_address: Optional[str]
        pickup_point_id: Optional[int]
        payment_method: str
        payment_status: str
        status: str
        status_updated_at: datetime
        total_amount: Decimal
        comment: Optional[str]
        created_at: datetime
        updated_at: datetime

    class CallRequestCreate(BaseModel):
        session_id: Optional[str] = Field(default=None, max_length=64)
        name: str = Field(min_length=1, max_length=150)
        phone: str = Field(min_length=1, max_length=30)
        comment: Optional[str] = None

    class CallRequestUpdate(BaseModel):
        status: Literal["new", "in_progress", "done", "cancelled"]

    class CallRequestResponse(BaseModel):
        id: int
        session_id: Optional[str]
        name: str
        phone: str
        comment: Optional[str]
        status: str
        created_at: datetime
        processed_at: Optional[datetime]
