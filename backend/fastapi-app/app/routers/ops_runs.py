"""Ops-runs router — lightweight audit log for operational script executions.

POST /api/v1/ops-runs        — record a run event (requires auth)
GET  /api/v1/ops-runs        — list recent run events (requires auth)
GET  /api/v1/ops-runs/{id}   — get a single run event (requires auth)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth import get_current_user
from app.error_responses import not_found
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


class OpsRunPagination(BaseModel):
    offset: int
    limit: int
    total: int
    has_next: bool
    has_prev: bool
    next_offset: Optional[int]
    prev_offset: Optional[int]


class OpsRunListResponse(BaseModel):
    """Paginated ops-run listing — matches the payload the endpoint returns."""

    runs: list[OpsRunResponse]
    pagination: OpsRunPagination


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
    response_model=OpsRunListResponse,
    summary="List recent ops run events",
)
async def list_ops_runs(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
) -> dict:
    # Sort runs by recorded_at in descending order (most recent first)
    sorted_runs = sorted(_RUNS, key=lambda r: r.get("recorded_at", ""), reverse=True)
    total = len(sorted_runs)

    # Apply offset and limit for pagination
    start_index = offset
    end_index = min(offset + limit, total)

    # Ensure start_index is not out of bounds, adjust if necessary for empty results
    if start_index >= total and total > 0:
        start_index = max(0, total - limit)
        end_index = total
    elif start_index >= total and total == 0:
        start_index = 0
        end_index = 0

    paginated_runs = sorted_runs[start_index:end_index]

    return {
        "runs": [OpsRunResponse(**r) for r in paginated_runs],
        "pagination": {
            "offset": start_index,
            "limit": limit,
            "total": total,
            "has_next": end_index < total,
            "has_prev": start_index > 0,
            "next_offset": end_index if end_index < total else None,
            "prev_offset": max(0, start_index - limit) if start_index > 0 else None,
        },
    }


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
