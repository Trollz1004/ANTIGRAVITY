---
name: mission-control-live
description: Use when starting or verifying the MC6 LIVE STATUS board (legacy uptime dashboard — current Mission Control is Paperclip at :3100; see the `mission-control` skill).
---

# MC6 legacy uptime board — NOT Mission Control

> Current Mission Control is **Paperclip** at `:3100`
> (`GET /api/openapi.json` → `.info.title == "Paperclip API"`). MC6 below is a
> separate legacy uptime board (fact sheet: MC6 :8787).

- Code: `mission-control-v6/` start via START-MISSION-CONTROL.cmd
- Visible window preferred (not headless) when ops on this box
- Columns: NOW NEXT BLOCKED DONE-24H ROUTINES ADAPTERS HERMES HEARTBEAT
- No fake green: empty 200 = red
- Workspace C: only on this machine
