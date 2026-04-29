# Carts & Orders Service

FastAPI микросервис для управления корзинами, заказами и запросами на звонок.

## API Endpoints

### Корзины (`/api/carts`)
- `POST /` — создать корзину
- `GET /{session_id}` — получить корзину по session_id
- `GET /{session_id}/items` — список товаров в корзине
- `POST /{session_id}/items` — добавить товар в корзину
- `PATCH /{session_id}/items/{item_id}` — обновить количество товара
- `DELETE /{session_id}/items/{item_id}` — удалить товар из корзины
- `DELETE /{session_id}/items` — очистить корзину
- `DELETE /{session_id}` — удалить корзину

### Заказы (`/api/orders`)
- `POST /` — создать заказ из корзины
- `POST /pickup` — создать заказ самовывоза
- `POST /track` — проверить заказ по номеру и телефону
- `GET /session/{session_id}` — заказы по сессии
- `PATCH /{order_id}/cancel` — отменить заказ
- `PATCH /{order_id}/status` — обновить статус (админ)
- `DELETE /{order_id}` — удалить заказ (админ)
- `GET /{order_id}/items` — товары в заказе
- `POST /{order_id}/items` — добавить товар в заказ (админ)
- `PATCH /{order_id}/items/{item_id}` — обновить товар в заказе (админ)
- `DELETE /{order_id}/items/{item_id}` — удалить товар из заказа (админ)

### Запросы на звонок (`/api/call-requests`)
- `POST /` — создать запрос
- `GET /` — список запросов (админ)
- `GET /{request_id}` — получить запрос (админ)
- `PATCH /{request_id}` — обновить (админ)
- `DELETE /{request_id}` — удалить (админ)

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:4002/health
```
