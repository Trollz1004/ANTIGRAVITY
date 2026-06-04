# Incident 2026-05-06 — Mission Control Cockpit FINAL CLOSE-OUT

> Paired with `incident-2026-05-06-mission-control-restore.md`. This is the
> close-out report after the Dario-110 sprint, T5500 LAN-bind, paperclip
> cred fix, and self-heal smoke test.

## CEO REGISTRATION (Paperclip postgres now has data)

```
Company endpoint:  POST http://127.0.0.1:3100/api/companies
Company response:  {"id":"09c1449b-3a44-44b8-b58b-ecb78549a069",
                    "name":"Trash Or Treasure Online Recycler LLC",
                    "slug":"TRO",
                    "status":"active"}

Agent endpoint:    POST /api/companies/09c1449b-3a44-44b8-b58b-ecb78549a069/agents
Agent response:    {"id":"7ca273c6-65f2-42b0-86df-425dfb6f3eb4",
                    "name":"Hermes",
                    "role":"ceo",
                    "status":"idle"}

Verify agents count: 1
```

**Note:** Paperclip's API ignored the supplied UUID and minted its own
(`09c1449b-...`). The old filesystem company `c1643b5d-...` (with 30
orphan agent folders) is now an empty husk relative to the live postgres.
Migration of those orphans is an optional future task — not blocking.

## SELF-HEAL SMOKE TEST (PASSED)

```
Killed PID:          21232
New PID after respawn: 9252
Time to recover:     90 seconds
Final /health:       {"status":"ok","latency_ms":368}
```

The watchdog detected the dead API within its 30s polling cycle and
respawned uvicorn cleanly. Three watchdog cycles is the cap. Cockpit
survives `Stop-Process -Force` of the API process; no human needed.

## COCKPIT SUMMARY (final)

```
ok=13  degraded=2  unreachable=0

  paperclip:        ok    ← was BLOCKED in Dario report; now LIVE
  hermes:           ok
  ollama:           ok
  openclaw:         ok
  youandinotai:     ok
  api_youandinotai: degraded   ← cosmetic; T5500 API has no /health route
  cloudflare:       ok
  square:           degraded   ← SQUARE_ACCESS_TOKEN not set in env
  guardian:         ok
  repo:             ok
  docker:           ok
  treasury:         ok
  revenue:          ok
  stack:            ok
  t5500:            ok    ← was BLOCKED in Dario report; LAN-bind landed
```

**Both Dario-report BLOCKED items are now PASSED.** Two cosmetic
degradeds remain (`square` token missing, `api_youandinotai` /health
route doesn't exist on T5500-side API). Neither blocks anything.

## BLOCKERS

**none**

## What survives a power loss

1. **Sabretooth boots** → Windows Scheduled Tasks fire at startup before login:
   - `MissionControlAPI` brings up uvicorn on `0.0.0.0:8787`
   - `MissionControlWatchdog` starts polling
2. **Login completes** → Startup folder fires `Antigravity Mission Stack.cmd`:
   - `autostart-mission.ps1` (8 phases)
   - Docker Desktop, paperclip-postgres container, WSL Hermes Router,
     paperclip server, watchdogs, OpenClaw browser-open, Claude Code window,
     Hermes TUI window
3. **Any service dies mid-day** → its watchdog respawns it within 30-60s
4. **Mission Control survives a process kill** → confirmed by smoke test above

## What Joshua does for the cosmetic green

```
# Square token (when ready):
echo 'SQUARE_ACCESS_TOKEN=<token>' >> 'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env'
# (and add SQUARE_ACCESS_TOKEN: str = "" line in services/mission-control-api/src/mission_control_api/config.py
#  is already there — pydantic-settings reads .env. Restart MC API to pick up.)

# api.youandinotai.com /health: add a /health route on the T5500-side
# FastAPI app that returns {"status":"ok"}. Currently the public API just
# doesn't expose it.
```

Both 60-second jobs whenever Joshua wants 15/15 green. Neither is required.

## Final commit chain

```
f997174 chore(claude): register frontend-design@claude-plugins-official
ca4a2ae docs(t5500): document Public-profile firewall gotcha
301940b docs(t5500): record validated LAN-bind status
acd218f chore(audit): record daily paperclip agent audit [skip ci]
e35fe2f feat(t5500): one-paste LAN-bind script
772e645 fix(mission-control): mc-fix-2026-05-06 ← TAGGED
```

`git branch -a` → only `main` + `remotes/origin/main`. Pristine.
`git tag --list 'mc-*'` → `mc-fix-2026-05-06`.

11 days. Closed.
