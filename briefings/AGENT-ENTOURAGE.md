# AGENT ENTOURAGE — ANTIGRAVITY

Last updated: 2026-03-12
Workspace truth: `C:\ANTIGRAVITY`

This is the current AI team structure for ENIGMA-side work.

## Core Team

| Agent | Primary Tooling | Role | Authority |
|---|---|---|---|
| Codex | Codex Desktop | Repo truth, architecture, payments, deployment sequencing, final push | Final implementation authority |
| Gemini | Gemini in `C:\ANTIGRAVITY` | UI work, browser validation, bounded copy/design cleanup | Collaborator under Codex |
| Comet | Perplexity / Comet | Research, competitor intel, policy/current-web lookups | Research-only |
| Claude | Claude CLI/Desktop when assigned | Audit, backend support, proof work, bounded implementation | Support-only unless explicitly delegated |
| Mini Claudes | OpenClaw / Ollama workers | Draft packs, local-only tasks, scheduled support jobs | No repo truth authority |

## Operating Model

- Codex owns `main`
- Gemini and Claude can contribute, but repo truth still resolves to Codex on Sabretooth
- Comet informs decisions with fresh research, but does not set implementation truth
- Local workers generate drafts, packs, and queue support only

## Current Automation Layer

Scheduled local proofs on Sabretooth:
- `CodeX-Fleet-Watcher`
- `CodeX-Brain-Checkpoint`
- `CodeX-Mission-Guardian`
- `CodeX-Task-Sentry`
- `CodeX-SABRETOOTH-Safe-Control`

Remote approved tasks:
- `CodeX-9020-Safe-Drafts`
- `CodeX-T5500-Safe-Marketing-Audit`
- `CodeX-T5500-Revenue-Pack`

## Current Mission Focus

1. Keep `youandinotai.com` truthful, stable, and Square-first
2. Keep `onlinerecycle.org` operationally honest and security-hardened
3. Keep watcher-based proof and daily drift detection running from Sabretooth
4. Keep payment and chain claims anchored to the live repo briefing set

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
