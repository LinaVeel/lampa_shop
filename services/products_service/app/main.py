from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from psycopg import IntegrityError

from app.db import pool
from app.routes.categories import router as categories_router
from app.routes.product_images import router as product_images_router
from app.routes.products import router as products_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    pool.open(wait=True)
    try:
        yield
    finally:
        pool.close()


app = FastAPI(title="products_service", lifespan=lifespan)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(_request, _exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Conflict: unique or integrity constraint failed"},
    )


@app.get("/health")
def healthcheck():
    return {"ok": True, "service": "products_service"}


app.include_router(categories_router)
app.include_router(products_router)
app.include_router(product_images_router)
