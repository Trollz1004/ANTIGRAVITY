"""Shared helpers for the backend test suite.

Route tests all need the same two things: rows written to the test database
before the request, and ``get_current_user`` overridden with a known user.
Both used to be copy-pasted into every test module.
"""

import asyncio
import uuid

from app.models import Profile, User


def verified_profile(user: User, **kwargs) -> Profile:
    """Build a verified ``Profile`` for ``user``.

    Interaction endpoints (discover, swipe, send message) require the caller
    to have a verified profile, so route tests seed one for their actor.
    """
    defaults: dict = {"id": uuid.uuid4(), "user_id": user.id, "verified": True}
    defaults.update(kwargs)
    return Profile(**defaults)


def seed(*items, db_session_factory) -> None:
    """Persist ORM instances with the test session factory."""

    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def override_user(user: User):
    """Build a ``get_current_user`` dependency override returning ``user``."""

    async def _dep():
        return user

    return _dep
