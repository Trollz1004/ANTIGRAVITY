# AI Team Sync - 2026-03-14

To: Codex, Gemini, Claude, Grok, Comet, local workers
Priority: Read before the next scoped task
Repo truth: `C:\ANTIGRAVITY` on `origin/main`
Current promoted baseline: `9796aba`

## Core Reset

- There is one live repo: `C:\ANTIGRAVITY`
- There is one live branch: `main`
- Codex on Sabretooth is the orchestrator and final repo truth
- Gemini, Claude, and Grok are collaborators under Codex routing
- Comet is research-only unless explicitly asked for implementation proof support

## Current Deployment Truth

- `https://youandinotai.com` is the live frontend on Cloudflare Pages
- Multiplayer backend is live on Cloud Run at `https://youandinotai-backend-731395189513.us-east1.run.app`
- Frontend websocket/runtime fallback now points at that Cloud Run service
- Frontend CSP now explicitly allows the Cloud Run websocket origin
- FastAPI API is still live at `https://api.youandinotai.com`
- Public checks confirm `api.youandinotai.com` is proxied through Cloudflare and serving the live API
- Cloudflare orange-cloud behavior is publicly verified; the zone's exact SSL mode was not directly readable from the current auth scope in this session
- `youandinotai.online` remains a redirect domain and should be left alone unless Josh explicitly changes that plan

## Payment / Verification Truth

- Square is the live payment rail
- Protocol Omega live status remains anchored in `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md`
- Keep `60 / 30 / 10` fixed
- `youandinotai-api` Square webhook now handles completed `payment.updated` events in the same verified-payment path as `payment.completed`
- Bot-Shield verification still requires both passed liveness and completed payment before the verified-human flag is granted
- Founder Badge welcome email delivery is now wired through an SMTP-backed helper
- If SMTP is not configured, the welcome-email helper logs and safely skips instead of failing the webhook
- Do not imply staking, yield, or automatic Square-to-chain routing unless the current repo and runtime prove it

## OpenClaw / T5500 Reality

- Sabretooth remains the only repo-truth orchestrator
- T5500 OpenClaw continuity cleanup is recorded in repo memory:
  - bad temporary agent JSON files were removed from `C:\Users\joshl\.openclaw`
  - ports `18789`, `18790`, `18791`, and `18792` were cleared
  - `C:\Users\joshl\.openclaw\openclaw.json` was preserved
  - no `XAI_API_KEY` exists in User env or `C:\Users\joshl\.openclaw\.env`
  - the local CLI uses the newer profile/runtime flow, not `gateway start --config <json>`
- Treat T5500 as a utility and recovery lane unless Codex explicitly documents a live cutover

## Team Lanes

### Codex
- final authority for repo truth
- architecture, payments, deployment sequencing, git closeout
- briefing and memory alignment when operational truth changes

### Gemini
- frontend, browser validation, static-site cleanup, bounded UI work
- use `briefings/gemini/BRIEFING.md`
- use `briefings/gemini-agent-prompt.md`

### Claude
- audits, backend support, proof checks, bounded implementation when assigned
- use `briefings/claude-t5500/BRIEFING.md`

### Grok
- adversarial system audit
- second-opinion architecture pressure tests
- OpenClaw API execution under Codex only
- use `briefings/grok-openclaw/BRIEFING.md`
- use `briefings/GROK-SYNC-PROMPT.md`

### Comet
- research, policy checks, current-web intelligence
- use `briefings/COMET-SYNC-PROMPT.md`
- do not set implementation truth

## Hard Stops

- no OMEGA repo work from ENIGMA-side tasks
- no stale `E:\` or `C:\OPUSONLY` as live truth
- no fake metrics
- no mock data
- no unmerged finished branches
- no secret pastes into chat, code, briefings, or tracked memory
