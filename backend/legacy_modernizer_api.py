from __future__ import annotations

import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
SPRINTS = _db.sprints
API_GATES = _db.api_gates

router = APIRouter(prefix="/api")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Tech Debt Cleanup — Legacy Modernizer ────────────────────────────────────── #
class SprintCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(min_length=10, max_length=600)
    client: str = Field(min_length=2, max_length=80)
    legacy_systems: List[str] = Field(min_length=1)
    complexity_score: int = Field(ge=1, le=10)
    estimated_hours: int = Field(gt=0)
    monthly_budget: float = Field(gt=0)
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    bucket: int = Field(default=6, ge=1, le=10)  # Super Likes Match


@router.post("/sprints")
async def create_sprint(body: SprintCreate, request: Request):
    """Start a legacy modernization sprint — per the 4k weekly rhythm."""
    from auth_relay import require_admin

    require_admin(request)
    
    doc = {
        "id": str(uuid.uuid4().hex[:12]),
        "title": body.title,
        "description": body.description,
        "client": body.client,
        "legacy_systems": body.legacy_systems,
        "complexity_score": body.complexity_score,
        "estimated_hours": body.estimated_hours,
        "monthly_budget": body.monthly_budget,
        "status": "planned",  # planned | in_progress | testing | completed
        "bucket": body.bucket,
        "created_at": _now(),
        "updated_at": _now(),
    }
    await SPRINTS.insert_one(doc)
    return doc


@router.get("/sprints")
async def list_sprints(limit: int = 20):
    """Active modernization sprints."""
    rows = await SPRINTS.find({"status": "in_progress"}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"sprints": rows, "count": len(rows)}


