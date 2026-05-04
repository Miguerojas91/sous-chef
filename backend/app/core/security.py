"""
app/core/security.py

Helpers de autenticación: emisión y validación de JWT, dependency
`get_current_user` para proteger endpoints.

Variables de entorno:
- JWT_SECRET (REQUERIDA en producción)
- JWT_ALGORITHM (default: HS256)
- JWT_EXPIRE_MINUTES (default: 1440 = 24h)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models import User

# Si no hay JWT_SECRET en producción, fallar fast.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise RuntimeError("JWT_SECRET no configurada (requerida en producción).")
    # Dev: generar uno por sesión (las sesiones se invalidan al reiniciar)
    JWT_SECRET = secrets.token_urlsafe(48)
    print("⚠️  JWT_SECRET no configurada — usando secret efímero (solo desarrollo).")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

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
