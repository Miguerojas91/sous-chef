"""
app/core/logging.py

Logging estructurado (JSON) para producción + middleware de request ID.

Cada log incluye:
- timestamp ISO
- level
- message
- logger
- request_id (si la request lo trae en `X-Request-ID` o lo generamos)
- user_id (si está autenticado)
- path, method, status_code (en logs de acceso)

Activado en producción. En dev cae a formato legible.
"""
import json
import logging
import os
import time
import uuid
from contextvars import ContextVar
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Context vars: pobladas por el middleware en cada request.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")
user_id_ctx: ContextVar[str] = ContextVar("user_id", default="")

IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        rid = request_id_ctx.get()
        if rid:
            payload["request_id"] = rid
        uid = user_id_ctx.get()
        if uid:
            payload["user_id"] = uid

        # Extras añadidos vía `logger.info("...", extra={"k": "v"})`
        for k, v in record.__dict__.items():
            if k in ("args", "asctime", "created", "exc_info", "exc_text",
                     "filename", "funcName", "levelname", "levelno", "lineno",
                     "module", "msecs", "message", "msg", "name", "pathname",
                     "process", "processName", "relativeCreated", "stack_info",
                     "thread", "threadName", "taskName"):
                continue
            payload[k] = v

        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> None:
    """Configura el root logger. Llamar una vez al arrancar."""
    root = logging.getLogger()
    # Limpiar handlers existentes (uvicorn los inyecta)
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler()
    if IS_PROD:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s [%(name)s] %(message)s"
        ))
    root.addHandler(handler)
    root.setLevel(os.getenv("LOG_LEVEL", "INFO"))

    # Silenciar sqlalchemy demasiado ruidoso
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


access_logger = logging.getLogger("sous.access")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Asigna `X-Request-ID` (lee el del request o genera uno), lo expone en el
    response, y llena los ContextVars para que el JsonFormatter los incluya
    en cada log emitido durante la request.
    """
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        token_rid = request_id_ctx.set(rid)

        # user_id desde el JWT si viene autenticado (best-effort, sin verificar firma —
        # solo para correlación de logs, no para autorización).
        uid = ""
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            try:
                import jwt as _jwt
                payload = _jwt.decode(
                    auth.split(" ", 1)[1],
                    options={"verify_signature": False, "verify_exp": False},
                )
                uid = str(payload.get("sub", ""))
            except Exception:  # noqa: BLE001
                pass
        token_uid = user_id_ctx.set(uid)

        start = time.perf_counter()
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = rid
            duration_ms = (time.perf_counter() - start) * 1000
            access_logger.info(
                "request",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round(duration_ms, 1),
                },
            )
            return response
        finally:
            request_id_ctx.reset(token_rid)
            user_id_ctx.reset(token_uid)
