from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import create_engine
from app.config.settings import get_settings
import ssl

settings = get_settings()

print("SQL_DATABASE_URL =", settings.SQL_DATABASE_URL)
print("SQL_DATABASE_URL_SYNC =", settings.SQL_DATABASE_URL_SYNC)

ssl_context = ssl.create_default_context()

async_engine = create_async_engine(
    settings.SQL_DATABASE_URL,
    connect_args={"ssl": ssl_context},   # ADD THIS
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

sync_engine = create_engine(
    settings.SQL_DATABASE_URL_SYNC,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise