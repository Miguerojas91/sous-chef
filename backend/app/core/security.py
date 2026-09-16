"""
Helpers de autenticación: emisión y validación de JWT, dependency
`get_current_user` para proteger endpoints.

Variables de entorno:
- JWT_SECRET (requerida en producción)
- JWT_ALGORITHM (default: HS256)
- JWT_EXPIRE_MINUTES (default: 15)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWTError as JWTError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal, get_db, IS_POSTGRES
from app.models import User

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise RuntimeError("JWT_SECRET no configurada (requerida en producción).")
    # Dev: generar uno por sesión (las sesiones se invalidan al reiniciar)
    JWT_SECRET = secrets.token_urlsafe(48)
    print("⚠️  JWT_SECRET no configurada — usando secret efímero (solo desarrollo).")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Access token corto: el refresh token persistido en DB mantiene la sesión.
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "15"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def create_access_token(subject: str | int, extra: Optional[dict] = None) -> str:
    """Emite un JWT firmado para `subject` (user id)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=JWT_EXPIRE_MINUTES)).timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency que valida el JWT y retorna el usuario autenticado."""
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_exc
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise creds_exc
    except JWTError:
        raise creds_exc

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise creds_exc

    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalars().first()
    if not user:
        raise creds_exc
    return user


async def require_admin(current: User = Depends(get_current_user)) -> User:
    """Dependency que exige `is_admin=True` en el JWT/usuario."""
    if not getattr(current, "is_admin", False):
        raise HTTPException(status_code=403, detail="Se requieren privilegios de admin")
    return current


async def get_user_db(current: User = Depends(get_current_user)):
    """
    Sesión de DB con Row-Level Security activo.

    Setea las variables de sesión Postgres `app.current_user_id` y
    `app.is_admin` (transacción-local), que son leídas por las políticas RLS
    definidas en la migración `002_enable_rls.py`.

    En SQLite (dev) las políticas no existen y `set_config` no se ejecuta;
    la dependencia se comporta como un `get_db` normal.

    Uso:
        @router.get("/recetas/mias")
        async def mis_recetas(db: AsyncSession = Depends(get_user_db)):
            # Las queries solo verán filas donde user_id = current_user.id
            ...
    """
    async with AsyncSessionLocal() as session:
        if IS_POSTGRES:
            # Abrimos una transacción explícita para que `set_config(..., true)`
            # (transaction-local) cubra todas las queries del request.
            async with session.begin():
                await session.execute(
                    text("SELECT set_config('app.current_user_id', :uid, true)"),
                    {"uid": str(current.id)},
                )
                await session.execute(
                    text("SELECT set_config('app.is_admin', :a, true)"),
                    {"a": "true" if current.is_admin else "false"},
                )
                yield session
        else:
            # Dev/SQLite: sin RLS, comportamiento normal
            yield session
