"""
Comprueba que el login del admin funciona con la contraseña dada.

Uso: ADMIN_USERNAME=... ADMIN_PASSWORD=... python verify_user.py
"""
import asyncio
import os
import sys

from sqlalchemy import select

from app.api.auth import verify_password
from app.core.database import AsyncSessionLocal
from app.models import User


async def verify() -> None:
    username = os.environ.get("ADMIN_USERNAME", "").strip()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not username or not password:
        sys.exit("Faltan ADMIN_USERNAME o ADMIN_PASSWORD en el entorno.")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            print("Usuario no encontrado.")
            return
        print(f"Usuario: {user.username} | Admin: {user.is_admin}")
        print(f"Contraseña correcta: {verify_password(password, user.hashed_password)}")


if __name__ == "__main__":
    asyncio.run(verify())
