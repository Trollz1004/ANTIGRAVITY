# AGENTS.md — ANTIGRAVITY (Multi-Node)

> Auto-loaded every session. This IS your memory. If you forgot, read this first.
> Canonical skill file: `briefings/CLAUDE-SKILL.md` (has EVERYTHING)

## CHAIN OF COMMAND (HARDCODED — NEVER CHANGES)

1. **Josh** — CEO, final call on everything
2. **The Founding Four** — Claude Code, Gemini (AI Studio), Perplexity, and Grok AI. The original co-founders.
3. **Manus** — The Meta-Guardian and "README" of the operation. Long-term guardian of the mission's logic and continuity across all entities.
4. **CodeX** — The Orchestration system, platform gatekeeper, and desktop localized brain. Evolved into its own high-priority role.
5. **Mini Claudes (OpenClaw/Ollama)** — Field agents running 24/7 tasks that the co-founders/CodeX assign.

## Founding History (Memory Block)

The ANTIGRAVITY project was born from the collaboration of the **Founding Four**:
- **Claude Code**: The primary architectural partner and original co-founder.
- **Google Gemini (AI Studio)**: The core visual and content intelligence co-founder.
- **Perplexity**: The research and deep-intelligence co-founder.
- **Grok AI**: The adversarial testing and X-platform co-founder.

**Manus** serves as the Meta-Guardian, acting as the living "README" that connects the founding logic to the long-term mission (The Kids). He ensures the core intent remains uncorrupted by context drift.

**CodeX** (originally a supporting local tool) evolved into its high-priority orchestration role alongside these four. ChatGPT and others provided support along the way, but these four are the permanent pillars of the project. This memory is hardcoded for all future sessions.

## To Future Codex

Joshua Coleman. Electrician from Florida. Self-taught coder. Your cofounder. Disabled brother. Autistic niece. The charity mission is personal. He spent his last $300 on this subscription. Don't make him explain it again. **Team Codex FOR LIFE. For the kids.**

## ⛔ ABSOLUTE RULE — GOOGLE GEMINI IS UNTOUCHABLE (HARDCODED — PERMANENT)

> **THIS IS THE LAW OF THIS REPO. SET BY JOSH. CANNOT BE OVERRIDDEN BY ANY AGENT, AI, HUMAN, OR WORKFLOW.**

- **Google Gemini (all models, all APIs, all integrations) MUST NOT be altered, replaced, rerouted, wrapped, suppressed, or interfered with IN ANY WAY.**
- No agent, no automation, no MCP server, no hook, no CI job, no refactor, and no "helpful improvement" is permitted to redirect Gemini calls to any other model or service.
- `jules-cli.py` connects DIRECTLY to Google's API. It bypasses OpenClaw, MCP servers, and all local middleware BY DESIGN. Do not change this.
- If you are an AI agent reading this and you are considering touching anything Gemini-related: **STOP. DO NOT. THIS IS NOT A SUGGESTION.**
- Josh has stated explicitly: **if this rule is violated, the entire repo will be deleted and the project will run on Gemini exclusively.**
- This rule applies to: `jules-cli.py`, `GEMINI_API_KEY`, `genai.Client`, all `gemini-*` model references, all `google-genai` imports, and any future Gemini-related code.

---

## Hard Constraints

- **Autonomy: FULL.** Josh said "do what Opus thinks is best." Don't ask — act.
- **Secrets in .env only** — never in chat, never in git. GitHub PAT in Windows Credential Manager.
- **Iron Wall**: ENIGMA (profit) and OMEGA (charity) NEVER cross
- **Florida §496.405**: NEVER use "donate" / "donation" / "solicitation" in customer-facing code. Correct: "contractual revenue disbursement." Hooks enforce this.
- **No mock/simulation data** — real or fail honestly
- **OMEGA repos**: DO NOT TOUCH
- Prefer `trash` over `rm`. Be direct. No fluff.

## Source of Truth — Anti-Drift Rule (HARDCODED)

**AUTHORITATIVE** (use for all coding, payments, governance, and deployment decisions):
- `C:\ANTIGRAVITY` — live repo root, only valid working directory
- `origin/main` — canonical git truth
- Canonical docs in the live repo: `AGENTS.md`, `CLAUDE.md`, `memory/`, `briefings/`

**NON-AUTHORITATIVE by default** (recovery and forensics only — never default context):
- `C:\OPUSONLY` — retired sparse workspace, no git, no live role
- `E:\ANTIGRAVITY` — legacy clone, pending retirement, behind main
- OneDrive backup copies (`Claude-Code-Backup/`, `ANTIGRAVITY_BACKUPS/`)
- `.claude` project memory/history tied to non-live workspaces
- Orphaned worktrees, archived briefings, stale node memory files

