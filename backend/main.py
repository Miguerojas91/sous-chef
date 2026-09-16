"""
backend/main.py

Entrada del API FastAPI de Sous Chef.

Variables de entorno:
- ENVIRONMENT          — 'production' habilita comportamiento estricto.
- ALLOWED_ORIGINS      — CSV de orígenes permitidos para CORS.
- JWT_SECRET           — REQUERIDA en producción.
- DATABASE_URL         — String de conexión async (asyncpg/sqlite+aiosqlite).
- RATE_LIMIT_REDIS     — (Opcional) URI de Redis para rate limit compartido.
- SENTRY_DSN           — (Opcional) Activar reporte de errores a Sentry.
- LOG_LEVEL            — (Opcional) DEBUG/INFO/WARNING (default INFO).
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

load_dotenv()

# ── Logging y observabilidad (antes de importar el resto) ─────────────────────
from app.core.logging import configure_logging, RequestContextMiddleware
configure_logging()

from app.core.observability import init_sentry
init_sentry()

from app.api import router as api_router
from app.core.database import engine
from app.core.rate_limit import limiter
from app.core.security_headers import SecurityHeadersMiddleware

logger = logging.getLogger("sous")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PROD = ENVIRONMENT == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", extra={"env": ENVIRONMENT})
    yield
    logger.info("shutdown")


app = FastAPI(
    title="Sous Chef API",
    description="Real-time AI Culinary Assistant Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ── Orden de middlewares (Starlette ejecuta del último al primero por dispatch) ─
# El primero que añadimos será el más cercano a la app (corre LAST en request,
# FIRST en response). Por eso seguimos este orden:
# 1. RequestContextMiddleware  → asigna request_id, debe correr antes que todo
# 2. SecurityHeadersMiddleware → añade headers a la response
# 3. SlowAPIMiddleware         → cuenta hits hacia el rate limit
# 4. CORSMiddleware            → último (más afuera) para que maneje OPTIONS

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SlowAPIMiddleware)

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
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


# ── Health checks ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health_basic():
    """Liveness — el proceso responde."""
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    """Readiness — el proceso puede atender tráfico (DB accesible)."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:  # noqa: BLE001
        logger.exception("readiness check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "db": "error", "detail": str(e)[:200]},
        )


app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=not IS_PROD)
