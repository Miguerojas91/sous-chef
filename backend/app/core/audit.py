"""
Helper para registrar eventos en la tabla `audit_log`.

`log_event` se puede llamar desde cualquier endpoint con la sesión actual.
Si la sesión cae, el `INSERT` se aborta sin afectar el flujo principal
(usamos `await db.flush()` dentro de un try/except; el endpoint puede
hacer commit más adelante).
"""
import json
import logging
from typing import Optional, Any
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog

logger = logging.getLogger("audit")

# Acciones canónicas (constantes para evitar typos en greps)
class Action:
    LOGIN_OK = "login.ok"
    LOGIN_FAIL = "login.fail"
    REGISTER = "register"
    LOGOUT = "logout"
    REFRESH_OK = "refresh.ok"
    REFRESH_REUSE = "refresh.reuse_detected"
    REFRESH_EXPIRED = "refresh.expired"
    REFRESH_NOT_FOUND = "refresh.not_found"
    PREMIUM_GRANT = "premium.grant"
    PREMIUM_REVOKE = "premium.revoke"
    ADMIN_ACTION = "admin.action"


def _client_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    # X-Forwarded-For (Railway/Vercel/CF behind proxies)
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()[:64]
    if request.client and request.client.host:
        return request.client.host[:64]
    return None


def _user_agent(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    return (request.headers.get("user-agent") or "")[:512] or None


async def log_event(
    db: AsyncSession,
    *,
    action: str,
    user_id: Optional[int] = None,
    target: Optional[str] = None,
    ok: bool = True,
    meta: Optional[dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    """Registra un evento. Nunca lanza: fallar el log no debe romper la app."""
    try:
        row = AuditLog(
            user_id=user_id,
            action=action[:64],
            target=(target or "")[:255] or None,
            ip=_client_ip(request),
            user_agent=_user_agent(request),
            metadata_=json.dumps(meta, default=str)[:8000] if meta else None,
            ok=ok,
        )
        db.add(row)
        await db.flush()
    except Exception:  # noqa: BLE001
        logger.exception("audit log failed — action=%s user_id=%s", action, user_id)
