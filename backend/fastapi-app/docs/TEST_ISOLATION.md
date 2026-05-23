# Test Environment Isolation with SAVEPOINT Pattern

To ensure reliable and isolated tests for the ANTIGRAVITY backend, we implement a database isolation strategy using SQLAlchemy's SAVEPOINT pattern.
This approach guarantees that each test runs with a clean database state, preventing data leakage and test pollution between individual tests.

## Why SAVEPOINTs?

Traditional methods for test isolation often involve dropping and recreating the entire database, or truncating all tables, before each test. While effective, these methods can be slow, especially for large schemas or extensive test suites.

The SAVEPOINT pattern offers a more efficient alternative:

1.  **Speed**: Instead of full schema recreation or truncation, a nested transaction (SAVEPOINT) is created at the beginning of each test.
2.  **Isolation**: All database operations performed within a test are encapsulated within this SAVEPOINT.
3.  **Rollback**: After the test completes (regardless of pass/fail), the transaction is rolled back to the SAVEPOINT. This effectively undoes all changes made by that test, restoring the database to its state before the test began.

This method ensures that each test has a consistent starting state without the overhead of full database reinitialization.

## How to Use `isolated_client` for Isolated Tests

For tests that interact with the FastAPI application and require full database isolation, use the `isolated_client` fixture. This fixture automatically provides a `TestClient` instance configured to use an isolated database session for each test.

**Example Usage:**

```python
import pytest
from app.models import User

@pytest.mark.asyncio
async def test_my_isolated_endpoint(isolated_client):
    # This test will run with a clean, isolated database state.
    # Any data created via `isolated_client` will be rolled back after the test.

    # Example: Create a user via an API endpoint
    response = isolated_client.post(
        "/api/v1/auth/register",
        json={
            "email": "isolated_user@example.com",
            "password": "securepassword",
            "display_name": "Isolated User"
        },
    )
    assert response.status_code == 200 # or 201

    # Example: Verify directly from the database (if isolated_client could expose session)
    # For direct database access within an isolated test, you can also use `isolated_db_session`
    # in conjunction with `isolated_client` if your test requires both.

    # To check if the user exists in the *same* isolated session that isolated_client uses:
    # (This assumes isolated_client is built on top of isolated_db_session, which it is)
    # We don't expose the session directly from client, but the isolation applies to both.
    # If you need to query the database *directly* within the test, use the `isolated_db_session` fixture.

@pytest.mark.asyncio
async def test_another_isolated_test(isolated_db_session: AsyncSession):
    # This test also runs with a clean, isolated database state.
    # It directly interacts with the database session.

    # Verify no users exist from previous tests
    users = await isolated_db_session.execute(User.__table__.select())
    assert not users.scalars().all()

    # Create a user directly in the database
    user = User(email="direct_db_user@example.com", password_hash="hashed_password")
    isolated_db_session.add(user)
    await isolated_db_session.commit()

    retrieved_user = await isolated_db_session.get(User, user.id)
    assert retrieved_user is not None
    assert retrieved_user.email == "direct_db_user@example.com"

# After this test, 'direct_db_user@example.com' will be rolled back.
```

## Implementation Details

The `isolated_client` and `isolated_db_session` fixtures are defined in `tests/conftest.py` and rely on a nested transaction pattern.

-   `db_session_factory` (from `conftest.py`): Provides a factory for creating SQLAlchemy async sessions, typically backed by a temporary in-memory SQLite database for the test session.
-   `isolated_db_session` (new in `conftest.py`): This fixture wraps a session from `db_session_factory` with a `SAVEPOINT` (nested transaction). It yields the session to the test and then rolls back to the `SAVEPOINT` in its `finally` block, effectively undoing all changes.
-   `isolated_client` (new in `conftest.py`): This fixture provides a FastAPI `TestClient`. It overrides the application's `get_db` dependency to use the `isolated_db_session`, ensuring all API calls made through this client operate within the isolated transaction.

This setup ensures that each test, whether interacting directly with the database via `isolated_db_session` or through API calls via `isolated_client`, starts with a clean slate and leaves no lingering data for subsequent tests.