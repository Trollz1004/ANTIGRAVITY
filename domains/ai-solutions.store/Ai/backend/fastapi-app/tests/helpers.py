"""Shared helpers for the backend test suite.

Route tests all need the same two things: rows written to the test database
before the request, and ``get_current_user`` overridden with a known user.
Both used to be copy-pasted into every test module.
"""

import asyncio
import uuid

from app.models import Profile, User


def verified_profile(user: User, **kwargs) -> Profile:
    """Build a ``Profile`` for ``user`` and sync its verification state.

    Interaction endpoints (discover, swipe, send message) gate on
    ``User.bot_shield_verified`` — the canonical flag every verification path
    sets — not ``Profile.verified``, which is only a best-effort mirror of it
    (see ``require_verified_profile``). This helper sets both from the same
    ``verified`` kwarg so route tests only have one flag to reason about.
    """
    verified = kwargs.get("verified", True)
    user.bot_shield_verified = verified
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
