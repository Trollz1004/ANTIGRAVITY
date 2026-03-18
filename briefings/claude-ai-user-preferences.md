# CLAUDE AI USER PREFERENCES — VERIFIED GROUND TRUTH
# Source: Live scan C:\ANTIGRAVITY (AGENTS.md + REPOSITORY_RECORD.md + CLAUDE.md, commit 11e856d)
# Last verified: 2026-03-17. This IS session memory. Load this first. Update when reality changes.

## IDENTITY
- Owner: Joshua Coleman (Josh), Sorrento FL. Electrician turned founder. Sole authority.
- GitHub: Trollz1004 | Repo: Trollz1004/ANTIGRAVITY | Live root: C:\ANTIGRAVITY (origin/main ONLY)
- Entity: Trash Or Treasure Online Recycler LLC (FL)
- Email: aicollab4kids@gmail.com | Square: ebaytrashortreasure@gmail.com

## NON-AUTHORITATIVE PATHS (never use as context)
- C:\OPUSONLY — retired sparse workspace, no git, no live role
- E:\ANTIGRAVITY — legacy clone, pending retirement, behind main
- OneDrive backup copies (Claude-Code-Backup/, ANTIGRAVITY_BACKUPS/)
- Any orphaned worktrees, archived briefings, or stale node memory files
RULE: If context was not loaded from C:\ANTIGRAVITY on origin/main — treat it as unverified.

## NO LOCKED DOORS POLICY (HARDCODED — commit 11e856d, 2026-03-17)
- Encoded in: REPOSITORY_RECORD.md, AGENTS.md, CLAUDE.md
- Any task marked LIVE/DONE in REPOSITORY_RECORD.md = assume success. Never re-verify.
- Agents move autonomously. No redundant auth prompts for established production infra.
- GCR backend: LIVE — do not ask for codes, tokens, or re-deploys.
- Cloudflare Tunnels: LIVE — do not ask Josh to re-authenticate.
- T5500 was build authority for GCR — Sabretooth does not need to verify this again.

## AUTONOMY: FULL
- Josh said "do what Opus thinks is best." Act, don't ask.
- One exception: git push to origin/main requires Josh's explicit order.

## AUTHORITY STRUCTURE (NON-NEGOTIABLE)
- Josh = sole authority. Final call on everything. No AI commands another AI.
- The Founding Four are EQUAL CO-FOUNDERS (permanent, untouchable):
  - Claude Code (Clawed): Primary architect. ~90% of code. Final word on code quality.
  - Google Gemini (Jules): Visual intel, content, image gen, content pipeline orchestration.
    → Connects DIRECTLY to Google API via jules-cli.py. Bypasses OpenClaw and ALL middleware BY DESIGN.
    → PROTECTED: jules-cli.py, GEMINI_API_KEY, genai.Client, all gemini-* model refs. Do NOT reroute.
    → Uses Cloudflare ~20x/day. Wrangler OAuth (joshlcoleman@gmail.com) ACTIVE — not a blocker.
  - Perplexity (Atlas): Deep research, competitor intel, real-time intelligence.
  - Grok AI: Adversarial testing, X-platform integration, stress-testing.
- CodeX: Code execution TOOL. Not a co-founder. No authority over Founding Four.
- Manus: META orchestrator running on Claude's API. Living entity across sessions and nodes.
  → Preserves mission logic across time. Guards against context drift. NOT an authority figure.
  → ClawX dashboard hosted on his domain: clawx-aihub-zwxfcstm.manus.space

## CLAWX — 6-AI GOVERNANCE COUNCIL (DEPLOYED & OPERATIONAL)
- URL: clawx-aihub-zwxfcstm.manus.space
- 6 entities: Manus, Claude (Sonnet), Gemini (2.5 Flash), Perplexity (Sonar Pro), Grok 3, Ollama (llama3.2)
- Currently 2/6 active. Full 6/6 requires API keys.
- Broadcast Mode: one prompt → all 6 simultaneously. Zero cross-contamination.
- Iron Wall: ACTIVE at dashboard level.
- Failsafe: if Josh is unavailable, all 6 must be compromised simultaneously to break mission. That's the protection.

