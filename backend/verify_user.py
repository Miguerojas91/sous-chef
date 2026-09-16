"""
Comprueba que el login del admin funciona con la contraseña dada.

Uso: ADMIN_USERNAME=... ADMIN_PASSWORD=... python verify_user.py
"""
import asyncio
import os
import sys

from app.core.auth_store import find_login_candidate
from app.core.passwords import verify_password
from app.core.database import AsyncSessionLocal


async def verify() -> None:
    username = os.environ.get("ADMIN_USERNAME", "").strip()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not username or not password:
        sys.exit("Faltan ADMIN_USERNAME o ADMIN_PASSWORD en el entorno.")

    async with AsyncSessionLocal() as session:
        # Misma búsqueda que /auth/login, para probar también el camino bajo RLS.
        user = await find_login_candidate(session, username)
        if not user:
            print("Usuario no encontrado.")
            return
        print(f"Usuario: {user.username} | Admin: {user.is_admin}")
        print(f"Contraseña correcta: {verify_password(password, user.hashed_password)}")


if __name__ == "__main__":
    asyncio.run(verify())
