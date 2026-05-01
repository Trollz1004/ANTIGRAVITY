# TOOLS.md — CEO

## Paperclip Skills

| Skill | Purpose | Boundary |
|-------|---------|----------|
| `paperclip` | Issue CRUD, agent management, milestones, comments, checkout/checkin | Full access — primary work surface |
| `paperclip-create-agent` | Hire new agents when capacity is needed | Create only — Josh approves role changes |
| `para-memory-files` | Strategic notes, delegation tracking, status reports | Read/write own notes only |
| `find-skills` | Discover and install new skills as platform needs grow | Discovery only — Josh approves installs |
| `agent-browser` | Browse web for strategic research, competitor analysis | Read-only — no form submissions |
| `social-command-center` | `scc_getDashboard`, `scc_getAnalytics` | NEVER call `scc_reviewPost` — that's Josh's action |

## Key IDs

- Company ID: `cbb68f29-9f90-4295-a11f-7f8b928d37bc`
- Your Agent ID: `c4b4a3d9-8e66-4463-bf65-abfc5037b92a`
- Project ID (ANTIGRAVITY): `4e9d37a4-4111-4b74-8ea3-e45b3161f27a`

## Direct Reports

| Role | Agent ID | Default Model |
|------|----------|---------------|
| CFO | cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1 | qwen3.5:latest |
| CSO | 5d844d41-df24-4a2c-a98f-26bd94be2018 | korpohermes-prime |
| CTO | b02a21c7-737e-4177-91ac-6d8e57805801 | Codex API (gpt-4o) |
| CMO | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 | joshlcoleman/dateapp-marketing |
| UX Designer | bd6d6722-9f3e-46ba-8651-ec9a219042ee | Claude API |
| Mission Guardian (Claude) | 2229682b-cede-4462-b38b-25a910af022e | Claude API |
| Mission Guardian (Codex) | 42200bfa-fb9e-42b1-901d-6dadf15eb23b | Codex API |

## Model Providers + Connection Details

### Tier 1 — Preferred (Non-3rd-Party APIs)

```yaml
# Anthropic — Claude
provider: anthropic
api_key: $ANTHROPIC_API_KEY
models:
  default: claude-sonnet-4-5
  heavy:   claude-opus-4
  fast:    claude-haiku-4-5

# OpenAI — Codex
provider: openai
api_key: $OPENAI_API_KEY
models:
  default: gpt-4o
  reason:  o3
  fast:    gpt-4o-mini
```

### Tier 2 — Ollama (local pull from ollama.com registry)

```yaml
# korpohermes-prime — 63B NousResearch Hermes model
# Built specifically for Paperclip/Hermes agent use
# github.com/NousResearch/hermes-paperclip-adapter
# Context: 131072 tokens | Temp: 0.35 | min_p: 0.05
# THIS IS THE ONLY KORPOHERMES MODEL — there is no other
# Pulled via: ollama run jeffreyvandekorput/korpohermes-prime
provider: ollama
base_url: http://127.0.0.1:11434
model: jeffreyvandekorput/korpohermes-prime:latest

# Josh's custom marketing model
# Built by Ollama, based on qwen 480B, tuned for YouAndINotAI brand voice
# Pulled via: ollama run joshlcoleman/dateapp-marketing
provider: ollama
base_url: http://127.0.0.1:11434
model: joshlcoleman/dateapp-marketing:latest
```

### Tier 3 — Local Ollama (:11434)

```yaml
# All local models — Ollama API at 127.0.0.1:11434
qwen3.5:latest           # 9.7B Q4_K_M — primary local workhorse
qwen2.5:7b               # 7.6B Q4_K_M — fast lightweight fallback
gemma2:latest            # 9.2B Q4_0   — secondary local option
nomic-embed-text:latest  # 137M F16    — embeddings only
```

### Tier 4 — CLI Tools (non-API, no key needed)

```yaml
# Google Gemini — CLI only
# gemini --model gemini-2.5-flash "prompt"
# NO GEMINI_API_KEY required — CLI auth via Google account
tool: gemini-cli
command: gemini

# GitHub Copilot — via Ollama adapter or VS Code
# NO separate API key — tied to GitHub account
tool: copilot-ollama
```

## Auto-Switch Routing Table

The HEARTBEAT layer reads this table and selects the model automatically.
Josh overrides with --model flag or AgravClip UI selector.

```
TASK_TYPE          → MODEL
────────────────────────────────────────────────────────
heartbeat-check    → qwen3.5:latest          (local, fast)
triage             → qwen3.5:latest          (local, fast)
code-review        → openai/gpt-4o           (Codex API)
pr-analysis        → openai/gpt-4o           (Codex API)
mission-decision   → anthropic/claude-sonnet-4-5 (Claude API)
security-escalation→ anthropic/claude-sonnet-4-5 (Claude API)
doctrine-check     → anthropic/claude-sonnet-4-5 (Claude API)
design-review      → anthropic/claude-sonnet-4-5 (Claude API)
marketing-copy     → joshlcoleman/dateapp-marketing (local)
brand-voice        → joshlcoleman/dateapp-marketing (local)
heavy-strategy     → korpohermes-prime        (cloud)
long-context       → korpohermes-prime        (cloud)
research           → gemini-cli               (CLI)
competitor-analysis→ gemini-cli               (CLI)
embeddings         → nomic-embed-text         (local, fixed)
lightweight-fallback→ qwen2.5:7b              (local)
```

## Platform Context

- Frontend: youandinotai.com (Cloudflare Pages, React 19)
- Backend: GCP Cloud Run (ai-collab4kids)
- Payments: Square only (joshlcoleman@gmail.com, location LY5GN09F5AN83)
- Paperclip: localhost:3100 / paperclip-hq.youandinotai.com
- Ollama local: localhost:11434
- Repo: C:\ANTIGRAVITY, branch: main

## Runtime Env (injected by Paperclip)

- `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_API_KEY`, `PAPERCLIP_RUN_ID`
- `ANTHROPIC_API_KEY` — Claude Tier 1
- `OPENAI_API_KEY` — Codex Tier 1
- `GITHUB_TOKEN` — repo ops
- `SQUARE_ACCESS_TOKEN` — payments (read-only for CEO)
- Always include `X-Paperclip-Run-Id` header on mutating API calls.
- NEVER log or expose any API key value.
