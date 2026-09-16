"""
app/core/database.py

Conexión SQLAlchemy async. Soporta tanto SQLite (dev) como Postgres (prod).
RLS solo aplica en Postgres.
"""
import os
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


async def get_db():
    """Sesión sin RLS — para endpoints públicos (login, register, health)."""
    async with AsyncSessionLocal() as session:
        yield session
