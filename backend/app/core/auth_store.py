"""
Accesos a `users` previos a la autenticación (login y registro).

En ese punto aún no hay usuario para fijar el contexto RLS, así que en
Postgres se llama a funciones SECURITY DEFINER acotadas (migración 004). En
SQLite no hay RLS ni funciones: se usan queries ORM equivalentes.
"""
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import is_postgres
from app.models import User


@dataclass(frozen=True)
class LoginCandidate:
    id: int
    username: str
    hashed_password: str
    is_admin: bool


async def find_login_candidate(db: AsyncSession, username: str) -> Optional[LoginCandidate]:
    """Datos mínimos para verificar la contraseña; no expone el resto del perfil."""
    if is_postgres(db):
        row = (await db.execute(
            text("SELECT id, username, hashed_password, is_admin "
                 "FROM auth_user_for_login(CAST(:username AS text))"),
            {"username": username},
        )).first()
    else:
        row = (await db.execute(
            select(User.id, User.username, User.hashed_password, User.is_admin)
            .where(User.username == username)
        )).first()
    if not row:
        return None
    return LoginCandidate(id=row[0], username=row[1], hashed_password=row[2] or "", is_admin=bool(row[3]))


async def create_user_account(
    db: AsyncSession,
    *,
    username: str,
    email: str,
    hashed_password: str,
    allergies_json: str,
    dislikes_json: str,
) -> Optional[int]:
    """Crea un usuario NO admin. Devuelve su id, o None si username/email ya existen."""
    if is_postgres(db):
        return (await db.execute(
            text("SELECT auth_register_user(CAST(:username AS text), CAST(:email AS text), "
                 "CAST(:hashed AS text), CAST(:allergies AS text), CAST(:dislikes AS text))"),
            {"username": username, "email": email, "hashed": hashed_password,
             "allergies": allergies_json, "dislikes": dislikes_json},
        )).scalar()

    dup = (await db.execute(
        select(User.id).where((User.username == username) | (User.email == email))
    )).first()
    if dup:
        return None
    row = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        allergies=allergies_json,
        dislikes=dislikes_json,
        is_admin=False,
    )
    db.add(row)
    await db.flush()
    return row.id
