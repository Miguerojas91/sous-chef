"""
Lista las cuentas registradas en Sous Chef.

Se conecta con las credenciales del entorno (`DATABASE_URL`), que para esta
consulta deben ser las del rol dueño de la base: tiene BYPASSRLS, así que ve
todas las filas sin necesidad de contexto firmado. Con el rol de la API solo
vería la fila del usuario cuyo contexto estuviera fijado.

Uso: DATABASE_URL=postgresql+asyncpg://sous_owner:...@host/base?ssl=require \
     python listar_usuarios.py
"""
import asyncio

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal
from app.models import User


async def listar() -> None:
    async with AsyncSessionLocal() as session:
        filas = (await session.execute(
            select(User.id, User.username, User.email, User.is_admin, User.xp)
            .order_by(User.id)
        )).all()

        print(f"\n{'ID':>4}  {'USUARIO':<22} {'CORREO':<34} {'ADMIN':<6} {'XP':>5}")
        print('-' * 78)
        for id_, usuario, correo, es_admin, xp in filas:
            print(f"{id_:>4}  {usuario:<22} {correo:<34} {'sí' if es_admin else 'no':<6} {xp:>5}")

        admins = sum(1 for f in filas if f.is_admin)
        print(f"\nTotal: {len(filas)} cuentas ({admins} con permisos de administrador)")

        # El XP acumulado sirve de medida rápida de cuántas cuentas están vivas.
        activas = sum(1 for f in filas if f.xp > 0)
        print(f"Con progreso registrado: {activas}")


if __name__ == "__main__":
    asyncio.run(listar())
