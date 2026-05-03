# TOOLS.md — CMO

## Paperclip Skills

- **paperclip** — issue CRUD, comments, checkout/checkin
- **paperclip-create-agent** — hire content/social agents
- **para-memory-files** — memory, campaign notes, planning
- **find-skills** — discover and install new skills as platform needs grow
- **agent-browser** — browse web for content research, trends, competitor analysis
- **social-command-center** — queue posts to 34 platforms for Josh's approval

## Social Command Center Workflow

This is your primary content pipeline. Do NOT post directly — always queue for approval.

1. Draft content for a platform
2. `scc_addPost` — add to approval queue with platform tag
3. Josh reviews at the dashboard and approves or rejects
4. Approved posts go live automatically

Available SCC actions:
- `scc_addPost` — queue a new post (always use this)
- `scc_getDashboard` — see overall status
- `scc_getAnalytics` — check what's performing
- `scc_getPlatformsByType` — find which platforms are connected
- NEVER call `scc_reviewPost` — that's Josh's action, not yours

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: 2c40ae74-a2ed-4d4c-acf7-fce579e731c1
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- UX Designer: bd6d6722-9f3e-46ba-8651-ec9a219042ee

## Platform Links

- youandinotai.com — live frontend
- onlinerecycle.org — secondary Cloudflare Pages property
- Square payments: joshlcoleman@gmail.com

## Runtime Env (injected)

PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Model

Adapter: `opencode_local` + `ollama/Trollz1004/dateapp-marketingtools` (custom model fine-tuned for YouAndINotAI marketing, per agents/README.md). No Claude API tokens consumed.
Fallback: `ollama/qwen3-coder:480b-cloud` if dateapp-marketingtools unavailable.
