"""Feature-flags admin router.

GET  /api/v1/admin/flags        — list all flags
GET  /api/v1/admin/flags/{name} — get a single flag
PUT  /api/v1/admin/flags/{name} — update a flag (requires admin JWT)
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.feature_flags import get_all_flags, get_flag, set_flag

router = APIRouter(prefix="/api/v1/admin/flags", tags=["feature-flags"])


class FlagUpdate(BaseModel):
    value: Any


@router.get("/", summary="List all feature flags")
async def list_flags() -> dict[str, Any]:
    return get_all_flags()


@router.get("/{name}", summary="Get a feature flag value")
async def read_flag(name: str) -> dict[str, Any]:
    all_flags = get_all_flags()
    if name not in all_flags:
        raise HTTPException(status_code=404, detail=f"Flag '{name}' not found")
    return {name: get_flag(name)}


@router.put("/{name}", summary="Update a feature flag value")
async def update_flag(name: str, body: FlagUpdate) -> dict[str, Any]:
    all_flags = get_all_flags()
    if name not in all_flags:
        raise HTTPException(status_code=404, detail=f"Flag '{name}' not found")
    set_flag(name, body.value)
    return {name: get_flag(name)}
