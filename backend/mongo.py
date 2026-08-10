"""Shared MongoDB bootstrap for the Mission Control backend modules.

Every router module used to repeat the same four lines: resolve ``ROOT_DIR``,
load ``.env`` from it, build an ``AsyncIOMotorClient`` from ``MONGO_URL`` and
index it by ``DB_NAME``. That produced one Motor client (and one connection
pool) per module. This module does it once and hands the same client and
database out to every caller.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    """Return the process-wide Motor client, connecting on first use."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client


def get_db() -> AsyncIOMotorDatabase:
    """Return the process-wide database handle named by ``DB_NAME``."""
    global _db
    if _db is None:
        _db = get_client()[os.environ["DB_NAME"]]
    return _db


def close_client() -> None:
    """Close the shared client — call on application shutdown."""
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
