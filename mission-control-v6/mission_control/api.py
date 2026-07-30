"""FastAPI surface for Mission Control v6.

Routes
    GET  /                        dashboard (HTML)
    GET  /healthz                 liveness for supervisors
    GET  /api/status              counts + per-service state + active alert count
    GET  /api/services            service list with state
    GET  /api/services/{id}       one service + its playbook text
    POST /api/services/{id}/check force a probe right now
    POST /api/services/{id}/fix   THE EASY BUTTON — run the allow-listed playbook
    GET  /api/alerts              alerts (?active=true for unresolved)
    POST /api/alerts/{id}/ack     acknowledge an alert
    GET  /api/history             recent checks / alerts / fix runs
    GET  /api/links               the "omni route" navigation targets
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse

from . import __version__
from .config import Config, load_config
from .dashboard import render_dashboard
from .models import Alert
from .monitor import Monitor
from .notify import build_hub, NotifyMessage
from .remediation import playbook_for_service, render_playbook_text
from .store import Store

_TOKEN_HEADERS = ("x-mc-token",)


def _token_guard(config: Config):
    """Dependency factory: enforce the token only when one is configured."""

    async def guard(request: Request) -> None:
        expected = config.server.api_token
        if not expected:
            return
        provided = ""
        for header in _TOKEN_HEADERS:
            if request.headers.get(header):
                provided = request.headers[header]
                break
        auth = request.headers.get("authorization", "")
        if not provided and auth.lower().startswith("bearer "):
            provided = auth[7:].strip()
        if provided != expected:
            raise HTTPException(status_code=401, detail="missing or invalid mission-control token")

    return guard


def _alert_payload(alert: Alert, config: Config, base_url: str) -> dict:
    spec = config.service(alert.service_id)
    playbook = playbook_for_service(spec, config.playbooks) if spec else None
    fix_hint = [
        f"EASY BUTTON: curl -X POST {base_url}/api/services/{alert.service_id}/fix",
        f"Dashboard : {base_url}/#service-{alert.service_id}",
        "",
        render_playbook_text(playbook),
        "",
        f"last check: {alert.detail}",
    ]
    data = alert.to_dict()
    data["fix_hint"] = "\n".join(fix_hint)
    return data


def create_app(config_path: Optional[str] = None, *, config: Optional[Config] = None) -> FastAPI:
    cfg = config or load_config(config_path)
    store = Store(cfg.state_db_abs())
    hub = build_hub(cfg.notifiers, resolve_path=cfg.notifier_path_abs)
    monitor = Monitor(cfg, store, hub)

    app = FastAPI(title="ANTIGRAVITY Mission Control", version=__version__)
    app.state.config = cfg
    app.state.store = store
    app.state.monitor = monitor
    app.state.hub = hub

    guard = Depends(_token_guard(cfg))

    @app.on_event("startup")
    async def _startup() -> None:
        await monitor.start()

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await monitor.stop()
        store.close()

    @app.get("/", response_class=HTMLResponse)
    async def dashboard() -> HTMLResponse:
        return HTMLResponse(render_dashboard(cfg))

    @app.get("/healthz")
    async def healthz() -> dict:
        return {"ok": True, "name": "antigravity-mission-control", "version": __version__}

    @app.get("/api/status")
    async def status() -> dict:
        payload = monitor.snapshot()
        payload.update({"ok": True, "version": __version__, "name": "antigravity-mission-control"})
        return payload

    @app.get("/api/services")
    async def services() -> dict:
        return {"services": monitor.snapshot()["services"]}

    @app.get("/api/services/{service_id}")
    async def service_detail(service_id: str) -> dict:
        runtime = monitor.runtimes.get(service_id)
        if runtime is None:
            raise HTTPException(status_code=404, detail=f"unknown service: {service_id}")
        data = monitor._service_snapshot(runtime)
        pb = playbook_for_service(runtime.spec, cfg.playbooks)
        data["playbook_text"] = render_playbook_text(pb)
        return data

    @app.post("/api/services/{service_id}/check", dependencies=[guard])
    async def check_now(service_id: str) -> dict:
        if service_id not in monitor.runtimes:
            raise HTTPException(status_code=404, detail=f"unknown service: {service_id}")
        result = await monitor.run_service_once(service_id)
        return {"result": result.to_dict(), "state": monitor.runtimes[service_id].state.value}

    @app.post("/api/services/{service_id}/fix", dependencies=[guard])
    async def fix(service_id: str) -> JSONResponse:
        spec = cfg.service(service_id)
        if spec is None:
            raise HTTPException(status_code=404, detail=f"unknown service: {service_id}")
        if not spec.playbook:
            raise HTTPException(status_code=404, detail=f"service {service_id} has no fix playbook")
        outcome = await monitor.fix(service_id, requested_by="manual")
        fix_detail = outcome["fix"].get("detail", "")
        if "already running" in fix_detail:
            return JSONResponse(status_code=409, content=outcome)
        if "cooldown" in fix_detail:
            return JSONResponse(status_code=429, content=outcome)
        return JSONResponse(status_code=200, content=outcome)

    @app.get("/api/alerts")
    async def alerts(active: bool = False, limit: int = 100) -> dict:
        base_url = cfg.server.resolved_base_url()
        rows: List[Alert] = store.list_alerts(active_only=active, limit=min(limit, 500))
        return {"alerts": [_alert_payload(a, cfg, base_url) for a in rows]}

    @app.post("/api/alerts/{alert_id}/ack", dependencies=[guard])
    async def ack_alert(alert_id: int) -> dict:
        if store.get_alert(alert_id) is None:
            raise HTTPException(status_code=404, detail=f"unknown alert: {alert_id}")
        acknowledged = store.acknowledge_alert(alert_id)
        return {"ok": True, "acknowledged": acknowledged}

    @app.post("/api/notify/test", dependencies=[guard])
    async def notify_test() -> dict:
        message = NotifyMessage(
            subject="TEST: Mission Control notification pipeline",
            text=("This is a live test of every configured notifier.\n\n"
                  f"Dashboard: {cfg.server.resolved_base_url()}\n"
                  "If you can read this in your configured channel (webhook / email / file / console), "
                  "real DOWN alerts will reach you the same way — each with its easy-button fix inside."),
            level="test",
        )
        report = await hub.broadcast(message)
        return {"ok": True, "report": report}

    @app.get("/api/history")
    async def history(limit: int = 100) -> dict:
        limit = max(1, min(limit, 500))
        return {
            "checks": store.recent_checks(limit=limit),
            "alerts": [a.to_dict() for a in store.list_alerts(active_only=False, limit=limit)],
            "fix_runs": [r.to_dict() for r in store.list_fix_runs(limit=limit)],
        }

    @app.get("/api/links")
    async def links() -> dict:
        base_url = cfg.server.resolved_base_url()
        builtin = [
            {"id": "status", "label": "MC API status", "url": f"{base_url}/api/status", "group": "mission-control"},
        ]
        return {"links": builtin + [link.to_dict() for link in cfg.links]}

    return app
