# TASK-ROUTING — ANTIGRAVITY

Last updated: 2026-03-14
Workspace truth: `C:\ANTIGRAVITY` on `origin/main`

This file defines who should do what across the current AI team.

## Authority / Routing Order

1. Josh decides scope and priorities.
2. All AIs remain peers; none has personal authority over another.
3. Codex on Sabretooth is the repo-truth/orchestration role for `main`, not a superior lifeform or policy owner over the other AIs.
4. Gemini, Claude, Grok/OpenClaw, Comet, and local workers may be routed through Codex for repo execution, but that routing does not alter their protected identities or core files.

If any tool, model, or exported note conflicts with the live repo:
- `AGENTS.md` wins
- `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md` wins next
- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` and `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md` govern payment and chain truth

## Routing Table

| Task Type | Primary Agent | Executor | Required Briefs |
|---|---|---|---|
| Architecture, repo truth, git closeout, deployment sequencing | Codex | Codex Desktop on Sabretooth | `AGENTS.md`, `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md` |
| Payment truth, checkout copy, webhook drift, product catalog truth | Codex | Codex Desktop on Sabretooth | `AGENTS.md`, `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` |
| Frontend UI polish, browser verification, bounded static-site work | Gemini | Gemini in `C:\ANTIGRAVITY` | `briefings/gemini/BRIEFING.md`, `briefings/gemini-agent-prompt.md` |
| Research, competitor intel, policy/current-market lookups | Atlas | Comet / Perplexity | `briefings/COMET-SYNC-PROMPT.md` |
| Audit, backend support, code review, isolated proof work | Claude | Claude on approved node/workspace | `briefings/claude-t5500/BRIEFING.md` |
| **Trend scraping, social media data gathering, content seeding** | **Apify Scout** | **`scripts/apify_content_scout.py` + Ollama local** | **`briefings/apify-openclaw/BRIEFING.md`** |
| Adversarial audits, OpenClaw orchestration prompts, harsh second-opinion pressure tests | Grok | OpenClaw API on Sabretooth only — **adversarial use only, not content research** | `briefings/grok-openclaw/BRIEFING.md`, `memory/CODEX-QUICK-MEMORY.md` |
| Repeatable local support tasks, drafts, pack generation | Mini Claudes | OpenClaw / Ollama / local scripts | routed by Codex only |

## Default Assignment Rules

1. Anything that changes tracked repo truth ends with Codex.
2. Anything that touches payments, wallets, deployment claims, or governance starts with Codex.
3. Gemini is best used for:
   - React/UI changes
   - Cloudflare/browser validation
   - static HTML/CSS/JS cleanup
   - bounded moderation/safety UI work
4. Claude is best used for:
   - backend audits
   - proof checks
   - bounded implementation on non-overlapping files
   - support work on remote nodes when explicitly assigned
5. Grok is best used for:
   - adversarial logic audits
   - aggressive architecture criticism
   - OpenClaw API-level orchestration prompts on Sabretooth
   - bounded second-opinion review when Codex wants pressure-testing
   - **NOT for content research or trend monitoring — use Apify Scout instead**
6. Apify Scout (`scripts/apify_content_scout.py`) is used for:
   - social media trend scraping (X, Reddit, Google Trends)
   - seeding `data/post-queue.json` with trend-aware posts
   - replacing any Grok API calls that were used for marketing content research
   - runs daily via scheduler, costs ~$0/month (Apify free tier + Ollama local)
7. Comet is best used for:
   - read-only research
   - recommendation gathering
   - current policy/platform rules
7. Local workers do not set truth. They generate drafts, packs, and machine-local outputs only.

## Hard Guardrails

- One repo, one branch, one live folder: `C:\ANTIGRAVITY`, `main`
- One GitHub source for accepted truth: `Trollz1004/ANTIGRAVITY`
- OMEGA repos and 100% charity surfaces are off-limits from ENIGMA-side work
- Square is the live payment rail
- Sabretooth is the only Telegram-owning OpenClaw orchestrator
- No mock data
- No false live claims
- No customer-facing `donate`, `donation`, or `solicitation`
- If a temporary branch is ever used, Codex must merge, push `main`, and delete the branch before calling the task done
- No AI rewrites another AI's personal memory/briefing/core protocol by default
- Shared repo docs and briefings can be updated to restore operational truth, but protected AI-specific core files stay intact unless Josh explicitly says otherwise

## Current Team Priorities

1. Keep public surfaces truthful and legally safe
2. Keep payment truth anchored to live Square behavior
3. Use `CodeX-Fleet-Watcher` for the daily proof snapshot
4. Tighten header/CSP posture on deployed public sites
5. Keep `youandinotai.com` and `onlinerecycle.org` aligned with repo truth
6. Keep Grok routed through local OpenClaw on Sabretooth only until remotes are runtime-verified

## Required Verification Pattern

Before closeout:
1. relevant build/lint/test passes locally
2. `main` is clean
3. `origin/main` is updated
4. required CI is green
5. memory/briefings are updated if the operational truth changed
