# Freebuff CEO HEARTBEAT

## Report shape

Each session end, write one status line the dashboard reads:
- `GREEN: <fact> — <evidence handle>`
- `YELLOW: <what is unconfirmed>`
- `RED: <blocker> — <next action>`

## Current

RED: Legacy coordination bridge :3140 and OpenClaw :18789 are retired/down; OmniRoute (`http://192.168.0.15:20128/v1`) requires authentication; active orchestration runs in Mission OS (`http://192.168.0.15:3130`). Evidence: 2026-08-26 session probes + `ops/fleet/fleet-map.json`.
