from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .probes.events import probe_paperweight_audit, read_events_tail
from .probes.github_ci import probe_github
from .probes.graphify import probe_graphify
from .probes.hermes import probe_hermes
from .probes.mission_mcp import probe_mission_mcp
from .probes.nodes import probe_nodes
from .probes.pages import probe_pages
from .probes.revenue import probe_revenue
from .probes.t5500_services import probe_t5500_services
from .probes.vault import probe_graph_device_list, probe_vault_feature, probe_vault_sync
from .repair import (
    RepairAction,
    RepairStore,
    dispatch_repair,
    submit_repairs_for_health,
)
from .status import Check, now_iso, worst_status


app = FastAPI(title="ANTIGRAVITY Health Aggregator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Process-wide repair store. Each uvicorn worker maintains its own; a real
# deployment would back this with Redis/sqllite. The on-disk audit log is
# the durable source of truth.
repair_store = RepairStore()


def _category(name: str, checks: list[Check]) -> dict:
    return {
        "name": name,
        "status": worst_status(checks),
        "checks": [check.as_dict() for check in checks],
    }


def _build_health() -> dict:
    categories = [
        _category("nodes", probe_nodes()),
        _category("t5500_services", probe_t5500_services()),
        _category("cloudflare_pages", probe_pages()),
        _category("hermes_router", probe_hermes()),
        _category("mission_mcp", probe_mission_mcp()),
        _category("github_ci", probe_github()),
        _category("revenue_today", probe_revenue()),
        _category("vault_health", [*probe_vault_sync(), probe_graph_device_list(), probe_vault_feature()]),
        _category("paperweight_audit", probe_paperweight_audit()),
        _category("graphify", probe_graphify()),
    ]
    overall = worst_status([Check(category["name"], category["status"], "") for category in categories])
    return {
        "captured_at": now_iso(),
        "overall": overall,
        "counts": {
            "green": sum(1 for category in categories if category["status"] == "green"),
            "yellow": sum(1 for category in categories if category["status"] == "yellow"),
            "red": sum(1 for category in categories if category["status"] == "red"),
        },
        "categories": categories,
        "events_tail": read_events_tail(),
    }


@app.get("/health/all")
def health_all() -> dict:
    return _build_health()


@app.get("/events/tail")
def events_tail() -> dict:
    return {"captured_at": now_iso(), "events": read_events_tail()}


# ---------------------------------------------------------------------------
# One-click repair API
# ---------------------------------------------------------------------------


class RepairPlanRequest(BaseModel):
    auto_dispatch: bool = Field(
        default=False,
        description="If true, also run the SSH repair synchronously. Otherwise tickets are queued for review.",
    )


class RepairPlanResponse(BaseModel):
    scanned_at: str
    submitted: list[dict]


@app.post("/repair/plan", response_model=RepairPlanResponse)
def repair_plan(payload: RepairPlanRequest) -> RepairPlanResponse:
    """Inspect the latest /health/all snapshot and submit a ticket for every red check.

    This is the "one-click" entrypoint: a single POST walks every red
    service, classifies it into a known playbook, and queues a repair
    ticket. With `auto_dispatch=true` it also runs the SSH command for
    each ticket; with `auto_dispatch=false` (default) tickets are
    staged for human/operator approval.
    """

    health = _build_health()
    submitted = submit_repairs_for_health(health, repair_store)
    if payload.auto_dispatch:
        for ticket in submitted:
            try:
                dispatch_repair(repair_store, ticket.id)
            except KeyError:
                continue
    return RepairPlanResponse(
        scanned_at=now_iso(),
        submitted=[ticket.to_dict() for ticket in submitted],
    )


class RepairRequest(BaseModel):
    target: str
    kind: str = "manual"
    reason: str = ""
    playbook: str = "manual"
    command: list[str] = Field(default_factory=list)
    ssh_target: str | None = None
    metadata: dict = Field(default_factory=dict)
    auto_dispatch: bool = False


@app.post("/repair")
def repair_submit(payload: RepairRequest) -> dict:
    """Submit a single explicit repair ticket.

    The dashboard uses this when the operator wants to fix a single named
    service (e.g. "rebind t5500:5432") without running the full plan.
    """

    action = RepairAction(
        target=payload.target,
        kind=payload.kind,  # type: ignore[arg-type]
        reason=payload.reason,
        playbook=payload.playbook,
        command=payload.command,
        ssh_target=payload.ssh_target,
        metadata=payload.metadata,
    )
    ticket = repair_store.submit(action)
    if payload.auto_dispatch:
        dispatch_repair(repair_store, ticket.id)
    return ticket.to_dict()


@app.get("/repair/tickets")
def repair_tickets() -> dict:
    return {
        "captured_at": now_iso(),
        "tickets": [ticket.to_dict() for ticket in repair_store.list()],
    }


@app.get("/repair/tickets/{ticket_id}")
def repair_get_ticket(ticket_id: str) -> dict:
    ticket = repair_store.get(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="ticket not found")
    return ticket.to_dict()


@app.post("/repair/tickets/{ticket_id}/dispatch")
def repair_dispatch(ticket_id: str) -> dict:
    try:
        ticket = dispatch_repair(repair_store, ticket_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="ticket not found")
    return ticket.to_dict()
