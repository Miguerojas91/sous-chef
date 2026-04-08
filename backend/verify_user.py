import asyncio
from passlib.context import CryptContext
from app.core.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def verify():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "miguel"))
        user = result.scalar_one_or_none()
        if not user:
            print("ERROR: usuario no encontrado")
            return
        ok = pwd_context.verify("Miguel40.", user.hashed_password)
        print(f"Usuario: {user.username} ({user.email}) | Admin: {user.is_admin}")
        print(f"Password OK: {ok}")

asyncio.run(verify())