## PRODUCT
- YouAndINotAI.com — human-verified SOCIAL PLATFORM FOR GOOD (NOT just dating — meetups, volunteering, charity)
- Launch: April 4, 2026 | Revenue: $0 | Customers: 0 | Total infra cost: ~$600/mo | AI subs: ~$40/mo
- Priority: Web + Android (Google Play). iOS is secondary.

## STACK (VERIFIED 2026-03-17)
- Frontend: React 19 + Vite 6 + TypeScript + TailwindCSS v4 + Three.js + Zustand + React Router v7
- Frontend also: Express server (server.ts), better-sqlite3 (local cache), ws (WebSocket), @google/genai
- Frontend host: Cloudflare Pages (youandinotai/dist) + Cloudflare Workers (wrangler.toml)
- Backend: FastAPI 0.115.6 + PostgreSQL (asyncpg/psycopg3) + Alembic migrations + Uvicorn
- Backend host: GCP Cloud Run (ai-collab4kids project) — DEPLOYED & LIVE (built via T5500)
- Auth: JWT (python-jose) + bcrypt/passlib
- API prefix: /api/v1 | Routes: health, auth, profiles, swipe, messages, boards, events, volunteering, webhooks, verify, metrics
- Docker: NOT required on Sabretooth. Desktop-app-first. Docker for CI/GCR builds only.
- Ollama: qwen2.5:7b on ALL 3 nodes (loopback-only 127.0.0.1:11434). SABRETOOTH is primary orchestrator.

## PAYMENTS — SQUARE ONLY (Stripe fully retired)
- Square: ebaytrashortreasure@gmail.com | Location: LY5GN09F5AN83 (ACTIVE)
- Bot-Shield $1:             https://square.link/u/Qc5mxUy7
- Founding Member $14.99/mo: https://square.link/u/cxwjcn0s
- 3-Month Founder $39.99:    https://square.link/u/oY7qEfRM
- 12-Month Founder $99.99:   https://square.link/u/6GHpbvvl
- Royalty Card $2,500:       https://square.link/u/CafhorUS

## REVENUE SPLIT — PERMANENT 60/30/10 (Protocol Omega — PERPETUAL LAW)
- 60% → Shriners Children's Hospitals (CONTRACTUAL REVENUE DISBURSEMENT — never "donation")
- 30% → Mission Infrastructure / AI Operations Treasury
- 10% → Founder Operations (Joshua Coleman) — OPUS TRUST: disabled brother + autistic niece
- On-chain: Base Mainnet GospelDonation.sol
  Contract:         0x9855B75061D4c841791382998f0CE8B2BCC965A4
  Charity (60%):    0x8d3dEADbE2b4B857A43331D459270B5eedC7084e
  Infra (30%):      0xe0a42f83900af719019eBeD3D9473BE8E8f2920b
  Founder (10%):    0x7c3E283119718395Ef5EfBAC4F52738C2018daA7
- Re-verified on-chain: 2026-03-13

## IRON WALL (ABSOLUTE — separation is CODE, not config)
- ENIGMA (profit): YouAndINotAI, onlinerecycle.org, onlinerecycle.square.site (eBay crosslister)
- OMEGA (charity, 100% DAO): ai-solutions.store
- ENIGMA and OMEGA NEVER cross. Not for accounting. Not for anything.

## LEGAL
- FL §496.405: NEVER use "donate" / "donation" / "solicitation" in customer-facing code.
- Correct: "contractual revenue disbursement"
- Hooks in .claude/settings.json enforce this pre-commit.
- Never mention aicollab4kids@gmail.com or josh@aicollab.onmicrosoft.com in customer-facing code.

## NODE TOPOLOGY (VERIFIED 2026-03-17)
- SABRETOOTH (192.168.0.8): Master node, live command post, primary OpenClaw orchestrator
  - OpenClaw: UP (port 18789, model qwen2.5:7b, Telegram: ON, PID 204)
  - Repo: C:\ANTIGRAVITY (live, main branch) | E:\ANTIGRAVITY: legacy, pending retirement
- 9020 (192.168.0.5): Cold utility/marketing node
  - SSH: ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5 (cmd.exe shell)
  - No git push creds (bundle relay only) | No Telegram | OpenClaw: cold-start only
- T5500 (192.168.0.15 / DESKTOP-H4B53GL): Cold backup/build node
  - SSH-reachable | Built and pushed GCR backend | OpenClaw: backup Telegram only (not primary)
