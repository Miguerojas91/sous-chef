"""
Rate limiter compartido (slowapi). Se aplica con `@limiter.limit("N/minute")`.

Detrás de Railway/Vercel respetamos `X-Forwarded-For` para identificar la IP
real del cliente, no la del proxy.
"""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


# Storage: en dev/SQLite usamos memory. En prod, configura `RATE_LIMIT_REDIS`
# (p.ej. "redis://default:pass@host:6379/0") para que el límite sea compartido
# entre instancias.
_storage_uri = os.getenv("RATE_LIMIT_REDIS") or "memory://"

limiter = Limiter(
    key_func=_client_ip,
    storage_uri=_storage_uri,
    headers_enabled=True,  # X-RateLimit-Remaining/Reset
)
