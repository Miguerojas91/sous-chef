"""
Crea el usuario administrador de Sous Chef.

Las credenciales se leen del entorno; nunca se escriben en el código:
    ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD

Uso: ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... python create_user.py
"""
import asyncio
import os
import sys

from sqlalchemy import select

from app.api.auth import get_password_hash
from app.core.database import AsyncSessionLocal, Base, engine
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

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
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
        await session.commit()
        await session.refresh(user)
        print(f"Usuario creado. ID: {user.id} | Username: {user.username} | Email: {user.email} | Admin: {user.is_admin}")


if __name__ == "__main__":
    asyncio.run(create_user())
