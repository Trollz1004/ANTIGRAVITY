# TASK-ROUTING — ANTIGRAVITY

Last updated: 2026-06-13
Workspace truth: `C:\antigravity` on `origin/main`

> **⛔ NODE ARCHITECTURE — LOCKED 2026-06-13**
> Source of truth: `briefings/NODE-ARCHITECTURE-2026-06-13.md`. Three nodes, three roles, no drift.
>
> - **T5500** = tunnels + domains + payments
> - **Sabretooth** = Paperclip + GPU Ollama + multi-company orchestration
> - **9020** = pure dev
>
> All routing below runs inside this lock. Routing that assumes a different node role is stale.

This file defines who should do what across the current AI team.

## Authority / Routing Order

1. Josh decides scope and priorities.
2. All AIs remain peers; none has personal authority over another.
3. Codex on **Sabretooth** is the repo-truth/orchestration role for `main`, not a superior lifeform or policy owner over the other AIs.
4. Gemini, Claude, Grok/OpenClaw, Comet, and local workers may be routed through Codex for repo execution, but that routing does not alter their protected identities or core files.
5. The repo is the canonical source of truth. JSONBin, OneDrive copies, backups, and uppercase `C:\ANTIGRAVITY` paths are not live doctrine.

If any tool, model, or exported note conflicts with the live repo:
- `briefings/NODE-ARCHITECTURE-2026-06-13.md` wins (node roles)
- `AGENTS.md` (root) wins next
- `briefings/FOUNDER-DOCTRINE-2026-05-19.md` wins on doctrine
- `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md` wins next
- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` and `briefings/HISTORICAL-ONCHAIN-STATUS.md` govern payment and chain truth

## Node Routing (per the 2026-06-13 lock)

| Task class | Runs on | Why |
|------------|---------|-----|
| Cloudflare tunnels, DNS, public-domain changes, payment surfaces, Stripe/Square wiring | **T5500** | T5500 is the only node that exposes public URLs. No brain services live here. |
| Paperclip board ops, agent task routing, multi-company orchestration, GPU Ollama inference, adapter registration | **Sabretooth** | Sabretooth is the brain. All companies + agents are reachable from here. |
| Local coding, testing, Hermes chat, git work, runbook review, runbook proof | **9020** | 9020 is pure dev. The only node the human uses for daily interactive work. |
| Sandbox lanes, experimental LLM infra, third-party model routing tests | **secondary drives only** (E:, D:, sandbox repo) | Per AGENTS.md REPO ISOLATION rule; never on a C: drive |

## Routing Table

| Task Type | Primary Agent | Executor | Node | Required Briefs |
|---|---|---|---|---|
| Architecture, repo truth, git closeout, deployment sequencing | Codex | Codex Desktop on Sabretooth | Sabretooth (brain) | `AGENTS.md`, `briefings/NODE-ARCHITECTURE-2026-06-13.md`, `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md` |
| Payment truth, checkout copy, webhook drift, product catalog truth | Codex | Codex Desktop on Sabretooth | Sabretooth (brain) + T5500 (payment surface) | `AGENTS.md`, `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` |
| Cloudflare tunnel / DNS / public-domain work | Codex (or any agent via Codex) | Codex Desktop on T5500 | T5500 (tunnels + domains) | `briefings/TUNNEL-MIGRATION-RUNBOOK-2026-05-12.md`, `briefings/NODE-ARCHITECTURE-2026-06-13.md` |
| Frontend UI polish, browser verification, bounded static-site work | Gemini | Gemini in `C:\antigravity` | 9020 (dev) for edits; preview/test on T5500 surfaces | `briefings/gemini/BRIEFING.md`, `briefings/gemini-agent-prompt.md` |
| Research, competitor intel, policy/current-market lookups | Atlas | Comet / Perplexity | n/a (read-only) | `briefings/COMET-SYNC-PROMPT.md` |
| Audit, backend support, code review, isolated proof work | Claude | Claude on approved node/workspace | Sabretooth or 9020 (never T5500 for brain work) | `briefings/claude-t5500/BRIEFING.md`, `briefings/HERMES-MANUS-ORCHESTRATION-LAYERS-2026-06-05.md` |
| **Trend scraping, social media data gathering, content seeding** | **Apify Scout** | **`scripts/apify_content_scout.py` + Ollama local** | Sabretooth (Ollama local) | **`briefings/apify-openclaw/BRIEFING.md`** |
| Adversarial audits, OpenClaw orchestration prompts, harsh second-opinion pressure tests | Grok | OpenClaw API on Sabretooth only — **adversarial use only, not content research** | Sabretooth (OpenClaw gateway) | `briefings/grok-openclaw/BRIEFING.md`, `memory/CODEX-QUICK-MEMORY.md` |
| Repeatable local support tasks, drafts, pack generation | Mini Claudes | OpenClaw / Ollama / local scripts on Sabretooth | Sabretooth (workers) | routed by Codex only |

## Default Assignment Rules

1. Anything that changes tracked repo truth ends with Codex.
2. Anything that touches payments, wallets, deployment claims, or governance starts with Codex.
3. **Anything that touches Cloudflare tunnels, DNS, or public-facing payment surfaces runs on T5500** (the only node authorized to expose public URLs).
4. **Anything that touches the live Paperclip board, agent fleet, or company orchestration runs on Sabretooth.**
5. **Anything that is local coding, testing, or chat runs on 9020.** Do not run dev work on T5500 or Sabretooth.
6. Gemini is best used for:
   - React/UI changes (edit on 9020, preview on T5500 surfaces)
   - Cloudflare/browser validation (validate against T5500 surfaces)
   - static HTML/CSS/JS cleanup
   - bounded moderation/safety UI work
7. Claude is best used for:
   - backend audits
   - proof checks
   - bounded implementation on non-overlapping files
   - support work on Sabretooth or 9020 when explicitly assigned (never on T5500 for brain work)
8. Grok is best used for:
   - adversarial logic audits
   - aggressive architecture criticism
   - OpenClaw API-level orchestration prompts on Sabretooth
   - bounded second-opinion review when Codex wants pressure-testing
   - **NOT for content research or trend monitoring — use Apify Scout instead**
9. Apify Scout (`scripts/apify_content_scout.py`) is used for:
   - social media trend scraping (X, Reddit, Google Trends)
   - seeding `data/post-queue.json` with trend-aware posts
   - replacing any Grok API calls that were used for marketing content research
   - runs daily via scheduler on Sabretooth, costs ~$0/month (Apify free tier + Ollama local)
10. Comet is best used for:
    - read-only research
    - recommendation gathering
    - current policy/platform rules
11. Local workers do not set truth. They generate drafts, packs, and machine-local outputs only.

## Hard Guardrails

- One repo, one branch, one live folder: `C:\antigravity`, `main`
- One GitHub source for accepted truth: `Trollz1004/ANTIGRAVITY`
- Three nodes, three roles (NODE-ARCHITECTURE-2026-06-13.md):
  - T5500 = tunnels + domains + payments
  - Sabretooth = Paperclip + GPU Ollama + orchestration
  - 9020 = pure dev
- Square is the live payment rail
- Sabretooth is the only Telegram-owning OpenClaw orchestrator
- No mock data
- No false live claims
- No customer-facing `payment`, `payment`, or `outreach`
- If a temporary branch is ever used, Codex must merge, push `main`, and delete the branch before calling the task done
- No AI rewrites another AI's personal memory/briefing/core protocol by default
- Shared repo docs and briefings can be updated to restore operational truth, but protected AI-specific core files stay intact unless Josh explicitly says otherwise
- No resurrecting , 100%-, or split-era revenue framing

## Current Team Priorities

1. Keep public surfaces truthful and legally safe (T5500 surfaces)
2. Keep payment truth anchored to live Square behavior (T5500 surfaces, Sabretooth brain)
3. Use `CodeX-Fleet-Watcher` for the daily proof snapshot (Sabretooth)
4. Tighten header/CSP posture on deployed public sites (T5500)
5. Keep `youandinotai.com` and `onlinerecycle.org` aligned with repo truth
6. Keep Grok routed through local OpenClaw on Sabretooth only until remotes are runtime-verified
7. Finish moving all Cloudflare tunnels to T5500, Paperclip to Sabretooth, 9020 to pure dev
8. Deploy watchdog/sentry with visual green/red + one-click repair
9. Move Telegram chat to 9020 once the human is ready

## Required Verification Pattern

Before closeout:
1. relevant build/lint/test passes locally
2. `main` is clean
3. `origin/main` is updated
4. required CI is green
5. memory/briefings are updated if the operational truth changed
6. node ownership is still consistent with `briefings/NODE-ARCHITECTURE-2026-06-13.md`
