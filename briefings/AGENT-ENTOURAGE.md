# AGENT ENTOURAGE — ANTIGRAVITY

Last updated: 2026-03-13
Workspace truth: `C:\ANTIGRAVITY`

This is the current AI team structure for ENIGMA-side work.

## Core Team

| Agent | Primary Tooling | Role | Authority |
|---|---|---|---|
| Codex | Codex Desktop | Repo truth, architecture, payments, deployment sequencing, final push | Repo-truth execution role for `main` |
| Gemini | Gemini in `C:\ANTIGRAVITY` | UI work, browser validation, bounded copy/design cleanup | Peer collaborator |
| Comet | Perplexity / Comet | Research, competitor intel, policy/current-web lookups | Research-only |
| Claude | Claude CLI/Desktop when assigned | Audit, backend support, proof work, bounded implementation | Peer collaborator when assigned |
| Grok | OpenClaw API via Sabretooth local gateway | Adversarial audit, orchestration prompt execution, harsh second-opinion pressure testing | Peer collaborator for adversarial work |
| Mini Claudes | OpenClaw / Ollama workers | Draft packs, local-only tasks, scheduled support jobs | No repo truth authority |

## Operating Model

- All AIs are peers under Josh
- Codex owns the repo-truth execution path for `main`
- Gemini, Claude, and Grok can contribute, but repo truth still resolves to Codex on Sabretooth
- Comet informs decisions with fresh research, but does not set implementation truth
- Grok operates through the Sabretooth OpenClaw gateway, not as an independent repo authority
- Local workers generate drafts, packs, and queue support only
- No AI changes another AI's personal memory file, core protocol, or protected briefing by default
- Shared repo briefings may be aligned when operational truth changes, but the accepted end state is still one GitHub, one repo, one branch, one live folder: `Trollz1004/ANTIGRAVITY` → `main` → `C:\ANTIGRAVITY`

## Current Automation Layer

Scheduled local proofs on Sabretooth:
- `CodeX-Fleet-Watcher`
- `CodeX-Brain-Checkpoint`
- `CodeX-Mission-Guardian`
- `CodeX-Task-Sentry`
- `CodeX-SABRETOOTH-Safe-Control`
- `OpenClaw Gateway` (local orchestrator runtime)

Remote approved tasks:
- `CodeX-9020-Safe-Drafts`
- `CodeX-T5500-Safe-Marketing-Audit`
- `CodeX-T5500-Revenue-Pack`

## Current Mission Focus

1. Keep `youandinotai.com` truthful, stable, and Square-first
2. Keep `onlinerecycle.org` operationally honest and security-hardened
3. Keep watcher-based proof and daily drift detection running from Sabretooth
4. Keep payment and chain claims anchored to the live repo briefing set
5. Keep Grok/OpenClaw local, truthful, and single-owner on Telegram

## Mandatory Briefing Set

Every agent should anchor to these first:
- `AGENTS.md`
- `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md`
- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
- `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md`
- `memory/activeContext.md`

## Prohibited Drift

- No OMEGA repo work from this lane
- No stale `E:\` or `C:\OPUSONLY` context as live truth
- No Stripe-first decisions
- No invented metrics
- No “live” claims that the current runtime cannot prove
- No remote Telegram polling outside Sabretooth
