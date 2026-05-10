# Lampashop — магазин лампочек

Полнофункциональная система с микросервисной архитектурой: React фронтенд + FastAPI микросервисы + PostgreSQL БД.

**Ключевые особенности:**
-  **Модульный дизайн** — React компоненты с CSS Modules
-  **Микросервисы** — разделение ответственности (товары, заказы, админка)
-  **Docker Compose** — одна команда для развертывания всего стека
-  **Vite сборка** — быстрая разработка 

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

---

##  Требования

Перед запуском убедитесь, что установлены:

- **Node.js** 16+ (для фронтенда)
- **Docker** и **Docker Compose** (для микросервисов и БД)
- **Git** (для клонирования проекта)

---

## Быстрый старт

### 1 Клонируем проект к себе

```bash
# Клонируем репозиторий
git clone https://github.com/LinaVeel/lampa_shop lampashop
cd lampashop
```

### 2 Запускаем микросервисы и БД (Docker Compose)

```bash
# Запускаем все сервисы в фоне
docker compose up --build -d

# Проверяем статус контейнеров
docker compose ps

# Смотрим логи (если нужно отладить)
docker compose logs -f
```

Сервисы поднимутся на портах:
- **products_service** → http://localhost:4001
- **carts_orders_service** → http://localhost:4002  
- **admin_service** → http://localhost:4003

### 3 Запускаем фронтенд

```bash
# Переходим в папку фронтенда
cd frontend

# Устанавливаем зависимости (один раз)
npm install

# Запускаем dev сервер
npm run dev
```

Открываем в браузере → **http://localhost:5173**

---

##  Архитектура проекта

```
lampashop/
├── frontend/                    # React приложение (Vite)
│   ├── src/
│   │   ├── pages/              # Страницы (Catalog, Cart, Checkout, etc.)
│   │   ├── components/         # React компоненты
│   │   ├── features/           # Redux слайсы (cart, orders, products)
│   │   ├── api/                # API клиент
│   │   ├── styles/             # CSS Modules
│   │   ├── mock/               # Fallback данные (для offline режима)
│   │   └── store/              # Redux store + selectors
│   ├── package.json
│   └── vite.config.js
│
├── services/                    # FastAPI микросервисы
│   ├── products_service/       #  Товары, категории
│   ├── carts_orders_service/   #  Корзины, заказы, звонки
│   └── admin_service/          #  Аутентификация, админка
│
├── docker-compose.yml          # Оркестрация контейнеров
└── README.md
```

---

##  Основные страницы

| Страница | URL | Описание |
|----------|-----|---------|
| **Каталог** | `/catalog` | Список товаров с фильтрами и поиском |
| **Товар** | `/product/:id` | Детальная информация о товаре |
| **Корзина** | `/cart` | Список товаров в корзине |
| **Оформление** | `/checkout` | Форма для оформления заказа |
| **Подтверждение** | `/confirmation` | Статус заказа + копирование номера |
| **Отслеживание** | `/catalog#track-order` | Поиск заказа по номеру и телефону |

---

##  Микросервисы

### Products Service (4001)
```bash
curl http://localhost:4001/api/products     # Список товаров
curl http://localhost:4001/api/categories   # Категории
curl http://localhost:4001/health           # Проверка здоровья
```

### Carts & Orders Service (4002)
```bash
curl http://localhost:4002/api/carts        # Работа с корзинами
curl http://localhost:4002/api/orders       # Работа с заказами
curl http://localhost:4002/api/callbacks    # Запросы на звонок
curl http://localhost:4002/health           # Проверка здоровья
```

### Admin Service (4003)
```bash
curl http://localhost:4003/health           # Проверка здоровья
```

---

##  БД структура

**Products DB** (localhost:5435)
- `categories` — категории товаров
- `products` — товары
- `product_images` — изображения товаров

**Carts/Orders DB** (localhost:5436)
- `sessions` — сессии пользователей
- `carts` — содержимое корзин
- `orders` — заказы
- `order_items` — товары в заказе
- `call_requests` — запросы на звонок

**Admin DB** (localhost:5437)
- `users` — админы

---

##  Переменные окружения

Примеры файлов находятся в каждом сервисе (`.env.example`).

**Frontend** (в `frontend/` нет .env, конфиг в коде):
```javascript
// API базовые URL:
// http://localhost:4001 — products
// http://localhost:4002 — orders & carts
```

**Backend сервисы:**
- DATABASE_URL
- SECRET_KEY
- DEBUG (true/false)

---

##  Решение проблем

### ❌ "Failed to fetch" при открытии каталога
→ Проверьте, что `docker compose ps` показывает все контейнеры как `Up`
→ Приложение автоматически переключится на mock данные

### ❌ Порты уже заняты
```bash
# Остановите конфликтующий контейнер
docker compose down
# или измените порты в docker-compose.yml
```

### ❌ БД не инициализируется
```bash
# Перестройте с чистой базой
docker compose down -v
docker compose up --build -d
```


---

## 

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

```

