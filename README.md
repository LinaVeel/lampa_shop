# Lampashop Microservices

E-commerce backend архитектура на FastAPI + PostgreSQL + Docker.

## Микросервисы

| Сервис | Порт | БД | Описание |
|--------|------|----|-----------| 
| **products_service** | 4001 | products_db (5435) | Каталог товаров, категории, изображения |
| **carts_orders_service** | 4002 | carts_orders_db (5436) | Корзины, заказы, запросы на звонок |
| **admin_service** | 4003 | admin_service_db (5437) | Аутентификация админов, JWT токены |

## Быстрый старт

### Подготовка .env файлов

```bash
cp services/products_service/.env.example services/products_service/.env
cp services/carts_orders_service/.env.example services/carts_orders_service/.env
cp services/admin_service/.env.example services/admin_service/.env
```

### Развертывание с Docker Compose

```bash
# Запустить все сервисы
docker compose up --build -d

# Проверить статус
docker compose ps

# Просмотреть логи
docker compose logs -f
```

### Здоровье сервисов

```bash
curl http://localhost:4001/health  # products_service
curl http://localhost:4002/health  # carts_orders_service
curl http://localhost:4003/health  # admin_service
```

## API Endpoints

### Products Service (`http://localhost:4001/api`)

**Категории:**
- `POST /categories` — создать категорию (админ)
- `GET /categories` — список категорий
- `GET /categories/{id}` — получить категорию
- `PATCH /categories/{id}` — обновить (админ)
- `DELETE /categories/{id}` — удалить (админ)

**Товары:**
- `POST /products` — создать товар (админ)
- `GET /products` — список с поиском и фильтрами
- `GET /products/{id}` — получить товар
- `PUT /products/{id}` — обновить (админ)
- `DELETE /products/{id}` — удалить (админ)

**Изображения:**
- `POST /product-images` — загрузить изображение (админ)
- `GET /product-images` — список изображений
- `GET /product-images/{id}` — получить изображение
- `PUT /product-images/{id}` — обновить (админ)
- `DELETE /product-images/{id}` — удалить (админ)

### Carts & Orders Service (`http://localhost:4002/api`)

**Корзины:**
- `POST /carts` — создать корзину
- `GET /carts/{session_id}` — получить корзину
- `GET /carts/{session_id}/items` — товары в корзине
- `POST /carts/{session_id}/items` — добавить товар
- `PATCH /carts/{session_id}/items/{item_id}` — обновить количество
- `DELETE /carts/{session_id}/items/{item_id}` — удалить товар
- `DELETE /carts/{session_id}/items` — очистить корзину
- `DELETE /carts/{session_id}` — удалить корзину

**Заказы:**
- `POST /orders` — создать заказ из корзины
- `POST /orders/pickup` — создать заказ самовывоза
- `POST /orders/track` — проверить заказ по номеру и телефону
- `GET /orders/session/{session_id}` — заказы по сессии
- `PATCH /orders/{id}/cancel` — отменить заказ
- `PATCH /orders/{id}/status` — обновить статус (админ)
- `DELETE /orders/{id}` — удалить заказ (админ)
- `GET /orders/{id}/items` — товары в заказе
- `POST /orders/{id}/items` — добавить товар (админ)
- `PATCH /orders/{id}/items/{item_id}` — обновить товар (админ)
- `DELETE /orders/{id}/items/{item_id}` — удалить товар (админ)

**Запросы на звонок:**
- `POST /call-requests` — создать запрос
- `GET /call-requests` — список запросов (админ)
- `GET /call-requests/{id}` — получить запрос (админ)
- `PATCH /call-requests/{id}` — обновить статус (админ)
- `DELETE /call-requests/{id}` — удалить (админ)

### Admin Service (`http://localhost:4003/api`)

**Аутентификация:**
- `POST /auth/login` — вход (email + пароль)
- `POST /auth/refresh` — обновить access token
- `POST /auth/logout` — выход
- `GET /auth/me` — текущий профиль
- `PATCH /auth/me/email` — изменить email
- `POST /auth/me/change-password` — изменить пароль
- `GET /auth/{admin_id}` — получить профиль админа
- `PATCH /auth/{admin_id}/active` — изменить статус

## Тестирование

### Products Service

```bash
# Создать категорию
curl -X POST http://localhost:4001/api/categories \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: change-me" \
  -d '{"name":"Electronics","description":"Tech products"}'

# Получить категории
curl http://localhost:4001/api/categories
```

### Carts & Orders Service

```bash
# Создать корзину
curl -X POST http://localhost:4002/api/carts

# Получить корзину (используйте session_id из ответа выше)
curl http://localhost:4002/api/carts/{session_id}
```

### Admin Service

```bash
# Вход (default: admin@lampashop.ru / admin@123)
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lampashop.ru",
    "password": "admin@123"
  }'

# Используйте access_token в последующих запросах
curl http://localhost:4003/api/auth/me \
  -H "Authorization: Bearer {access_token}"
```

## Структура проекта

```
lampashop/
├── docker-compose.yml
├── README.md
└── services/
    ├── products_service/
    │   ├── app/
    │   │   ├── main.py
    │   │   ├── config.py
    │   │   ├── db.py
    │   │   ├── routes/
    │   │   └── ...
    │   ├── migrations/
    │   ├── Dockerfile
    │   └── requirements.txt
    ├── carts_orders_service/
    │   ├── app/
    │   ├── migrations/
    │   └── ...
    └── admin_service/
        ├── app/
        ├── migrations/
        └── ...
```

## Технологический стек

- **Framework**: FastAPI 0.115.6
- **Server**: Uvicorn
- **Database**: PostgreSQL 16
- **ORM/Query**: Raw SQL + psycopg3
- **Auth**: JWT токены (admin_service)
- **Validation**: Pydantic
- **Containerization**: Docker + Docker Compose
- **Python**: 3.12-slim