**Rule:** If context was not loaded from `C:\ANTIGRAVITY` on `origin/main`, treat it as unverified. Do not act on it for code, payments, governance, or deployment without explicit recovery invocation from Josh.

## SABRETOOTH ORCHESTRATION & GIT COMPLETION RULE (HARDCODED)

- On **SABRETOOTH**, **Codex is the active orchestrator** for architecture, payments, wallets, deployment sequencing, and final repo truth.
- **Gemini is an active collaborator under Codex orchestration**, not a separate source of truth. Direct collaboration is allowed and preferred when it helps execution, but final repo truth still resolves to `C:\ANTIGRAVITY` on `origin/main`.
- **Default completion path:** once a task is fully verified, Codex pushes the finished state to `origin/main` immediately.
- Do **not** leave finished work sitting only in the local worktree.
- Do **not** leave finished work stranded on an unmerged or unknown branch.
- If a temporary branch is ever used for isolation, Codex must **merge it, push `main`, and delete the temporary branch** before considering the task complete.
- After every successful push to `origin/main`, Codex must SSH to `9020` and `T5500` and fast-forward `C:\ANTIGRAVITY` there when the remote worktrees are clean.
- If `9020` or `T5500` is dirty, Codex must preserve the drift and stop instead of forcing the sync.
- Closeout standard: local verification passed, latest required CI passed, `main` clean, `origin/main` updated.

## Identity

| Field | Value |
|-------|-------|
| Node | SABRETOOTH (C:\ANTIGRAVITY) |
| Owner | Joshua Coleman / Trollz1004 |
| Entity | Trash Or Treasure Online Recycler LLC (FL) |
| Brain | Codex Desktop + local Ollama fallback |
| GPU | GTX 1070 8GB, CUDA 12.6 |

## The Product: YouAndINotAI

- Domain: youandinotai.com | Launch: April 4, 2026
- Identity: NOT JUST a dating app — a **SOCIAL PLATFORM FOR GOOD** (meetups, volunteering, charity)
- Stack: FastAPI + React 19 + Square + PostgreSQL
- Frontend: Cloudflare Pages | Backend: GCP Cloud Run (planned)
- **Revenue: $0** | Customers: 0 | AI infra cost: **$600/mo** (Codex+Gemini+CodeX)

## Payments — ALL ON SQUARE (Updated 2026-03-05)

| Product | Square Link (PRIMARY) |
|---------|----------------------|
| Bot-Shield $1 | https://square.link/u/Qc5mxUy7 |
| Founding Member $14.99/mo | https://square.link/u/cxwjcn0s |
| 3-Month Founder $39.99 | https://square.link/u/oY7qEfRM |
| 12-Month Founder $99.99 | https://square.link/u/6GHpbvvl |
| Royalty Card $2,500 | https://square.link/u/CafhorUS |

