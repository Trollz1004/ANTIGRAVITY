import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.models import User, Base
from app.database import get_db

DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_test_db():
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def async_client():
    app.dependency_overrides[get_db] = get_test_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_google_login_new_user(async_client: AsyncClient):
    with patch("app.routers.auth.verify_google_token") as mock_verify:
        mock_verify.return_value = {
            "iss": "https://accounts.google.com",
            "sub": "1234567890",
            "email": "newuser@example.com",
            "name": "New User",
            "email_verified": True,
        }

        response = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

        async with TestingSessionLocal() as session:
            user = await session.scalar(
                select(User).where(User.email == "newuser@example.com")
            )
            assert user is not None
            assert user.google_id == "1234567890"


@pytest.mark.asyncio
async def test_google_login_existing_user(async_client: AsyncClient):
    async with TestingSessionLocal() as session:
        existing_user = User(
            email="existinguser@example.com",
            password_hash="somehash",
            display_name="Existing User",
        )
        session.add(existing_user)
        await session.commit()

    with patch("app.routers.auth.verify_google_token") as mock_verify:
        mock_verify.return_value = {
            "iss": "https://accounts.google.com",
            "sub": "0987654321",
            "email": "existinguser@example.com",
            "name": "Existing User",
            "email_verified": True,
        }

        response = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

        async with TestingSessionLocal() as session:
            user = await session.scalar(
                select(User).where(User.email == "existinguser@example.com")
            )
            assert user.google_id == "0987654321"


@pytest.mark.asyncio
async def test_google_login_invalid_token(async_client: AsyncClient):
    with patch("app.routers.auth.verify_google_token") as mock_verify:
        mock_verify.side_effect = Exception("Invalid token")

        response = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "invalid_token"}
        )

        assert response.status_code == 401
        assert "Invalid Google token" in response.text


@pytest.mark.asyncio
async def test_google_login_no_email_in_token(async_client: AsyncClient):
    with patch("app.routers.auth.verify_google_token") as mock_verify:
        mock_verify.return_value = {
            "iss": "https://accounts.google.com",
            "sub": "12345",
            "name": "No Email",
        }

        response = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "fake_token"}
        )

        assert response.status_code == 400
        assert "Email not present in Google token" in response.text
