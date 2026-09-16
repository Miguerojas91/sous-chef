"""
Crea el usuario administrador de Sous Chef.

Las credenciales se leen del entorno; nunca se escriben en el código:
    ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD

Requiere el esquema creado con `alembic upgrade head` (incluye las políticas RLS);
este script no crea tablas.

En Postgres abre la transacción con contexto admin (`app.is_admin=true`): la
función de registro pública nunca crea admins a propósito, así que dar de alta
uno es tarea de operador con credenciales de la DB. Ejecútalo solo desde un
entorno de confianza (ver SECURITY.md).

Uso: ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... python create_user.py
"""
import asyncio
import os
import sys

from sqlalchemy import select

from app.core.passwords import get_password_hash
from app.core.database import AsyncSessionLocal, set_rls_context
from app.models import User


def _require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        sys.exit(f"Falta la variable de entorno {name}.")
    return value


async def create_user() -> None:
    username = _require_env("ADMIN_USERNAME")
    email = _require_env("ADMIN_EMAIL")
    password = _require_env("ADMIN_PASSWORD")

    async with AsyncSessionLocal() as session:
        await set_rls_context(session, is_admin=True)
        result = await session.execute(
            select(User).where((User.email == email) | (User.username == username))
        )
        existing = result.scalars().first()
        if existing:
            print(f"El usuario ya existe. ID: {existing.id} | Email: {existing.email} | Admin: {existing.is_admin}")
            return

        # Mismo bcrypt que usa el login; un hash distinto dejaría la cuenta sin poder entrar.
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_admin=True,
            xp=0,
            allergies="[]",
            dislikes="[]",
        )
        session.add(user)
        await session.flush()
        await session.commit()
        # Sin refresh(): la transacción nueva ya no tendría contexto RLS; los
        # atributos siguen cargados porque expire_on_commit=False.
        print(f"Usuario creado. ID: {user.id} | Username: {user.username} | Email: {user.email} | Admin: {user.is_admin}")


if __name__ == "__main__":
    asyncio.run(create_user())
