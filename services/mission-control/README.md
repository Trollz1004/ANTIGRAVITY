# ANTIGRAVITY Mission Control

First-party local control surface for Sabretooth.

- URL: `http://127.0.0.1:3110`
- Health: `http://127.0.0.1:3110/api/health`
- Status: `http://127.0.0.1:3110/api/status`
- Runtime: Node built-ins only
- Data source: `ops/mission-control/board.json` plus compact agent state files

This replaces the third-party Paperclip runtime for the main human-facing board.
The old `scripts/start-paperclip.ps1` entrypoint is retained as a compatibility
launcher, but it now starts Mission Control.

Optional third-party workbenches can still sit idle in browsers. They are tools,
not authority. Use `scripts/start-third-party-paperclip.ps1` if Joshua wants the
third-party Paperclip package available without taking over `:3110`.

## Boundaries

- Local only by default: binds to `127.0.0.1`.
- No secrets are read or printed.
- Browser actions can open approved local shells, but cannot run arbitrary
  command strings.
- T5500, 9020, and future nodes report into this board; they do not become
  separate command centers.
- Optional browser workbenches may remain available if they do not create hidden
  backlogs or override Mission Control.

## API Contract

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/`, `/board` | HTML Mission Control board |
| `GET` | `/api/health` | Local liveness. Aliases: `/health`, `/healthz` |
| `GET` | `/api/status` | Main UI read model: Agent Hub health, visible agents, lanes, routines, issues, tools, terminal actions, domain routes, and recent events |
| `POST` | `/api/terminal/open` | Opens one approved local shell by id |

`/api/status` reads from `ops/mission-control/board.json`,
`ops/mission-control/domain-routes.json`, compact
`paperclip-tro/agents/*/STATE.md` and `HEARTBEAT.md` files, the local JSONL
event log, and Agent Hub health.

## Terminal Safety

`POST /api/terminal/open` accepts only one approved shell id:

```json
{ "shell": "powershell" }
```

Allowed shell ids are `powershell`, `cmd`, `wsl`, and `bash`. The browser cannot
send arbitrary commands, arguments, environment variables, working directories,
or script paths.

If Mission Control is ever exposed through Cloudflare Access, terminal opening
must be disabled or separately protected by an explicit local-admin gate.
