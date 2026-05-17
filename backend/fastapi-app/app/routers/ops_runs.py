"""Ops-runs router — lightweight audit log for operational script executions.

POST /api/v1/ops-runs        — record a run event (requires auth)
GET  /api/v1/ops-runs        — list recent run events (requires auth)
GET  /api/v1/ops-runs/{id}   — get a single run event (requires auth)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from app.error_responses import not_found
from pydantic import BaseModel

from app.auth import get_current_user
from app.models import User

router = APIRouter()

# In-memory store — replace with DB-backed store for production persistence
_RUNS: list[dict] = []
_MAX_RUNS = 500


class OpsRunCreate(BaseModel):
    script: str
    status: str  # "success" | "failure" | "skipped"
    duration_ms: Optional[int] = None
    details: Optional[str] = None


class OpsRunResponse(BaseModel):
    id: str
    script: str
    status: str
    duration_ms: Optional[int]
    details: Optional[str]
    recorded_at: str


@router.post(
    "/ops-runs",
    response_model=OpsRunResponse,
    status_code=201,
    summary="Record an ops run event",
)
async def create_ops_run(
    body: OpsRunCreate,
    current_user: User = Depends(get_current_user),
) -> OpsRunResponse:
    run = {
        "id": str(uuid.uuid4()),
        "script": body.script,
        "status": body.status,
        "duration_ms": body.duration_ms,
        "details": body.details,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    _RUNS.append(run)
    if len(_RUNS) > _MAX_RUNS:
        _RUNS.pop(0)
    return OpsRunResponse(**run)


@router.get(
    "/ops-runs",
    response_model=list[OpsRunResponse],
    summary="List recent ops run events",
)
async def list_ops_runs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
) -> list[OpsRunResponse]:
    return [OpsRunResponse(**r) for r in _RUNS[-limit:]]


@router.get(
    "/ops-runs/{run_id}",
    response_model=OpsRunResponse,
    summary="Get a single ops run event",
)
async def get_ops_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
) -> OpsRunResponse:
    for run in _RUNS:
        if run["id"] == run_id:
            return OpsRunResponse(**run)
    raise not_found(message=f"Ops run '{run_id}' not found")
