# ADR-002: Use of SQLAlchemy async with PostgreSQL

## Status
Accepted

## Context
The ANTIGRAVITY project requires a robust, scalable, and transactional database solution to persist application data. Given the high-performance and asynchronous nature of the FastAPI backend, a non-blocking database interaction layer is essential to prevent I/O from blocking the event loop. PostgreSQL is a preferred choice for its reliability, feature set, and ACID compliance.

## Decision
SQLAlchemy, configured with its asynchronous extension (`sqlalchemy.ext.asyncio`) and the `asyncpg` driver, was chosen for database interactions with PostgreSQL. This combination allows for efficient, non-blocking database operations, aligning with FastAPI's asynchronous architecture. `async_sessionmaker` and `create_async_engine` are used to manage connections and sessions.

## Consequences
- **Positive:**
    - Non-blocking database operations improve overall application responsiveness and scalability.
    - Leverages PostgreSQL's advanced features and reliability.
    - SQLAlchemy's ORM provides a Pythonic way to interact with the database, reducing raw SQL needs.
    - Strong type safety and schema definition with SQLAlchemy models.
    - `asyncpg` is a high-performance PostgreSQL driver.
- **Negative:**
    - Introduces complexity with asynchronous programming paradigms for database operations.
    - Requires careful management of async sessions and transactions.
    - Debugging asynchronous database issues can be more challenging.
    - Potential for misuse if not properly awaited, leading to unexpected behavior.