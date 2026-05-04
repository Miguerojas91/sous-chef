"""
app/api/auth.py

Endpoints de autenticación. Emite JWT en login/register.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import List

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    allergies: List[str] = []
    dislikes: List[str] = []


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    allergies: List[str]
    dislikes: List[str]
    xp: int


class AuthResponse(BaseModel):
    """Response de login/register: incluye el token JWT."""
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# --- Helpers ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


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


def _build_auth_response(user: User) -> AuthResponse:
    token = create_access_token(
        subject=user.id,
        extra={"is_admin": bool(user.is_admin), "username": user.username},
    )
    return AuthResponse(access_token=token, user=_user_to_public(user))


# --- Endpoints ---
@router.post("/register", response_model=AuthResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    result = await db.execute(
        select(User).where((User.username == user.username) | (User.email == user.email))
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username o email ya registrado")

    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        allergies=json.dumps(user.allergies),
        dislikes=json.dumps(user.dislikes),
        is_admin=False,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return _build_auth_response(db_user)


@router.post("/login", response_model=AuthResponse)
async def login(creds: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == creds.username))
    user = result.scalars().first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return _build_auth_response(user)


@router.get("/me", response_model=UserPublic)
async def me(current: User = Depends(get_current_user)):
    """Retorna el usuario autenticado a partir del JWT."""
    return _user_to_public(current)
