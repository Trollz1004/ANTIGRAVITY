# T5500 Node Health & Tunnel Status (TRO-75)

Updated: 2026-07-02 (by support agent 78788781-3631-4f10-9bae-d9fb10c2adbc during heartbeat)

## Summary
- Node: DESKTOP-H4B53GL @ 192.168.0.15 (T5500, public front door)
- Reachable: yes (SSH from Sabretooth)
- Cloudflared (tunnel connector): Service=Running (Automatic), process active (started ~2026-07-01)
- youandinotai.com (static front): **200 OK** (served via tunnel + local 3200)
- api.youandinotai.com : 502 (origin not responding reliably)
- Local listeners started: static 3200 (via scheduled task), backend 8000 (transient)

## Diagnostics Performed
- SSH connectivity confirmed.
- Cloudflared service and proc verified running.
- No initial listeners on 80/443/8000/3200/3000 -> started them.
- Started ANTIGRAVITY-DateApp-Static-3200-SYSTEM -> 3200 listening (node).
- Fixed corrupt lines in starter scripts (stray "parent of ..." merge artifacts) in:
  - scripts/t5500/Start-YouAndINotAI-Tunnel.ps1
  - scripts/t5500/Start-YouAndINotAI-PublicStack.ps1
- Backend (uvicorn via .venv python on 8000): starts, logs "Application startup complete", serves requests briefly, then stops listening. Root cause in startup logs: Redis health fails ("Connection closed by server"), other deps (DB via compose) may be partial.
- Public re-probe after static up: main domain green; api still 502.
- Public main now returns proper 200 with title "YouAndINotAI - A social platform for showing up".
- Tunnel logs (old) showed previous 8000 refused (pre-fix); current connector should pick up if stable origin.

## Next / Remaining for full green
- Ensure redis:6379 and postgres:5432 are healthy full stack (docker compose up or existing containers).
- Investigate why uvicorn exits after startup (check full lifespan, health handler DB/redis timeouts, possible unhandled in scheduler/monitoring).
- Restart cloudflared tunnel connector after stable origins (or rely on its reconnect).
- Verify /api/v1/health returns 200 JSON (not HTML or timeout) both local and via api.youandinotai.com .

## Additional LAN Connectivity Evidence (background probe)
Background task (full Test-Connection + ping + Test-NetConnection for 80/443/8000/8080/3000/3110/9000) run ~2026-07-02T08:07-08:10 from operator node (192.168.0.8):
- ICMP / Test-Connection: 100% loss, all TimedOut.
- All listed ports: False (no direct TCP reachability).

This is expected for tunnel-fronted node. SSH (22) succeeded separately; public traffic flows exclusively through Cloudflare + local cloudflared → origin ports on T5500. Direct LAN app port access is intentionally not available/ firewalled from other nodes.
- Consider enabling the disabled scheduled tasks: YouAndINotAI-PublicStack-T5500 etc for auto recovery.
- Update this file + health checks on future heartbeats.

## Evidence
- SSH diagnostics + port/process checks executed on node.
- Public HEAD/GET probes from operator node.
- Local logs tailed from T5500 (youandinotai-*.log, tunnel logs).
- Script fixes committed in workspace.

One-line outcome status: Partial - main public front door serving (static); api backend not stable yet.
