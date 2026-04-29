# Admin Service

FastAPI микросервис для управления администраторами и аутентификации через JWT.

## API Endpoints (`/api/auth`)

- `POST /login` — вход с email и паролем
- `POST /refresh` — обновить access token
- `POST /logout` — выход (отзыв всех refresh tokens)
- `GET /me` — текущий профиль админа
- `PATCH /me/email` — изменить email
- `POST /me/change-password` — изменить пароль
- `GET /{admin_id}` — получить профиль админа
- `PATCH /{admin_id}/active` — изменить статус активности

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:4003/health
```

## Логин (default)

```bash
# Email: admin@lampashop.ru
# Password: admin@123

curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lampashop.ru",
    "password": "admin@123"
  }'
```
