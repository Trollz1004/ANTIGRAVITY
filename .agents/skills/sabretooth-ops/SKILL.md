---
name: sabretooth-ops
description: Operate the SABRETOOTH-NODE stack end to end — start/verify OmniRoute (:20128) and MC5, the legacy vote-engine board (:3151; current Mission Control is Paperclip at :3100 — see the `mission-control` skill), run the judge-gated swarm, search the repo knowledge graph, build/deploy the date app, and follow the session + git governance protocol. Use for any infra, swarm, gateway, build, or repo-ops task on this box.
---

# Sabretooth Ops — the whole stack, one skill

Written 2026-08-16 from a full live rebuild (post-Windows-reinstall). Every
command here was executed and verified on this machine that day.

## Machine truth (verify, don't assume)

- User profile: `C:\Users\joshi` (old `joshl` is gone). Repo: `C:\ANTIGRAVITY`,
  branch `main`, remote `Trollz1004/ANTIGRAVITY`.
- Installed: Claude Code (`~\.local\bin\claude.exe`), git, Node 24 + pnpm via
  corepack, Python 3.13, Docker (daemon flaky — don't depend on it),
  OmniRoute (npm global), OpenWork desktop (`%LOCALAPPDATA%\Programs\@openworkdesktop`).
- Harnesses (Hermes, OpenClaw, OpenCode) were wiped 2026-08-16 and now run as
  lanes on the Paperclip board rather than as standalone installs; check the
  board for their real state instead of assuming. Ollama is installed and is a
  fail-safe path only. FCC is permanently purged — not "not installed" but
  banned; see agent-contracts/FCC-STATUS.md.
- `drift.cmd` (in `~\.local\bin`, Win+R-able) = resume Claude in C:\ANTIGRAVITY
  with permissions bypassed.

## Session protocol (mandatory)

1. **Start:** read `MEMORY.md` / journal, then search the repo by meaning
   instead of guessing paths:
   `GET http://127.0.0.1:3151/api/knowledge/search?q=<term>`
   (full map: `/api/knowledge/graph`; preview: `/api/knowledge/file?path=`;
   3D view: board → GRAPHY → 🧠 KNOWLEDGE).
2. **End:** write state back — journal (`POST :3151/api/brain/journal/<id>`)
   or memory files. Uncommitted work and unwritten state are how work dies here.

## OmniRoute gateway (:20128 dashboard+/v1, :20129 API)

One endpoint for ALL model traffic. No agent holds a provider key — providers,
auto-swap, and compression live inside the gateway. Clients need only
`OPENAI_COMPAT_BASE_URL=http://192.168.0.8:20128` (+ optional key).

```powershell
# Health (also what the keepalive probes):
Invoke-WebRequest http://192.168.0.8:20128/v1/models -UseBasicParsing -TimeoutSec 5
# Real end-to-end test (free pool, no keys needed):
#   POST :20129/v1/chat/completions {"model":"auto/best-free", ...} → expect a completion.
```

- Runs from npm global (`omniroute.cmd` in `%APPDATA%\npm`). Data dir:
  `%USERPROFILE%\.omniroute\data` — OUTSIDE the repo on purpose (sqlite + keys
  must never be committed). Provider sign-ins live there; losing it = re-onboard.
- Keepalive: `C:\ANTIGRAVITY\scripts\omniroute-keepalive.ps1`, launched at logon
  by `omniroute-keepalive.cmd` copied into the Startup folder. First boot
  compiles ~60-90s before :20128 answers — wait, don't respawn.
- Model routes that actually work on a fresh instance: `auto/best-free` (verified),
  `auto/best-reasoning` (judge). `auto/coding:free` pool can be degraded
  (felo 400/429, opencode 401) — if workers fail with 429s, point
  `OMNI_MODEL_*` / `EXEC_AUTO_MODEL` at `auto/best-free` in MC5 `server/.env`.

## MC5 legacy vote engine (:3151) — NOT Mission Control

> **Current truth (2026-09-03):** Mission Control is Paperclip at `:3100`
> (`GET /api/openapi.json` → `.info.title == "Paperclip API"`). MC5 below is
> the legacy vote-engine board — historical section, kept as written.

```powershell
# Start (background) — NEVER pipe a server through Select-Object -First: the
# closed pipe can kill it. Redirect to a file instead:
Set-Location C:\ANTIGRAVITY\mission-control-v5\server; npm start 2>&1 | Out-File $env:TEMP\mc5.log
# Stop:
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*mission-control*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

- Health: `/api/health` — note `routerLive`/"OMNIROUTE LIVE" means *configured*,
  not *answering*. Probe :20128 directly for the truth.
- Serves: board UI, `/paperweight/` (static command center; sample data),
  knowledge graph API, bridge (`/api/bridge/openclaw`), MCP at `/api/mcp`.
- Typecheck/build: `npm run typecheck` / `npm run build` at `mission-control-v5\`.

## The judge-gated swarm (governance — AGENTS.md §7)

- Every task runs on ALL assigned orchestrators independently (tri-execution).
- All versions go to THE JUDGE (`judge` executor → `EXEC_JUDGE_MODEL`, default
  `auto/best-reasoning`, no local floor, never a worker model). Judge ACCEPTS
  one version (may edit) or DENIES all → task BLOCKED for human review.
  Judge-unreachable also blocks. Nothing ships by default.
- **Only the judge lane (or a session Joshua directly leads) pushes, merges,
  or deletes branches.** Workers/sub-agents never `git push`.
- E2E validation recipe (verified working):
  `POST :3151/api/tasks {"title":"...","prompt":"..."}` → poll `/api/tasks`
  until DONE → winner's phases must contain
  `validate: judge (auto/best-reasoning) ACCEPTED version N (...)`.
  Retry after fixes: `POST /api/tasks/<id>/retry`.

## Date app (frontend/react-app)

```powershell
Set-Location C:\ANTIGRAVITY\frontend\react-app; npm run build
# PROOF of a good build: dist\assets\index-<hash>.js exists.
# PROOF of a good SERVE: the public page references that hash and NOT /@vite/client
# (serving unbuilt source has happened twice — NODE_ENV=production must be set;
# start via mission-control-v5\scripts\tab-dateapp.cmd).
```

Python services: `backend\.venv` (skips `emergentintegrations` — Emergent's
private index, lazy-imported, backend boots without it) and `mission-control-v6\.venv`.

## Git flow (this box)

```bash
git add -- <only your files>        # never -A; other agents share this tree
git commit -m "type(scope): ..."    # end body with Co-Authored-By trailer
git pull --rebase --autostash origin main
git push origin main                # judge lane / Joshua-led sessions only
git log --oneline -1 origin/main    # confirm it landed
```

`main` is the only branch — merge and delete anything else on sight.

## Secrets (hard rules)

- Never print, commit, or echo values. Inspect `.env` files by NAMES only:
  `grep -oE '^[A-Z_]+=' file`. Model route names (`auto/best-free`) are not
  secrets and may be written; keys/tokens are and may not.
- Repo secret presence is audited by `.github/workflows/secrets-audit.yml`
  (manual + weekly, names only). YouTube + platform API keys belong in GitHub
  Actions secrets, never in the tree.
- The knowledge graph excludes `.env`/vault/credential paths at walk time —
  keep it that way when editing `knowledge.ts`.

## Pitfalls that already burned time (don't repeat)

- `Select-Object -First N` on a background server pipe → server dies when the
  pipe closes. Use `Out-File`.
- Windows drive letters are per-install: after a reinstall the data disk came
  back as D: and had to be re-lettered to F: (`Set-Partition -DriveLetter D -NewDriveLetter F`).
- `claude --teleport` needs a checkout of the repo with a CLEAN tree — stash
  with `-u` first (`git stash push -u -m "..."`).
- A fresh gateway's `auto/coding:free` pool may be rate-limited while
  `auto/best-free` works — swap models via env, don't debug providers.
- PowerShell here-strings: closing `'@` must be at column 0.

## New-node bootstrap (any machine, always the same path)

```powershell
git clone https://github.com/Trollz1004/ANTIGRAVITY C:\ANTIGRAVITY
Set-Location C:\ANTIGRAVITY
corepack enable; pnpm install                                  # monorepo root
npm --prefix frontend\react-app install
npm --prefix mission-control-v5 install; npm --prefix mission-control-v5 run install:all
npm --prefix brain-mcp install; npm --prefix services\mission-mcp install
python -m venv backend\.venv; backend\.venv\Scripts\pip install -r backend\requirements.txt   # emergentintegrations optional
python -m venv mission-control-v6\.venv; mission-control-v6\.venv\Scripts\pip install -r mission-control-v6\requirements.txt
npm install -g omniroute                                       # the gateway
# .env files come from the vault — NEVER from another node's tree, never echoed.
# Activate keepalives: copy scripts\omniroute-keepalive.cmd into the Startup folder.
```

The path is `C:\ANTIGRAVITY` on EVERY node — that is doctrine, not preference.
