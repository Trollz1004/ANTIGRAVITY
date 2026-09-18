"""Feature flags — simple in-memory flag store.

Flags are set at startup via environment variables or the admin API.
The store is process-local; use Redis or a DB-backed store for multi-worker
deployments.
"""

from __future__ import annotations

import os
from typing import Any

_FLAGS: dict[str, Any] = {
    "lovebot_enabled": os.getenv("FF_LOVEBOT_ENABLED", "true").lower() == "true",
    "video_rooms_enabled": os.getenv("FF_VIDEO_ROOMS_ENABLED", "true").lower()
    == "true",
    "double_dates_enabled": os.getenv("FF_DOUBLE_DATES_ENABLED", "true").lower()
    == "true",
    "volunteer_matching_enabled": os.getenv(
        "FF_VOLUNTEER_MATCHING_ENABLED", "false"
    ).lower()
    == "true",
}


def get_flag(name: str, default: Any = False) -> Any:
    """Return the current value of a feature flag."""
    return _FLAGS.get(name, default)


def set_flag(name: str, value: Any) -> None:
    """Set a feature flag value at runtime."""
    _FLAGS[name] = value


def get_all_flags() -> dict[str, Any]:
    """Return a copy of all feature flags."""
    return dict(_FLAGS)
