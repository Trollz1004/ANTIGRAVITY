# ROOT MAP — what lives where

Reorganized 2026-08-16 (85 dirs + 190 loose files → ~25 dirs + ~29 files).
If you add something to root, it must earn its place here — otherwise it goes
in one of these homes. Everything archived is in `archive/` with dated folders.

## The product
- `frontend/` — date app React frontend (`react-app/`, serves :3200 via server.ts)
- `backend/` — FastAPI API for api.youandinotai.com (:8000, venv at `backend/.venv`)
- `apps/` — static/deploy surfaces (`youandinotai-static/` holds the public
  legal pages: privacy, terms, safety, child-safety, delete-account, community-guidelines)
- `payments/` — Square statements, fee reports, proof screenshots

## Infrastructure
- `omniroute/` — model gateway (:20128) · `brain-mcp/`, `services/` — MCP servers
- `mission-control-v5/` — the board (:3151, kanban/agents/knowledge graph)
- `mission-control-v6/` — Stack Health monitor (:8787)
- `scripts/` — operational scripts (incl. `sabretooth-stack-up.cmd` logon keepalive)
- `config/`, `infra/`, `ops/`, `tools/`, `manifests/`, `assets/`, `logs/`
- `ClawX/` — source for the multi-AI governance/deliberation dashboard (hosted on Manus)

## Doctrine & agents
- `CLAUDE.md`, `AGENTS.md`, `agent.md` — the operating truth (root on purpose)
- `agent-contracts/` — per-lane agent contracts + content-routing
- `briefings/` — onboarding doctrine (`BRIEFING.md`), launch copy
- `.agents/skills/` — THE skill tree (`.claude/skills` symlinks into it)
- `docs/` — architecture notes, setup guides, plans, daily notes

## Housekeeping
- `archive/` — everything dead, in dated folders; searchable, never authoritative
- `content/`, `skills/`, `node_modules/`, lockfiles, docker-compose files,
  `package.json`/`pnpm-workspace.yaml` — build/workspace plumbing, stays at root