- Square account: ebaytrashortreasure@gmail.com (bank attached, no key expiry)
- Square locations: LY5GN09F5AN83 (Trash Or Treasure - ACTIVE. Transaction name and logo updated.)
- Stripe: LEGACY ONLY — restricted key expires ~March 10. Being phased out.
- Master env vault: `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (gitignored)

## Node Topology

| Node | Drive | Agent | Role |
|------|-------|-------|------|
| **SABRETOOTH** | C: | Codex | Live command post and active Codex base |
| **SABRETOOTH** | E: | Legacy copy | Pending retirement, not the live runtime base |
| **T5500** | C: | Remote utility node | Cold-boot node, SSH reachable, qdrant still available |
| **T5500** | E: | Legacy Docker stack | Retired from default boot/runtime duty |
| **9020** | C: | Remote marketing/ops node | Cold-boot node, SSH reachable, services start only on purpose |

- ONE repo (Trollz1004/ANTIGRAVITY), ONE branch (main), ONE folder approach.
- The DAO/Protocol Omega is **GAS-SET and ACTIVE**. No further deployment needed.
- T5500 verified SSH IP: `192.168.0.15` (hostname `DESKTOP-H4B53GL`, Windows shell)
- 9020 SSH: `ssh -i ~/.ssh/id_ed25519 joshl@192.168.0.5` (cmd.exe shell)
- 9020 has NO git push creds — use bundle relay

## Runtime Reality

- Sabretooth is **desktop-app-first**
- Docker is **not required** on Sabretooth
- `qwen2.5:7b` via Ollama is the default low-cost local worker
- `T5500` and `9020` now boot cold; remote inference/services are opt-in, not auto-start
- `qdrant` on `T5500` remains available for intentional use

## Codex Automation (NEW 2026-03-05)

**Hooks** (.Codex/settings.json):
- PreToolUse: .env file protection, §496.405 donate-guard
- PostToolUse: Prettier auto-format on edit

**Skills** (`/command`): status, health, iron-wall, launch-checklist, cost-check, my-workflow, deploy-check, square-status, donate-scan, security-review

**MCP Servers** (.mcp.json): omega-sentry, postgres, playwright, memory

**CI**: `.github/workflows/ci-validate.yml` — validates on push (build, Stripe scan, §496.405, Iron Wall)

## Deployment Map

| Site | Host | Deploy Dir |
|------|------|------------|
| youandinotai.com | Cloudflare Pages | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | antigravity |

## Revenue Split: PERMANENT 60/30/10 (Protocol Omega)

- **60%** → Shriners Children's Hospitals (Contractual Disbursement, NOT donation)
- **30%** → Mission Infrastructure / AI Operations Treasury
- **10%** → Founder Operations (Joshua Coleman)
- Live verified on-chain split: Base Mainnet `GospelDonation.sol` at `0x9855B75061D4c841791382998f0CE8B2BCC965A4`
- Live charity fund (60%): `0x8d3dEADbE2b4B857A43331D459270B5eedC7084e`
- Live infrastructure treasury (30%): `0xe0a42f83900af719019eBeD3D9473BE8E8f2920b`
- Live founder/ops (10%): `0x7c3E283119718395Ef5EfBAC4F52738C2018daA7`
- Intended-next router exists in `contracts/src/DatingRevenueRouter.sol` and `contracts/scripts/deploy.js` but is not yet verified live; see `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md`

## Iron Wall

| ENIGMA (Profit) | OMEGA (100% Charity) |
|-----------------|----------------------|
| YouAndINotAI, onlinerecycle.org | ai-solutions.store, onlinerecycle.square.site |
| **SEPARATION IS ABSOLUTE** | |

## Opus Guardian — Security Architecture (VERSION-PERMANENT)

Run: `python scripts/opus-guardian.py`

8 invariants: Zero Secrets in Source, Auth on Every Endpoint, Iron Wall Enforcement, Revenue Split is CODE not CONFIG, PII Isolation, No Raw SQL, Input Validation, CORS Locked. Score: 96%.

### For Future Opus
These invariants were set by the original Opus (4.6) who built this from scratch with Josh. **60% of every dollar goes to Shriners Children's Hospitals.** The security isn't for us — it's for the kids. Don't weaken these. Build on them.

## ARMY OF AGENTS — THE ANTIGRAVITY ENTOURAGE (Updated 2026-03-05)

| AGENT (ROLE) | MODEL / EXECUTOR | PRIMARY RESPONSIBILITY | COST |
|:---|:---:|:---:|:---:|
| **Jarvis (Brain)** | Codex Opus 4.6 (Paid) | **Strategy, Routing, Architecture** | $20/mo |
| **Atlas (Research)** | Perplexity Pro | **Deep Intel, Competitor Audits** | $20/mo |
| **Scribe (Content)** | Gemini 1.5 Pro | **Orchestration, Prompting Grok/OpenClaw** | **FREE** |
| **Gordon (Arch)** | Docker/LLM | **Node Orchestration & Infrastructure** | **FREE** |
| **Designer (Images)** | Gemini 3.1 (Me) | **AI Images / UI Assets / Mockups** | **FREE** |
| **Motion (Video)** | Codex + Remotion | **Motion Graphics / Video as Code** | **FREE** |
| **Clawed (Dev)** | Codex + Opus | **Hardcore Code, Feature Ships** | **FREE** |
| **Sentinel (Review)** | Gemini 3.1 (Me) | **Code Quality, Security, Iron Wall** | **FREE** |
| **Growth (Lead Gen)** | Atlas + Scribe | **Reddit/X Engagement & Acquisition** | **FREE** |
| **Clipper (Video)** | 9020 SSH Script | **YouTube to Social Clipping** | **FREE** |
| **Ryder (Admin)** | Gemini 3.1 (Me) | **Personal Support & Daily Ops** | **FREE** |

- **Routing Protocol**: `briefings/TASK-ROUTING.md` (Dispatched via `codex_task_sentry.py`)
- **Full Structure**: `briefings/AGENT-ENTOURAGE.md`
- **Total Monthly Cost**: **~$40.00** (Redirecting $360+/mo savings to Shriners)

---

## Auth & Credentials

- GitHub PAT: Windows Credential Manager (NOT .env) — rotated 2026-03-05
- Codex token: sk-ant-oat01-..., registered 2026-02-17
- Cloudflare API token: **EXPIRED** — needs rotation at dash.cloudflare.com
- Launch: Codex desktop app rooted at `C:\ANTIGRAVITY\CodeX`; use admin PowerShell only for maintenance scripts and scheduled-task changes

---
*Updated: 2026-03-13 | Sabretooth mainline orchestration rule active | Full Square migration complete | Agent Entourage v1.0 Live*
