"""
Servicio de refresh tokens. Patrón "rotación + detección de reuso":

- Al hacer login emitimos `access_token` (JWT corto, ~15 min) + `refresh_token`
  opaco (32 bytes URL-safe). El cliente guarda ambos.
- En `/auth/refresh` el cliente manda el refresh_token; el server:
    1) busca por hash;
    2) si está revocado → posible reuso: revoca toda la cadena del usuario.
    3) si está expirado → 401.
    4) si OK → marca el actual como revoked_at=now, replaced_by_id=<nuevo>,
       emite refresh_token nuevo y access_token nuevo.

Nunca almacenamos el refresh_token en claro: solo SHA-256 hex.

En Postgres la rotación la hace la función SECURITY DEFINER
`auth_rotate_refresh_token` (migración 004): el presentador aún no está
autenticado, así que RLS no le dejaría ver la fila por hash.
"""
import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import os
from typing import Optional

from sqlalchemy import update, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import is_postgres
from app.models import RefreshToken

REFRESH_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "30"))


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> str:
    """Token opaco de 256 bits. Devuelve el valor en claro (solo se ve aquí)."""
    return secrets.token_urlsafe(32)


async def create_refresh_token(
    db: AsyncSession,
    user_id: int,
    *,
    user_agent: Optional[str] = None,
    ip: Optional[str] = None,
    replaces_id: Optional[int] = None,
) -> tuple[str, RefreshToken]:
    """Crea y persiste un refresh token. Retorna (token_en_claro, fila)."""
    token_plain = generate_refresh_token()
    row = RefreshToken(
        user_id=user_id,
        token_hash=_hash(token_plain),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
        user_agent=(user_agent or "")[:512] or None,
        ip=(ip or "")[:64] or None,
    )
    db.add(row)
    await db.flush()  # obtener row.id

    if replaces_id is not None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.id == replaces_id)
            .values(replaced_by_id=row.id)
        )

    return token_plain, row


async def revoke_token(db: AsyncSession, row: RefreshToken) -> None:
    row.revoked_at = datetime.now(timezone.utc)


async def revoke_all_for_user(db: AsyncSession, user_id: int) -> int:
    """Revoca todos los refresh tokens activos del usuario (ante señal de robo)."""
    res = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )
    return res.rowcount or 0


class RefreshOutcome:
    OK = "ok"
    NOT_FOUND = "not_found"
    EXPIRED = "expired"
    REUSE_DETECTED = "reuse_detected"


async def lookup_refresh_token(db: AsyncSession, token_plain: str) -> tuple[str, Optional[RefreshToken]]:
    """Busca por hash y clasifica el resultado."""
    row = (await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == _hash(token_plain))
    )).scalars().first()

    if not row:
        return RefreshOutcome.NOT_FOUND, None

    now = datetime.now(timezone.utc)
    if row.revoked_at is not None:
        return RefreshOutcome.REUSE_DETECTED, row
    # expires_at puede venir naïve desde SQLite: normalizamos
    exp = row.expires_at if row.expires_at.tzinfo else row.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        return RefreshOutcome.EXPIRED, row

    return RefreshOutcome.OK, row


@dataclass(frozen=True)
class RotationResult:
    outcome: str
    user_id: Optional[int] = None
    revoked_count: int = 0
    new_token: Optional[str] = None  # solo con outcome OK


async def rotate_refresh_token(
    db: AsyncSession,
    token_plain: str,
    *,
    user_agent: Optional[str] = None,
    ip: Optional[str] = None,
) -> RotationResult:
    """Consume un refresh token: rota si es válido, revoca la cadena si hay reuso."""
    if is_postgres(db):
        new_plain = generate_refresh_token()
        outcome, user_id, revoked = (await db.execute(
            text("SELECT result, owner_id, revoked FROM auth_rotate_refresh_token("
                 "CAST(:old_hash AS text), CAST(:new_hash AS text), "
                 "CAST(:expires_at AS timestamptz), CAST(:ua AS text), CAST(:ip AS text))"),
            {
                "old_hash": _hash(token_plain),
                "new_hash": _hash(new_plain),
                "expires_at": datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
                "ua": (user_agent or "")[:512] or None,
                "ip": (ip or "")[:64] or None,
            },
        )).one()
        return RotationResult(
            outcome=outcome,
            user_id=user_id,
            revoked_count=revoked or 0,
            new_token=new_plain if outcome == RefreshOutcome.OK else None,
        )

    outcome, row = await lookup_refresh_token(db, token_plain)
    if row is None:
        return RotationResult(outcome=outcome)
    if outcome == RefreshOutcome.REUSE_DETECTED:
        n = await revoke_all_for_user(db, row.user_id)
        return RotationResult(outcome=outcome, user_id=row.user_id, revoked_count=n)
    if outcome == RefreshOutcome.EXPIRED:
        return RotationResult(outcome=outcome, user_id=row.user_id)

    await revoke_token(db, row)
    new_plain, _ = await create_refresh_token(
        db, row.user_id, user_agent=user_agent, ip=ip, replaces_id=row.id
    )
    return RotationResult(outcome=outcome, user_id=row.user_id, new_token=new_plain)
