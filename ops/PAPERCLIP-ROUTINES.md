# Paperclip routines — clean repo

Recurring maintenance and agent-cadence routines for the Paperclip instance
bound to `Trollz1004/clean` (`E:\clean`, `main` only). This doc is the single
place these routines are defined — the health-check script, the schtasks
registration, and the agent cadence in `PAPERCLIP-AGENT-STATUS.md` all point
back here.

## Daily

| Routine | What | How |
|---|---|---|
| Health check | Confirm Ollama (:11434), OmniRoute (:20128), OpenClaw (:18789), Paperclip local (:3120), Paperclip public (`paperclip-clean.youandinotai.com/api/health`) are all responding | `scripts/paperclip-healthcheck.ps1` — see below |
| Agent status update | CEO / Founding Engineer agents update `ops/PAPERCLIP-AGENT-STATUS.md` "Updated:" line and TRO checklist with real progress | See "Recurring Agent Routines" in that file |
| Cowork remote check-in | A scheduled Cowork task pings the public health URL and reports pass/fail to Josh in chat | Set up via `create_scheduled_task`, see below |

## Weekly

| Routine | What |
|---|---|
| Adapter sweep | Confirm anthropic/openai/google/xai/openrouter keys still authenticate (one cheap call each); confirm ollama-cloud billing status |
| Dependency sweep | Confirm Cloudflare tunnel `hermes-t5500` is up, embedded Postgres (54350) is reachable, no orphaned Paperclip processes |
| Log rotation | Trim `logs/failsafe/*.log` — keep last 14 days, do not delete without checking for unresolved FAILURES entries first |

## Health-check script

`scripts/paperclip-healthcheck.ps1` (non-elevated, runs as the current user):

- Checks each dependency port/endpoint in order and logs pass/fail with a
  timestamp to `logs\failsafe\paperclip-healthcheck.log`.
- If the **local** Paperclip endpoint (`:3120/api/health`) is down but the
  port isn't already listening, it launches `ops\launch-paperclip.cmd`
  (matches the existing non-admin launch pattern — do NOT run this elevated,
  embedded Postgres refuses under an admin token).
- Does not touch OmniRoute, Ollama, or OpenClaw — those have their own
  bootstrap scripts (`scripts/bootstrap/Start-OmniRoute.*`) and starting them
  from a health-check adds failure surface for no benefit; the script only
  reports their state.
- Exits non-zero on any failed check so Task Scheduler's history shows red
  when something's actually wrong (per the "verify the artifact, not the
  exit code" lesson — the script checks the real port/endpoint, not just
  whether a process launched).

### Register it (run this yourself — Claude has no access to the Windows
Task Scheduler on your machines)

```cmd
schtasks /create /tn "Paperclip-HealthCheck" ^
  /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\clean\scripts\paperclip-healthcheck.ps1" ^
  /sc daily /st 08:00 /ru "%USERNAME%"
```

Do not add `/rl highest` or run this as SYSTEM — same non-elevated rule as
everything else in this repo. Check history with:

```cmd
schtasks /query /tn "Paperclip-HealthCheck" /v /fo list
```

## Escalation

If the health check or an agent hits a hard failure (not just "quota
reserved," an actual outage), write a dated snapshot following the existing
pattern (`ops/PAPERCLIP-STATUS-YYYY-MM-DD.md`) instead of silently retrying.
This mirrors the legacy launcher's `FAILURES.txt` behavior: write it down,
don't paper over it.

## Cowork scheduled check-in

A Cowork scheduled task (`paperclip-health-checkin`) fetches
`https://paperclip-clean.youandinotai.com/api/health` daily and reports
status to Josh in chat — a second, independent signal from outside the local
network, on top of the local `schtasks` job above.
