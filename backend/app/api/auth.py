"""
Endpoints de autenticación con:
- Access token JWT corto (15 min default).
- Refresh tokens persistidos con rotación + detección de reuso.
- Rate limit estricto en /login (anti brute-force).
- Audit log de cada intento.

RLS (Postgres): antes de autenticarse no hay contexto, así que la búsqueda
por username, el alta y la rotación del refresh token van por funciones
SECURITY DEFINER (`app/core/auth_store.py`, `rotate_refresh_token`). Una vez
conocido el usuario se fija `app.current_user_id` y el resto usa el ORM bajo RLS.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.core.auth_store import create_user_account, find_login_candidate
from app.core.database import get_db, set_rls_context
from app.core.rate_limit import limiter
from app.core.security import JWT_EXPIRE_MINUTES, create_access_token, get_current_user
from app.core.tokens import (
    create_refresh_token,
    lookup_refresh_token,
    rotate_refresh_token,
    revoke_token,
    revoke_all_for_user,
    RefreshOutcome,
)
from app.core.audit import log_event, Action
from app.core.passwords import get_password_hash, verify_password
from app.models import User

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


def _access_token_for(user: User) -> str:
    return create_access_token(
        subject=user.id,
        extra={"is_admin": bool(user.is_admin), "username": user.username},
    )


async def _load_authenticated_user(db: AsyncSession, user_id: int) -> Optional[User]:
    """Solo tras verificar credenciales o refresh token: abre RLS para ese usuario."""
    await set_rls_context(db, user_id=user_id)
    return (await db.execute(select(User).where(User.id == user_id))).scalars().first()


async def _build_auth_response(db: AsyncSession, user: User, request: Request) -> AuthResponse:
    ua, ip = _client_meta(request)
    refresh, _ = await create_refresh_token(db, user.id, user_agent=ua, ip=ip)
    return AuthResponse(
        access_token=_access_token_for(user),
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

    new_id = await create_user_account(
        db,
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        allergies_json=json.dumps(user.allergies),
        dislikes_json=json.dumps(user.dislikes),
    )
    if new_id is None:
        await log_event(db, action=Action.REGISTER, ok=False,
                        target=user.username, meta={"reason": "duplicate"}, request=request)
        await db.commit()
        raise HTTPException(400, "Username o email ya registrado")

    db_user = await _load_authenticated_user(db, new_id)
    if db_user is None:
        raise HTTPException(500, "No se pudo completar el registro")

    resp = await _build_auth_response(db, db_user, request)
    await log_event(db, action=Action.REGISTER, user_id=db_user.id,
                    target=db_user.username, request=request)
    await db.commit()
    return resp


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, creds: UserLogin, db: AsyncSession = Depends(get_db)):
    candidate = await find_login_candidate(db, creds.username)
    user = None
    if candidate and verify_password(creds.password, candidate.hashed_password):
        user = await _load_authenticated_user(db, candidate.id)
    if not user:
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
    ua, ip = _client_meta(request)
    # La revocación de la cadena ante reuso ocurre dentro de la rotación.
    rot = await rotate_refresh_token(db, body.refresh_token, user_agent=ua, ip=ip)

    if rot.outcome == RefreshOutcome.NOT_FOUND:
        await log_event(db, action=Action.REFRESH_NOT_FOUND, ok=False, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token inválido")

    if rot.outcome == RefreshOutcome.REUSE_DETECTED:
        await log_event(db, action=Action.REFRESH_REUSE, ok=False,
                        user_id=rot.user_id, meta={"revoked": rot.revoked_count}, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token revocado (reuso detectado). Inicia sesión nuevamente.")

    if rot.outcome == RefreshOutcome.EXPIRED:
        await log_event(db, action=Action.REFRESH_EXPIRED, ok=False,
                        user_id=rot.user_id, request=request)
        await db.commit()
        raise HTTPException(401, "Refresh token expirado")

    user = await _load_authenticated_user(db, rot.user_id)
    if not user:
        # Sin commit: la rotación se deshace con el rollback de la sesión.
        raise HTTPException(401, "Usuario no encontrado")

    access = _access_token_for(user)
    await log_event(db, action=Action.REFRESH_OK, user_id=user.id, request=request)
    await db.commit()
    return TokenResponse(
        access_token=access,
        refresh_token=rot.new_token,
        expires_in=JWT_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout(
    request: Request,
    body: RefreshRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoca un refresh token específico (cierra esa sesión)."""
    # FastAPI reutiliza la misma sesión `get_db` que `get_current_user`, que ya
    # fijó el contexto RLS del usuario: solo verá y revocará sus propios tokens.
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
