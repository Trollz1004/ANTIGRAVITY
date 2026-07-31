# DEVELOPMENT BRIEFING — 2026-07-31

Follow-up to `DEVELOPMENT-BRIEFING-2026-07-29.md`. Session focus: kill the
port-3200 browser-spam glitch, wire named executors into Mission Control v5,
stabilize OpenClaw memory, and hand the stack back to visible, manual control.

## 1. Root cause: the port-3200 browser spam (FIXED)

- `bootstrap.ps1 → Start-DateAppFrontend` set `$env:PORT='3200'` in the watch
  supervisor's own process, permanently poisoning its environment.
- Every later restart of OmniRoute / the Mission Control server inherited
  `PORT=3200` (dotenv never overrides an existing process env var, so
  OmniRoute's own `PORT=20128` lost). OmniRoute opened its dashboard at
  `localhost:3200`, failed to bind (`EADDRINUSE`), crashed, and the watchdog
  relaunched it every ~70s → endless browser tabs.
- A second loop: the watchdog's OmniRoute health probe hit `/v1/models`, which
  now requires auth → 401 → "down" → restart → more dashboards.
- Fixes in `mission-control-v5/scripts/bootstrap.ps1`:
  - `PORT` is now scoped to the DateApp worker only (set → start → restore).
  - `Start-Omniroute` / `Start-MissionControlServer` clear any leaked `PORT`.
  - OmniRoute health check is port-only (no authed HTTP probe).
  - Kill switch: `scripts/WATCHDOG.DISABLED` — while present, bootstrap exits
    immediately (the scheduled task needs admin to disable; this doesn't).
    **Delete that file to re-enable the supervisor.**

## 2. Watchdogs and auto-start: everything is manual now (by request)

- All Hermes_* scheduled tasks disabled; startup-folder watchdog .vbs entries
  renamed `.disabled` (Ollama, HermesWorkspace, Hermes_Gateway_dateapp,
  OpenClaw Gateway).
- Four tasks need admin to disable (`MissionControlWatchdog`,
  `DateAppStaticServer`, `Hermes_Gateway`, `T5500-DateApp-Cloudflared`) — the
  watchdog is neutered by the kill-switch file regardless.
- Replacement: `mission-control-v5/scripts/launch-stack.cmd` opens ONE Windows
  Terminal with five visible tabs — `omniroute serve` (:20128), `fcc-server`
  (:8082), `fcc-claude`, Hermes dashboard :9119, OpenClaw TUI (ClawX-bundled
  CLI). Auto-runs at logon via Startup entry `ANTIGRAVITY-Stack-Terminal.cmd`
  (delete it to opt out).

## 3. Port doctrine (canonical)

| Service                    | Port   | Owner                                    |
|----------------------------|--------|------------------------------------------|
| OmniRoute gateway + UI     | 20128  | `omniroute serve` (= `fcc-serve`). Factory setting, only port it ever uses. AI endpoints: `http://localhost:20128/v1` |
| Mission Control v5 server  | 3151   | `npm start` in mission-control-v5        |
| DateApp frontend           | 3200   | DateApp only — nothing else binds it     |
| DateApp backend            | 8000   | uvicorn FastAPI                          |
| OpenClaw gateway           | 18789  | **ClawX auto-starts it at login.** Never run a second gateway (dual gateways clobber `openclaw.json`) |
| Hermes dashboard           | 9119   | `hermes dashboard --port 9119`           |
| Ollama                     | 11434  | local models                             |

## 4. Mission Control v5: named executors (NEW)

Tasks now carry an executor (UI: composer step "03 — EXECUTOR"):

- **AUTO** — classic OmniRoute provider order.
- **ORNITH** — local `ollama/ornith:9b`, falls back to `ollama/gemma4:latest`
  (smallest local gemma4, browser-capable).
- **FCC OPUS** — `cc/claude-opus-4-8` through the OmniRoute gateway, falls
  back to `auto/claude-opus`.

Config lives in `server/.env` (`EXEC_*` vars). The gateway now requires auth on
`/v1/*`; the server reuses `OMNIROUTE_API_KEY` automatically.

## 5. OpenClaw memory (FIXED)

- Removed the conflicting `agents.defaults.memorySearch.local.modelPath`
  (HuggingFace GGUF download — network-flaky). Memory embeddings now run fully
  local: provider `ollama`, model `nomic-embed-text`.
- The `.clobbered` config backups were caused by two gateways (old 9119
  launcher + bootstrap's 9120) writing `openclaw.json` concurrently. Single
  gateway now: ClawX's on :18789. Backup: `openclaw.json.bak-claude-20260731`.

## 6. Hermes → OmniRoute

`~/.hermes/config.yaml` now routes primary + delegation models through
`http://localhost:20128/v1` (provider `omniroute`, default `auto/best-coding`);
the direct-ollama provider remains as secondary. Backup:
`config.yaml.bak-claude-20260731`.

## 7. FCC (Free Claude Code) — restored and routed through OmniRoute

CORRECTION from earlier in the day: FCC is a separate tool, NOT an omniroute
alias. It was reinstalled from the cloned repo `E:\ANTIGRAVITY\free-claude-code`
(github.com/Alishahryar1/free-claude-code) via `uv tool install .`:

- `fcc-server` — the FCC proxy on :8082 (Admin UI http://127.0.0.1:8082/admin).
  `fcc-serve` (no r) also works — a forgiveness shim in `%APPDATA%\npm`.
- `fcc-claude` — launches the real Claude Code CLI through the proxy. It reads
  the same `~/.claude` config/CLAUDE.md as normal Claude Code, so keep those
  files lean (~40k forces a compaction rewrite no matter the rules).
- Why it "never worked": the tool wasn't installed at all, AND stale Windows
  user/machine env vars (`MODEL_OPUS=nvidia_nim`, truncated) crashed the server
  on boot. Fixed at user scope.
- Model tiers now route through OmniRoute via FCC's bedrock provider slot
  (`BEDROCK_BASE_URL=http://localhost:20128`): Opus→`cc/claude-opus-4-8`,
  Sonnet→`auto/best-coding`, Haiku→`auto/best-fast`. NVIDIA NIM keys stay in
  `~/.fcc/.env` as the switchable fallback. Backup: `.env.bak-claude-20260731`.

## 8. Agent doctrine

`CLAUDE.md`, `AGENTS.md` (repo + OpenClaw workspace) and the heartbeat file now
state: low-context sessions, read state on session start, load a skill before
EVERY task (agent-browser, find-skills, skill-creator, caveman/skills.sh,
Hermes hub, Claw hub), write state on session end. No skill loaded on a task =
task done wrong.

## 9. Repo

Single branch (`main`) — nothing to merge or delete. The
#TeamClaudeForLife meme stays in the README, permanently.
