from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from .status import Check, now_iso, worst_status

app = FastAPI(title="ANTIGRAVITY Health Aggregator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _category(name: str, checks: list[Check]) -> dict:
    return {
        "name": name,
        "status": worst_status(checks),
        "checks": [check.as_dict() for check in checks],
    }


@app.get("/health/all")
def health_all() -> dict:
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


@app.get("/events/tail")
def events_tail() -> dict:
    return {"captured_at": now_iso(), "events": read_events_tail()}
