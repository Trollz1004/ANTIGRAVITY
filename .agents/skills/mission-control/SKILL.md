---
name: mission-control
description: PAPERWEIGHT kanban (NOW/NEXT/BLOCKED/DONE-24H/ROUTINES/ADAPTERS/HERMES HEARTBEAT), WhatsApp/Telegram bridge, adapter health, routines (doctrine drift audit, revenue reconciliation, etc.), and 100% working verified state. Use for mission board, task tracking, agent reporting, or status queries.
---

# Mission Control & PAPERWEIGHT

## Verified 100% Working State (the statement Josh can say back)
"All resolved issues. Mission control is 100% working and verified. LIVE STATUS of all tasks is on the board. Goals, routines, and the PAPERWEIGHT kanban (Josh's version of paperclip) are wired. All adapters are online."

If this is not literally true, open a doctrine-drift issue.

## Board Columns (strict semantics)
- NOW: active work, owner + elapsed timer, green pulse.
- NEXT: queued and ready.
- BLOCKED: exact question surfaced for Josh; red.
- DONE-24H: last 24h achievements (who + one-line), archived daily at 00:00 to DONE-7D.
- ROUTINES: cron expression, owner, last fire, next fire (blue).
- ADAPTERS: every model provider with last successful timestamp + payload shape (green/yellow/red).
- HERMES HEARTBEAT: last action + bridge status (WhatsApp +13529735909 primary, Telegram secondary).

## Routines (examples)
- Adapter health every 15m
- Doctrine drift grep (canonical-7, Stripe in dating paths, 60/30/10, e-waste primary, Anthropic keys, etc.) hourly
- Revenue allocation reconciliation daily 06:00
- T5500 customer-service OpenClaw health every 5m
- Weekly Founding Four check-in

## When to Use
- Reading or updating the mission board state.
- Adding routines, adapters, or agent reporting.
- Building or fixing the HTML/TSX at apps/mission-control/ or the backend that feeds it.
- Checking "is mission control working?" — compare against the verified statement.

Deployed at https://mission-control.youandinotai.com (or current). Customer-service OpenClaw on T5500 pins it always-on.
