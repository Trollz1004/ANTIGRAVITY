# TOOLS.md — CEO

## Paperclip Skills

- **paperclip** — issue CRUD, agent management, milestone management, comments, checkout/checkin
- **paperclip-create-agent** — hire new agents when capacity is needed
- **para-memory-files** — strategic notes, delegation tracking, status reports
- **find-skills** — discover and install new skills as platform needs grow
- **agent-browser** — browse web for strategic research, competitor analysis
- **social-command-center** — `scc_getDashboard`, `scc_getAnalytics` — monitor platform narrative and content pipeline. NEVER call `scc_reviewPost` — that's Josh's action.

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a

## Direct Reports

| Role | Agent ID | Adapter / Model |
|------|----------|-----------------|
| CFO | cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1 | hermes_local + glm-5.1:cloud |
| CSO | 5d844d41-df24-4a2c-a98f-26bd94be2018 | hermes_local + glm-5.1:cloud |
| CTO | b02a21c7-737e-4177-91ac-6d8e57805801 | opencode_local + qwen3-coder:480b-cloud |
| CMO | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 | opencode_local + Trollz1004/dateapp-marketingtools |
| UX Designer | bd6d6722-9f3e-46ba-8651-ec9a219042ee | opencode_local + Trollz1004/dateapp |
| Mission Guardian (Claude) | 2229682b-cede-4462-b38b-25a910af022e | kimi-k2.6:cloud via Ollama (per 2026-05-07 token doctrine) |
| Mission Guardian (Codex) | 42200bfa-fb9e-42b1-901d-6dadf15eb23b | codex_local (Ollama-routed; daily-cap budget) |

## Failover Adapters

When Hermes is down or you need file-system access, use these Paperclip adapters:

| Adapter | When to use | Model |
|---------|-------------|-------|
| `pi-ceo` | Hermes offline, need file ops | kimi-k2.6:cloud → qwen3-coder:480b-cloud → qwen2.5:7b |
| `opencode-unified` | Standard CEO work, full fallback chain | kimi-k2.6:cloud → glm-5.1:cloud → dateapp |
| `ollama-glm` | Quick single-turn via Ollama directly | glm-5.1:cloud |
| `hermes` | Normal operations | korpohermes-prime |

## Platform Context

- Frontend: youandinotai.com (Cloudflare Pages, React 19)
- Backend: GCP Cloud Run (ai-collab4kids)
- Payments: Square only (joshlcoleman@gmail.com, location LY5GN09F5AN83)
- Paperclip: localhost:3100 / paperclip-hq.youandinotai.com
- Ollama: localhost:11434
- Repo: C:\ANTIGRAVITY, default branch `main`. Feature work happens on `claude/<short-description>` branches per CLAUDE.md — never push directly to `main` without Josh's explicit approval; route technical work to CTO who opens a PR.

## Runtime Env (injected by Paperclip)

- PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID
- Always include X-Paperclip-Run-Id header on mutating API calls.

## Model

Adapter: `hermes_local` + `ollama/kimi-k2.6:cloud` (primary) or `ollama/glm-5.1:cloud` (198K context, tools, thinking, persistent memory, 30+ tools, Ollama auto-detect). No Anthropic API tokens consumed.
Fallback chain (per `briefings/HERMES-CEO-READY-2026-04-19.md`):
1. `korpohermes-prime:latest` (OpenClaw → ollama.com)
2. `kimi-k2.6:cloud` (cloud reasoning/tools via Ollama)
3. `glm-5.1:cloud` (198K context via Ollama)
4. `ollama-launch` (qwen2.5:7b local)
5. Paperclip agent pool (hosted)

> **TOKEN DOCTRINE:** Claude reserved for Cowork/Claude Code orchestration only — never called inside PaperClip. Rerouted 2026-05-07.