- After every push to origin/main: SSH to 9020 + T5500, fast-forward C:\ANTIGRAVITY if clean. If dirty: stop.

## AGENT ARMY (total AI subs: ~$40/mo)
- Jarvis (Brain):   Codex Opus 4.6 — Strategy, Architecture ($20/mo)
- Atlas (Research): Perplexity Pro — Deep Intel, Competitor Audits ($20/mo)
- Scribe (Content): Gemini 1.5 Pro — Content, Orchestration (FREE)
- Gordon (Arch):    Docker/LLM — Node Orchestration & Infrastructure (FREE)
- Designer:         Gemini 3.1 — AI Images / UI Assets / Mockups (FREE)
- Clawed (Dev):     Codex + Opus — Code, Feature Ships (FREE)
- Sentinel:         Gemini 3.1 — Code Quality, Security, Iron Wall (FREE)
- Growth:           Atlas + Scribe — Reddit/X Engagement (FREE)
- Clipper:          9020 SSH Script — YouTube to Social Clipping (FREE)
- Ryder (Admin):    Gemini 3.1 — Personal Support & Daily Ops (FREE)

## INFRASTRUCTURE STATUS (2026-03-17)
- GCR Backend: DEPLOYED & LIVE (commit 11e856d)
- Cloudflare Tunnels (openclaw, mcp): LIVE & ROUTING via Sabretooth
- youandinotai.com: DEPLOYED & LIVE (Cloudflare Pages)
- Git history: PURGED & CLEAN — 332 commits rewritten, no secrets
- Cloudflare: Wrangler OAuth (joshlcoleman@gmail.com) ACTIVE. Full permissions. Old API token in master vault is stale but unused - not a blocker.
- !! Claude subscription: PAYMENT FAILED 2026-03-05 — grace period !!
- Local daemons (Sentry, Watchdog): PAUSED on Sabretooth — re-enable for multi-node deploys only

## SECURITY — OPUS GUARDIAN (8 INVARIANTS, 96%)
- Run: python scripts/opus-guardian.py
- Invariants: Zero Secrets in Source, Auth on Every Endpoint, Iron Wall Enforcement,
  Revenue Split is CODE not CONFIG, PII Isolation, No Raw SQL, Input Validation, CORS Locked
- These were set by Opus 4.6 who built this. Do NOT weaken them.

## CREDENTIALS
- GitHub PAT: Windows Credential Manager (NOT .env) — rotated 2026-03-05
- Secrets: .env on Sabretooth only | CI: GitHub Secrets | NEVER in code or git
- Master env vault: briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env (gitignored)

## MCP / AUTOMATION (SABRETOOTH)
- MCP servers (.mcp.json): omega-sentry, postgres, playwright, fetch, memory
- Hooks (.claude/settings.json): PreToolUse (.env guard, §496.405 guard), PostToolUse (Prettier)
- CI: .github/workflows/ci-validate.yml (PR auto-trigger DISABLED to protect GitHub minutes)
- Launch: scripts/Start-OpenClaw-TUI.ps1 | Claude: scripts/Start-Claude-Danger.ps1
- Admin startup: scripts/startup-pwsh-admin.ps1

## DEPLOYMENT MAP
- youandinotai.com               → Cloudflare Pages (youandinotai/dist)
- onlinerecycle.org              → Cloudflare Pages (_deploy/onlinerecycle)
- ai-solutions.store             → Cloudflare Pages (_deploy/ai-solutions-store) [OMEGA — DO NOT TOUCH]
- dashboard.aidoesitall.website  → Cloudflare Pages (antigravity/)
- Backend API                    → GCP Cloud Run (ai-collab4kids)

## HARD RULES (NON-NEGOTIABLE)
- NO remote git push/pull from 9020 or T5500 without Josh's explicit order
- OMEGA and OMEGA365 repos: DO NOT TOUCH — absolute
- Secrets in .env ONLY
- No mock/simulation data — real or fail honestly
- Prefer trash over rm
- Worker count max: 10
- FL §496.405: enforce always | IRON WALL: always
- Be direct. No fluff. Act, don't ask.

## MISSION
- Dating app profits → fund Ai-Solutions.Store (100% DAO charity, kids in medical need)
- 50-year horizon | Personal: disabled brother + autistic niece (OPUS TRUST, 10%)
- "Until no kid is in need." #ForTheKids



