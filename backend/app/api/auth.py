"""
Endpoints de autenticación con:
- Access token JWT corto (15 min default).
- Refresh tokens persistidos con rotación + detección de reuso.
- Rate limit estricto en /login (anti brute-force).
- Audit log de cada intento.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.security import create_access_token, get_current_user
from app.core.tokens import (
    create_refresh_token,
    lookup_refresh_token,
    revoke_token,
    revoke_all_for_user,
    RefreshOutcome,
)
from app.core.audit import log_event, Action
from app.core.passwords import get_password_hash, verify_password
from app.models import User, RefreshToken

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    allergies: List[str] = []
    dislikes: List[str] = []


class UserLogin(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    allergies: List[str]
    dislikes: List[str]
    xp: int


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos
    user: UserPublic


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


def _user_to_public(u: User) -> UserPublic:
    return UserPublic(
        id=u.id,
        username=u.username,
        email=u.email,
        is_admin=u.is_admin,
        allergies=json.loads(u.allergies or "[]"),
        dislikes=json.loads(u.dislikes or "[]"),
        xp=u.xp,
    )


def _client_meta(request: Request) -> tuple[Optional[str], Optional[str]]:
    ua = (request.headers.get("user-agent") or "")[:512] or None
    xff = request.headers.get("x-forwarded-for", "")
    ip = (xff.split(",")[0].strip() if xff else (request.client.host if request.client else ""))[:64] or None
    return ua, ip


async def _build_auth_response(
    db: AsyncSession, user: User, request: Request, *, replaces_id: Optional[int] = None
) -> AuthResponse:
    from app.core.security import JWT_EXPIRE_MINUTES
    access = create_access_token(
        subject=user.id,
        extra={"is_admin": bool(user.is_admin), "username": user.username},
    )
    ua, ip = _client_meta(request)
    refresh, _ = await create_refresh_token(
        db, user.id, user_agent=ua, ip=ip, replaces_id=replaces_id
    )
    return AuthResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=JWT_EXPIRE_MINUTES * 60,
        user=_user_to_public(user),
    )


@router.post("/register", response_model=AuthResponse)
@limiter.limit("5/minute")
async def register(request: Request, response: Response, user: UserCreate, db: AsyncSession = Depends(get_db)):
    if len(user.password) < 8:
        await log_event(db, action=Action.REGISTER, ok=False,
                        meta={"reason": "weak_password"}, request=request)
        await db.commit()
        raise HTTPException(400, "La contraseña debe tener al menos 8 caracteres")

    res = await db.execute(
        select(User).where((User.username == user.username) | (User.email == user.email))
    )
    if res.scalars().first():
        await log_event(db, action=Action.REGISTER, ok=False,
                        target=user.username, meta={"reason": "duplicate"}, request=request)
        await db.commit()
        raise HTTPException(400, "Username o email ya registrado")

    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        allergies=json.dumps(user.allergies),
        dislikes=json.dumps(user.dislikes),
        is_admin=False,
    )
    db.add(db_user)
    await db.flush()  # obtener id

    resp = await _build_auth_response(db, db_user, request)
    await log_event(db, action=Action.REGISTER, user_id=db_user.id,
                    target=db_user.username, request=request)
    await db.commit()
    return resp


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, creds: UserLogin, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.username == creds.username))
    user = res.scalars().first()
    if not user or not verify_password(creds.password, user.hashed_password):
        await log_event(db, action=Action.LOGIN_FAIL, ok=False,
                        target=creds.username, request=request)
        await db.commit()
        raise HTTPException(401, "Credenciales inválidas")

    resp = await _build_auth_response(db, user, request)
    await log_event(db, action=Action.LOGIN_OK, user_id=user.id,
                    target=user.username, request=request)
    await db.commit()
    return resp


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("60/minute")
async def refresh(request: Request, response: Response, body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    outcome, row = await lookup_refresh_token(db, body.refresh_token)

    if outcome == RefreshOutcome.NOT_FOUND:
        await log_event(db, action=Action.REFRESH_NOT_FOUND, ok=False, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token inválido")

    assert row is not None

    if outcome == RefreshOutcome.REUSE_DETECTED:
        # Robo probable: invalida toda la cadena del usuario.
        n = await revoke_all_for_user(db, row.user_id)
        await log_event(db, action=Action.REFRESH_REUSE, ok=False,
                        user_id=row.user_id, meta={"revoked": n}, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token revocado (reuso detectado). Inicia sesión nuevamente.")

    if outcome == RefreshOutcome.EXPIRED:
        await log_event(db, action=Action.REFRESH_EXPIRED, ok=False,
                        user_id=row.user_id, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token expirado")

    user = (await db.execute(select(User).where(User.id == row.user_id))).scalars().first()
    if not user:
        raise HTTPException(401, "Usuario no encontrado")

    await revoke_token(db, row)
    resp = await _build_auth_response(db, user, request, replaces_id=row.id)
    await log_event(db, action=Action.REFRESH_OK, user_id=user.id, request=request)
    await db.commit()
    return TokenResponse(
        access_token=resp.access_token,
        refresh_token=resp.refresh_token,
        expires_in=resp.expires_in,
    )


@router.post("/logout")
async def logout(
    request: Request,
    body: RefreshRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoca un refresh token específico (cierra esa sesión)."""
    outcome, row = await lookup_refresh_token(db, body.refresh_token)
    if outcome == RefreshOutcome.OK and row and row.user_id == current.id:
        await revoke_token(db, row)
    await log_event(db, action=Action.LOGOUT, user_id=current.id, request=request)
    await db.commit()
    return {"ok": True}


@router.post("/logout-all")
async def logout_all(
    request: Request,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoca todas las sesiones del usuario (dispositivo perdido)."""
    n = await revoke_all_for_user(db, current.id)
    await log_event(db, action=Action.LOGOUT, user_id=current.id,
                    meta={"all": True, "revoked": n}, request=request)
    await db.commit()
    return {"ok": True, "revoked": n}


@router.get("/me", response_model=UserPublic)
async def me(current: User = Depends(get_current_user)):
    return _user_to_public(current)
