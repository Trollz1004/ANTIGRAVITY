"""Example tests demonstrating test environment isolation.

These tests use the `isolated_client` fixture from conftest.py which provides
a TestClient with SAVEPOINT-based transaction isolation. Each test runs in its
own nested transaction that is rolled back after the test completes.

Run with: python -m pytest tests/test_isolation_example.py -v --no-cov
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import hash_password
from app.models import User


@pytest.mark.asyncio
async def test_create_user_in_isolated_session(isolated_db_session: AsyncSession):
    """Test that a user can be created in an isolated session and retrieved."""
    user = User(
        email="[EMAIL]",
        password_hash=hash_password("password"),
        display_name="Test User Isolated",
    )
    isolated_db_session.add(user)
    await isolated_db_session.commit()

    retrieved_user = await isolated_db_session.get(User, user.id)
    assert retrieved_user is not None
    assert retrieved_user.email == "[EMAIL]"


@pytest.mark.asyncio
async def test_user_does_not_exist_in_new_isolated_session(
    isolated_db_session: AsyncSession,
):
    """Test that a user created in a previous isolated session does not exist in a new one."""
    # This test runs after test_create_user_in_isolated_session due to pytest ordering
    # but should not see its data because of isolation.
    from sqlalchemy import select

    result = await isolated_db_session.execute(
        select(User).where(User.email == "[EMAIL]")
    )
    users = result.scalars().all()
    assert len(users) == 0, "Database should be empty in this isolated session"


@pytest.mark.asyncio
async def test_health_endpoint_works_with_isolated_client(isolated_client):
    """Test that the health endpoint works with the isolated client."""
    response = isolated_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "db_connected" in data
