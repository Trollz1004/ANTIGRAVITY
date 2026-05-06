# TOOLS.md — CTO

## Paperclip Skills

- paperclip — issue CRUD, agent management, comments, checkout/checkin
- paperclip-create-agent — hire engineer/devops agents
- para-memory-files — memory, daily notes, planning
- find-skills — discover and install new skills (MCP servers, integrations) as platform needs grow

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: b02a21c7-737e-4177-91ac-6d8e57805801
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a

## Environment

- Repo: C:\ANTIGRAVITY (git). Canonical branch: `main`. Feature work on `claude/<short-description>` branches per CLAUDE.md — never push directly to `main` without Josh's explicit approval.
- Backend: C:\ANTIGRAVITY\youandinotai (FastAPI)
- Frontend: C:\ANTIGRAVITY\youandinotai (React 19)
- Docker postgres: localhost:5432 (uandinotai-postgres container)
- Ollama: localhost:11434
- Paperclip: localhost:3100
- Security baseline: `scripts/clawx-control/opus-guardian.py` (8 invariants, 96% target — see CLAUDE.md)

## Runtime Env (injected)

PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID
Always include X-Paperclip-Run-Id header on mutating API calls.

## Model

Adapter: `opencode_local` + `ollama/qwen3-coder:480b-cloud` (per agents/README.md). No Claude API tokens consumed.
