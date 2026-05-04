"""
backend/main.py

Entrada del API FastAPI de Sous Chef.

Variables de entorno:
- ENVIRONMENT          — 'production' habilita comportamiento estricto.
- ALLOWED_ORIGINS      — CSV de orígenes permitidos para CORS (default: localhost dev).
- JWT_SECRET           — REQUERIDA en producción (ver app/core/security.py).
- DATABASE_URL         — String de conexión async (asyncpg/sqlite+aiosqlite).
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.api import router as api_router
from app.core.database import engine
from app.models import Base, User, Technique, Recipe, UserTechnique  # noqa: F401

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PROD = ENVIRONMENT == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # En producción confiamos en Alembic. Solo creamos tablas en dev/test
    # para acelerar el setup local. En prod, ejecutar `alembic upgrade head`.
    if not IS_PROD:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Sous Chef API",
    description="Real-time AI Culinary Assistant Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — lista blanca configurable por env
default_origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]
env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
origins = env_origins if env_origins else default_origins

if IS_PROD and not env_origins:
    raise RuntimeError(
        "ALLOWED_ORIGINS no configurada en producción. "
        "Define la variable con los dominios del frontend (CSV)."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Sous Chef Backend"}


app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=not IS_PROD)
