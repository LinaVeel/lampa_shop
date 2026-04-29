from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import db
from app.config import settings
from app.migrate import run as run_migrations
from app.routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.init_pool(settings.database_url)
    await db.open_pool()
    run_migrations()
    yield
    # Shutdown
    await db.close_pool()


app = FastAPI(
    title="Lampashop Admin Service",
    description="Microservice for admin authentication and management",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {"ok": True, "service": "admin_service"}


# Include routers
app.include_router(auth.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=False,
    )
