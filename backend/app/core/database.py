"""
Conexión SQLAlchemy async. Soporta tanto SQLite (dev) como Postgres (prod).
RLS solo aplica en Postgres.
"""
import os
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL ejemplos:
#   sqlite+aiosqlite:///./sous.db
#   postgresql+asyncpg://user:pass@host:5432/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sous.db")

IS_POSTGRES = "postgres" in DATABASE_URL  # True para postgresql+asyncpg
IS_SQLITE = "sqlite" in DATABASE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


def is_postgres(db: AsyncSession) -> bool:
    """True si la sesión habla con Postgres (donde existen RLS y las funciones de auth)."""
    return db.get_bind().dialect.name == "postgresql"


async def set_rls_context(
    db: AsyncSession, *, user_id: Optional[int] = None, is_admin: bool = False
) -> None:
    """Fija los GUCs que leen las políticas RLS, solo para la transacción actual.

    Se pierden en el próximo commit/rollback: hay que llamarla de nuevo si la
    sesión sigue consultando tablas con RLS después de hacer commit.
    No-op fuera de Postgres.
    """
    if not is_postgres(db):
        return
    await db.execute(
        text(
            "SELECT set_config('app.current_user_id', :uid, true), "
            "set_config('app.is_admin', :adm, true)"
        ),
        {"uid": "" if user_id is None else str(user_id), "adm": "true" if is_admin else "false"},
    )


async def get_db():
    """Sesión con el rol de la app y SIN contexto RLS fijado.

    En Postgres, las tablas con RLS (users, user_*, refresh_tokens, audit_log)
    no devuelven ni aceptan filas desde esta sesión hasta que se fije contexto:
    `get_current_user` lo fija con el `sub` del JWT verificado, y los flujos
    previos a autenticarse (login, register, refresh, audit) pasan por las
    funciones SECURITY DEFINER de la migración 004. Las tablas de catálogo no
    tienen RLS y se leen normalmente.
    """
    async with AsyncSessionLocal() as session:
        yield session
