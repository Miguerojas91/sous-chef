"""
Script para crear el usuario administrador de Sous Chef.
Uso: python create_user.py
"""
import asyncio
import hashlib
import os
from app.core.database import AsyncSessionLocal, engine, Base
from app.models import User

def hash_password(password: str) -> str:
    """Hash de contraseña con SHA-256 + salt aleatorio."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"sha256${salt}${hashed}"

async def create_user():
    # Crear tablas si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Verificar si el usuario ya existe
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == "miguel@miguelrojas.co"))
        existing = result.scalar_one_or_none()

        if existing:
            print("⚠️  El usuario ya existe en la base de datos.")
            print(f"   ID: {existing.id} | Email: {existing.email} | Admin: {existing.is_admin}")
            return

        hashed = hash_password("Miguel40.")
        user = User(
            username="miguel",
            email="miguel@miguelrojas.co",
            hashed_password=hashed,
            is_admin=True,
            xp=0,
            allergies="[]",
            dislikes="[]",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"✅ Usuario creado exitosamente!")
        print(f"   ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Admin: {user.is_admin}")
        print(f"   Rango: {user.rank.value}")

if __name__ == "__main__":
    asyncio.run(create_user())
