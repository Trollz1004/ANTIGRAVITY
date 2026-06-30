# Mission Control Backend Services

These three services power the live data for `apps/mission-control/index.html`:

- `KANBAN_STATE_LOGGER.py` — HTTP API for the 7-lane Kanban state (T5500 port 3200)
- `SABRETOOTH_FAILSAFE.py` — WebSocket server on 3300 (the "Sabretooth ledger" the dashboard connects to)
- `T5500_CREDIT_MONITOR.py` — Manus credit monitoring + alerts to Sabretooth when <10%

## Routing Reality (as of this branch)
- All Grok traffic **must** go through Hermes (`127.0.0.1:11435`) using **xAI user-auth sign-in** (no raw OpenRouter keys).
- Hermes is the single router. CFO local model and Grok (xAI) are the primary brains for #UntilNoKidInNeed work.
- These backends report real-time activity so the dashboard never shows "idle".

## Quick Start (Sabretooth primary)
```powershell
cd services\mission-control-backend

# Terminal 1 — Kanban state (usually on T5500, but can run here for dev)
python KANBAN_STATE_LOGGER.py

# Terminal 2 — Failsafe WS (Sabretooth)
python SABRETOOTH_FAILSAFE.py

# Terminal 3 — Credit monitor (T5500)
python T5500_CREDIT_MONITOR.py
```

The dashboard at `apps/mission-control/index.html` will then show live activity with **who** is working and current status.

## Doctrine Notes
- Business-only product surface: membership, verification, support, safety, uptime, and platform value
- Square only (LY5GN09F5AN83)
- No charity, donation, fundraising, ownership, control, or investment claims on public surfaces
- Everything stays inside Trollz1004/ANTIGRAVITY on this branch

Part of the `feature/mission-control-hermes-live` integration.
