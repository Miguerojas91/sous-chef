"""
app/core/security_headers.py

Middleware que añade headers de seguridad estándar:
- HSTS (forzar HTTPS por 1 año, incluye subdominios).
- X-Content-Type-Options: nosniff.
- X-Frame-Options: DENY (anti-clickjacking; CSP frame-ancestors es preferido
  pero conservamos este por compatibilidad con browsers antiguos).
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy: deshabilita features potencialmente peligrosas.
- Content-Security-Policy: restrictivo. Editar `_DEFAULT_CSP` si la API sirve
  HTML (no es el caso por defecto).

En desarrollo (`ENVIRONMENT != production`) HSTS NO se setea (rompe el dev en
http://localhost). El resto sí.
"""
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

_IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"

# CSP para API JSON (no servimos HTML). Rechaza todo por defecto.
_DEFAULT_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"

_PERMISSIONS = ", ".join([
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
])


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        h = response.headers
        h.setdefault("X-Content-Type-Options", "nosniff")
        h.setdefault("X-Frame-Options", "DENY")
        h.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        h.setdefault("Permissions-Policy", _PERMISSIONS)
        h.setdefault("Content-Security-Policy", _DEFAULT_CSP)
        # Cross-Origin-* mitigan ataques tipo Spectre.
        h.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        h.setdefault("Cross-Origin-Resource-Policy", "same-site")
        if _IS_PROD:
            h.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload",
            )
        # Borrar el header informativo del servidor (Starlette/uvicorn)
        if "server" in h:
            del h["server"]
        return response