@router.put("/sprints/{sprint_id}/status")
async def update_sprint_status(sprint_id: str, status: str, request: Request):
    """Advance sprint through modernization phases."""
    from auth_relay import require_admin

    require_admin(request)
    
    valid_statuses = ["planned", "in_progress", "testing", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"invalid status '{status}'")
    
    res = await SPRINTS.update_one(
        {"id": sprint_id},
        {"$set": {"status": status, "updated_at": _now()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="sprint not found")
    
    sprint = await SPRINTS.find_one({"id": sprint_id}, {"_id": 0})
    return {"ok": True, "sprint": sprint}


@router.post("/tech-debt/analyze")
async def analyze_tech_debt(payload: Dict[str, Any], request: Request):
    """Scan for technical debt — returns remediation priorities and bucket 6 charge."""
    # Simple mock implementation since we don't have an actual analyzer
    from auth_relay import require_admin

    require_admin(request)
    
    # Mock tech debt analysis
    legacy_systems = payload.get("legacy_systems", ["mainframe", "cobol"])
    complexity = sum(len(sys) for sys in legacy_systems)
    
    analysis = {
        "sprint_title": f"Legacy Modernization: {payload.get('project_name', 'Tech Debt')}",
        "legacy_systems_count": len(legacy_systems),
        "complexity_score": complexity,
        "estimated_hours": complexity * 40,
        "recommended_bucket": 6,  # Super Likes Match
        "priority": "HIGH" if complexity > 5 else "MEDIUM",
        "first_week_focus": [
            "Inventory all technical debt items",
            "Rank by business impact",
            "Create modernization roadmap",
        ],
        "estimated_roi": 0.75,  # 75% ROI
        "created_at": _now(),
    }
    
    # Create a sprint with the analysis results
    sprint_doc = {
        "id": str(uuid.uuid4().hex[:12]),
        "title": analysis["sprint_title"],
        "description": f"Technical debt cleanup for {payload.get('project_name', 'unnamed project')}",
        "client": "Internal",
        "legacy_systems": legacy_systems,
        "complexity_score": analysis["complexity_score"],
        "estimated_hours": analysis["estimated_hours"],
        "monthly_budget": analysis["estimated_hours"] * 50,  # $50/hr estimate
        "status": "in_progress",
        "bucket": analysis["recommended_bucket"],
        "created_at": _now(),
        "updated_at": _now(),
    }
    await SPRINTS.insert_one(sprint_doc)
    
    return analysis


# ── Guardian Gateway — API Sentry Gateway ──────────────────────────────────────── #
class ApiGateCreate(BaseModel):
    api_name: str = Field(min_length=2, max_length=120)
    target_url: str = Field(min_length=2, max_length=200)
    rate_limit_per_minute: int = Field(default=100, ge=1)
    rate_limit_per_day: Optional[int] = None
    bucket: int = Field(default=9, ge=1, le=10)  # Antigravity Reserve
    auth_enabled: bool = True
    cors_enabled: bool = True


@router.post("/api-gates")
async def create_api_gate(body: ApiGateCreate, request: Request):
    """Deploy an API sentry gateway — Guardian Gateway style."""
    from auth_relay import require_admin

    require_admin(request)
    
    doc = {
        "id": str(uuid.uuid4().hex[:12]),
        "api_name": body.api_name,
        "target_url": body.target_url,
        "rate_limit_per_minute": body.rate_limit_per_minute,
        "rate_limit_per_day": body.rate_limit_per_day,
        "bucket": body.bucket,
        "auth_enabled": body.auth_enabled,
        "cors_enabled": body.cors_enabled,
        "status": "active",
        "created_at": _now(),
        "updated_at": _now(),
    }
    await API_GATES.insert_one(doc)
    return doc


@router.get("/api-gates")
async def list_api_gates(limit: int = 20):
    """Active API sentry gateways."""
    rows = await API_GATES.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"api_gates": rows, "count": len(rows)}


@router.post("/api-gates/{gate_id}/track-request")
async def track_api_request(gate_id: str, payload: Dict[str, Any]):
    """Record an API request for rate limiting and monitoring."""
    gate = await API_GATES.find_one({"id": gate_id}, {"_id": 0})
    if not gate:
        raise HTTPException(status_code=404, detail="API gate not found")
    
    # Record the request
    request_record = {
        "id": str(uuid.uuid4().hex[:12]),
        "gate_id": gate_id,
        "timestamp": _now(),
        "client_ip": payload.get("client_ip"),
        "method": payload.get("method"),
        "path": payload.get("path"),
        "status_code": payload.get("status_code", 200),
        "response_time_ms": payload.get("response_time_ms"),
        "bucket": gate["bucket"],
    }
    await _db.api_requests.insert_one(request_record)
    
    return {"ok": True, "request_id": request_record["id"]}


@router.get("/api-gates/{gate_id}/stats")
async def get_api_gate_stats(gate_id: str, since_hours: int = 24):
    """Fetch gateway stats for billing ($0.05 per 1k requests)."""
    gate = await API_GATES.find_one({"id": gate_id}, {"_id": 0})
    if not gate:
        raise HTTPException(status_code=404, detail="API gate not found")
    
    since_time = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(hours=since_hours)
    
    pipeline = [
        {"$match": {
            "gate_id": gate_id,
            "timestamp": {"$gte": since_time.isoformat()}
        }},
        {"$group": {
            "_id": None,
            "total_requests": {"$sum": 1},
            "unique_ips": {"$addToSet": "$client_ip"},
            "status_codes": {"$push": "$status_code"},
        }},
        {"$project": {
            "total_requests": 1,
            "unique_ips": {"$size": "$unique_ips"},
            "avg_status": {"$avg": "$status_code"},
            "since_hours": since_hours,
        }},
    ]
    
    stats = await _db.api_requests.aggregate(pipeline).to_list(1)
    stats_result = stats[0] if stats else {"total_requests": 0, "unique_ips": 0, "avg_status": 0}
    
    # Calculate cost: $0.05 per 1k requests
    total_cost = round(stats_result["total_requests"] * 0.05 / 1000.0, 2)
    
    return {
        "gate_id": gate_id,
        "api_name": gate["api_name"],
        "bucket": gate["bucket"],
        "since_hours": since_hours,
        "total_requests": stats_result["total_requests"],
        "unique_ips": stats_result["unique_ips"],
        "avg_status_code": round(stats_result["avg_status"], 1),
        "estimated_cost_usd": total_cost,
        "requests_per_hour": round(stats_result["total_requests"] / since_hours, 1),
    }


@router.delete("/api-gates/{gate_id}")
async def delete_api_gate(gate_id: str, request: Request):
    """Deprovision an API sentry gateway."""
    from auth_relay import require_admin

    require_admin(request)
    
    res = await API_GATES.update_one(
        {"id": gate_id},
        {"$set": {"status": "decommissioned", "updated_at": _now()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="API gate not found")
    
    return {"ok": True, "decommissioned": gate_id}


# ── Service Runners ──────────────────────────────────────────────────────────── #

# Ensure indexes exist
async def _ensure_indexes():
    await SPRINTS.create_index("status")
    await SPRINTS.create_index("created_at")
    await API_GATES.create_index("status")
    await API_GATES.create_index("created_at")


_install_index_task = asyncio.create_task(_ensure_indexes())
