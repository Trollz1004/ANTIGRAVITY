import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

load_dotenv("C:/ANTIGRAVITY/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("WARNING: DATABASE_URL not found!")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def clear_users():
    async with async_session() as db:
        await db.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
        await db.commit()
        print("Successfully cleared the users table (and any cascading tables)!")


asyncio.run(clear_users())
