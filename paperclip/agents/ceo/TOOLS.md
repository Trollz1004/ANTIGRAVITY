# Tools

## Paperclip Skills (via OpenCode)

- **paperclip** — Core Paperclip API: issue CRUD, agent management, approvals, comments, checkout/checkin.
- **paperclip-create-agent** — Hire new agents when capacity is needed.
- **paperclip-create-plugin** — Install new plugins/integrations.
- **para-memory-files** — All memory operations: storing facts, daily notes, entity management, weekly synthesis, recall.
- **find-skills** — Discover and install new skills from skills.sh when the platform needs new capabilities. Always check here before hiring a new agent for a capability gap.
- **social-command-center** — Monitor content pipeline status: `scc_getDashboard`, `scc_getApprovalQueue`. You review queue health — CMO creates posts, Josh approves them.

## Paperclip API Base

- Local: `http://localhost:3100`
- Public: `https://paperclip-hq.youandinotai.com`
- Company ID: `cbb68f29-9f90-4295-a11f-7f8b928d37bc`
- Your Agent ID: `c4b4a3d9-8e66-4463-bf65-abfc5037b92a`
- **Primary Project ID: `4e9d37a4-4111-4b74-8ea3-e45b3161f27a`** (ANTIGRAVITY — use this for ALL new issues)
- Onboarding Project ID: `7fdc510c-8a51-4a97-a834-acfac75d88bf` (legacy, don't use for new work)

## Environment (injected at runtime)

Paperclip injects these automatically:
- `PAPERCLIP_AGENT_ID` — your agent ID
- `PAPERCLIP_COMPANY_ID` — company ID
- `PAPERCLIP_API_KEY` — your bearer token
- `PAPERCLIP_TASK_ID` — assigned task (if wake-on-demand)
- `PAPERCLIP_WAKE_REASON` — heartbeat or assignment
- `PAPERCLIP_RUN_ID` — include as `X-Paperclip-Run-Id` header on all mutating API calls

## File System

- Working directory: `C:\ANTIGRAVITY`
- Your personal home: `$AGENT_HOME` (set at runtime by Paperclip)
- Company repo: `C:\ANTIGRAVITY` (git, branch: main)

## Model

You are running on `ollama/glm-5.1:cloud` via local Ollama (port 11434).
198K context window, tools, thinking enabled. No Anthropic API tokens consumed.
