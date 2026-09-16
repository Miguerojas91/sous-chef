"""
Siembra usuarios en la base de datos del backend con contraseñas hasheadas
(bcrypt). Los usuarios se leen de la variable de entorno SEED_USERS.

Uso:
    # Asegúrate de tener DATABASE_URL apuntando a la DB destino y de
    # haber aplicado las migraciones:
    alembic upgrade head
    python seed_users.py

Idempotente: si el username ya existe, lo deja como está (no sobreescribe
contraseñas).
"""
import asyncio
import json
import os
import sys

import bcrypt
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, set_rls_context
from app.models import User


# SEED_USERS viene del entorno para no versionar contraseñas en el repo.
#
# Formato de SEED_USERS (separar usuarios por ';', campos por ':'):
#   "admin:NuevaPassFuerte:admin@x.com:1;Tatis:OtraPass:::0"
#   campos: username:password:email:xp:is_admin (email/xp/is_admin opcionales)
#
# Ejemplo mínimo (1 admin):
#   export SEED_USERS="admin:UnaPassMuyFuerte123:admin@souschef.app::1"
def _parse_seed_users() -> list[dict]:
    raw = os.getenv("SEED_USERS", "").strip()
    if not raw:
        return []
    users = []
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        parts = chunk.split(":")
        if len(parts) < 2:
            print(f"⚠️  Entrada SEED_USERS inválida (se omite): {chunk[:20]}...")
            continue
        users.append({
            "username": parts[0],
            "password": parts[1],
            "email": parts[2] if len(parts) > 2 and parts[2] else None,
            "xp": int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0,
            "is_admin": (len(parts) > 4 and parts[4] == "1"),
        })
    return users


LOCAL_USERS = _parse_seed_users()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


async def seed() -> None:
    if not LOCAL_USERS:
        print("❌ SEED_USERS no configurada (o vacía). Nada que sembrar.\n"
              "   Ejemplo: export SEED_USERS=\"admin:UnaPassFuerte123:admin@x.com::1\"")
        return
    inserted, skipped = 0, 0
    async with AsyncSessionLocal() as db:
        # Script de operador: crea admins, así que necesita contexto admin bajo RLS.
        await set_rls_context(db, is_admin=True)
        for u in LOCAL_USERS:
            if len(u["password"]) < 8:
                print(f"⚠️  '{u['username']}' tiene contraseña <8 chars — la siembro pero "
                      f"el endpoint /register la rechazará. Considera fortalecerla.")
            existing = (await db.execute(
                select(User).where(User.username == u["username"])
            )).scalars().first()
            if existing:
                print(f"·  {u['username']:<15} ya existe (id={existing.id}) — skip")
                skipped += 1
                continue

            row = User(
                username=u["username"],
                # email único es NOT NULL en el schema; usamos un placeholder único
                # cuando no hay email real.
                email=u["email"] or f"{u['username'].lower()}@local.sous",
                hashed_password=hash_password(u["password"]),
                is_admin=u["is_admin"],
                xp=u["xp"],
                allergies=json.dumps([]),
                dislikes=json.dumps([]),
            )
            db.add(row)
            await db.flush()
            print(f"✅ {u['username']:<15} creado (id={row.id}, admin={u['is_admin']})")
            inserted += 1

        await db.commit()
    print(f"\nTotal: {inserted} insertados, {skipped} ya existían.")
    if inserted:
        print("\n⚠️  Recordatorio: ahora EDITA o BORRA "
              "`frontend/src/data/localUsers.ts` para no dejar las contraseñas "
              "plaintext en el bundle del frontend.")


if __name__ == "__main__":
    asyncio.run(seed())
