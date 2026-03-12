# TASK-ROUTING — ANTIGRAVITY

Last updated: 2026-03-12
Workspace truth: `C:\ANTIGRAVITY` on `origin/main`

This file defines who should do what across the current AI team.

## Authority Order

1. Josh decides scope and priorities.
2. Codex on Sabretooth is the orchestrator and final repo truth.
3. Gemini, Comet, Claude, and local workers operate under Codex routing.

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
5. Comet is best used for:
   - read-only research
   - recommendation gathering
   - current policy/platform rules
6. Local workers do not set truth. They generate drafts, packs, and machine-local outputs only.

## Hard Guardrails

- One repo, one branch, one live folder: `C:\ANTIGRAVITY`, `main`
- OMEGA repos and 100% charity surfaces are off-limits from ENIGMA-side work
- Square is the live payment rail
- No mock data
- No false live claims
- No customer-facing `donate`, `donation`, or `solicitation`
- If a temporary branch is ever used, Codex must merge, push `main`, and delete the branch before calling the task done

## Current Team Priorities

1. Keep public surfaces truthful and legally safe
2. Keep payment truth anchored to live Square behavior
3. Use `CodeX-Fleet-Watcher` for the daily proof snapshot
4. Tighten header/CSP posture on deployed public sites
5. Keep `youandinotai.com` and `onlinerecycle.org` aligned with repo truth

## Required Verification Pattern

Before closeout:
1. relevant build/lint/test passes locally
2. `main` is clean
3. `origin/main` is updated
4. required CI is green
5. memory/briefings are updated if the operational truth changed
