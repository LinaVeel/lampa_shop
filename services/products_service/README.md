# products_service

Products catalog microservice for Lampashop.

## Features

- Categories CRUD
- Products CRUD with full-text search
- Product images CRUD
- FastAPI + PostgreSQL + Docker
- Simple admin guard via `x-admin-api-key` or `Authorization: Bearer <key>`

## Run in Docker

1. Copy env file:

```bash
cp .env.example .env
```

2. From repository root build and run:

```bash
docker compose up --build -d
```

3. Check service health:

```bash
curl http://localhost:4001/health
```

The container automatically runs migration `migrations/001_init.sql` on startup.

## Run without Docker

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.migrate
uvicorn app.main:app --host 0.0.0.0 --port 4001 --reload
```

## Base URL

`http://localhost:4001/api`

## Endpoints

- Categories: `/categories`
- Products: `/products`
- Product images: `/product-images`
