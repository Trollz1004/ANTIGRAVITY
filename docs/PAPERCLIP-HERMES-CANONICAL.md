# Paperclip Hermes — Canonical Local Wiring

Last updated: 2026-07-01

## Identity

Hermes is the Paperclip CEO/operator for this repo. There should not be separate "Hermes dashboard", "Hermes workspace", and "Paperclip Hermes" personalities drifting apart.

Canonical runtime map:

| Surface | Port | Purpose |
|---|---:|---|
| FCC / `fcc-claude` adapter | `8082` | Claude-shaped coding/reasoning adapter. `fcc-claude` talks to this server. |
| Hermes Workspace | `3000` | Canonical Hermes CEO web UI — Joshua's preferred surface over stock Hermes Desktop/CLI. **Hard dependency: only works correctly if the Hermes dashboard CLI has already been run and `9119` is up.** Starting Workspace before `9119` is live gives a broken/partial UI. |
| Hermes Agent dashboard | `9119` | Real Hermes dashboard APIs (`/api/status`, sessions, config, skills). Must be started **first**, via the `hermes dashboard` CLI command, before Workspace on `3000` is opened. |
| Paperclip HQ | `3110` | Paperclip local app. Started by `scripts/start-paperclip.ps1`. **Not `3100`** — `3100` is not this repo's Paperclip HQ port. |

## Start / repair

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File c:\antigravity\scripts\start-paperclip-hermes.ps1
```

That command starts any missing pieces:

- `fcc-server` on `:8082`
- Hermes Workspace from `C:\Users\joshl\hermes-workspace` on `:3000`
- Hermes Agent dashboard on `:9119`

To also start Paperclip HQ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File c:\antigravity\scripts\start-paperclip-hermes.ps1 -AlsoStartPaperclip
```

## Watchdog

`scripts/paperclip-watchdog.ps1` keeps `8082`, `3000`, and `9119` alive. If run with `-AlsoStartPaperclip`, it also keeps `3110` alive.

`register-paperclip-forever.ps1` registers the watchdog with Windows Task Scheduler and now points at this watchdog. The watchdog does not invent a second Hermes; it calls `start-paperclip-hermes.ps1` so the ports converge on the same Hermes identity.

## Agent rule

- Use `.claude/agents/fcc-claude.md` as the Claude adapter. It must route through local FCC on `http://127.0.0.1:8082`; do not wire Anthropic keys.
- Use `.claude/agents/hermes.md` as Paperclip Hermes CEO/operator. Hermes may scout revenue, but in Paperclip context Hermes owns triage, delegation, and keeping Paperclip/FCC/workspace state aligned.
