---
name: mission-control
description: PAPERWEIGHT kanban (NOW/NEXT/BLOCKED/DONE-24H/ROUTINES/ADAPTERS/HERMES HEARTBEAT), WhatsApp/Telegram bridge, adapter health, routines, and verified operating state. Use for task tracking, agent reporting, support workflow, or status queries.
---

# Ops Control & PAPERWEIGHT

## Verified 100% Working State (the statement Josh can say back)

"All resolved issues. Ops control is working and verified. LIVE STATUS of all tasks is on the board. Goals, routines, and the PAPERWEIGHT kanban are wired. All adapters are online."

If this is not literally true, open an ops-drift issue.

## Board Columns (strict semantics)

- NOW: active work, owner + elapsed timer, green pulse.
- NEXT: queued and ready.
- BLOCKED: exact question surfaced for Josh; red.
- DONE-24H: last 24h achievements (who + one-line), archived daily at 00:00 to DONE-7D.
- ROUTINES: cron expression, owner, last fire, next fire (blue).
- ADAPTERS: every model provider with last successful timestamp + payload shape (green/yellow/red).
- HERMES HEARTBEAT: last action + bridge status.

## Routines (examples)

- Adapter health every 15m
- Business-only public-surface audit hourly
- Payment reconciliation daily 06:00
- T5500 customer-service OpenClaw health every 5m
- Weekly agent/fleet check-in

## When to Use

- Reading or updating the ops board state.
- Adding routines, adapters, or agent reporting.
- Building or fixing the HTML/TSX at apps/mission-control/ or the backend that feeds it.
- Checking "is ops control working?" - compare against the verified statement.

Deployed at https://mission-control.youandinotai.com (or current). Customer-service OpenClaw on T5500 pins it always-on.
