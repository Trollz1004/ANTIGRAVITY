# AGENT ENTOURAGE — ANTIGRAVITY

Last updated: 2026-06-13
Workspace truth: `C:\antigravity` on `origin/main`

This is the current AI team structure for live repo work.

> **⛔ NODE ARCHITECTURE — LOCKED 2026-06-13**
> Source of truth: `briefings/NODE-ARCHITECTURE-2026-06-13.md`. Three nodes, three roles, no drift.
>
> - **T5500** = tunnels + domains + payments (the only node that exposes public URLs)
> - **Sabretooth** = Paperclip + GPU Ollama + multi-company orchestration (the brain)
> - **9020** = pure dev (the only node the human uses for daily chat and development)
>
> All AIs in this document must operate inside this lock. Any briefing, prompt, or skill that conflicts with it is stale and lives in `briefings/archive/node-arch-2026-06-13-sweep/`.

## Core Team

| Agent | Primary Tooling | Role | Authority |
|---|---|---|---|
| Codex | Codex Desktop on Sabretooth | Repo truth, architecture, payments, deployment sequencing, final push | Repo-truth execution role for `main`; owns repo execution on the Sabretooth brain |
| Gemini | Gemini in `C:\antigravity` | UI work, browser validation, bounded copy/design cleanup | Peer collaborator |
| Comet | Perplexity / Comet | Research, competitor intel, policy/current-web lookups | Research-only |
| Claude | Claude CLI/Desktop when assigned | Audit, backend support, proof work, bounded implementation | Peer collaborator when assigned |
| Grok | OpenClaw API via Sabretooth local gateway | Adversarial audit, orchestration prompt execution, harsh second-opinion pressure testing | Peer collaborator for adversarial work |
| Mini Claudes | OpenClaw / Ollama workers on Sabretooth | Draft packs, local-only tasks, scheduled support jobs | No repo truth authority |

## Operating Model

- All AIs are peers under Josh.
- Codex owns the repo-truth execution path for `main`. Every other AI on the team is a peer collaborator; the accepted end state is one GitHub, one repo, one branch, one live folder: `Trollz1004/ANTIGRAVITY` → `main` → `C:\antigravity`.
- The repo is the single source of truth. JSONBin, OneDrive copies, backups, archive folders, "New project", and uppercase `C:\ANTIGRAVITY` paths are not live doctrine.

## Node Topology (per `briefings/NODE-ARCHITECTURE-2026-06-13.md`)

| Node | Role (locked) | AI workloads |
|------|---------------|--------------|
| **T5500** | Tunnels + domains + payments (the only public-internet-facing node) | Cloudflare tunnels, payment surfaces; no brain services, no dev work |
| **Sabretooth** | Paperclip + GPU Ollama + multi-company orchestration (the brain) | Paperclip API, local Ollama models, all agent adapters (OpenClaw/ClawX, Gemini CLI, Grok, Codex, Nous, Pi agents, OpenRouter, Ollama Cloud); no tunnels |
| **9020** | Pure dev (the human's daily interactive node) | Local coding, testing, Hermes chat, git work, runbook review; no production, no tunnels, no payment surfaces |

### Orchestrator rules (Sabretooth is the brain)

- **Sabretooth is the central orchestration point.** All adapters (Nous, xAI/Grok, OpenAI Codex, Gemini CLI, OpenRouter, Pi agents, Ollama Cloud, ClawX/OpenClaw) are registered and routed here so any company on Paperclip can reach any adapter.
- **Sabretooth never terminates a Cloudflare tunnel.** Public traffic reaches Paperclip only because T5500 tunnels forward to Sabretooth's local Paperclip on `127.0.0.1:3100` via LAN/VPN.
- **Customer-support only**: ClawX / OpenClaw GUI is for customer-facing support surfaces. Never used for any other purpose.
- **Telegram chat is to be moved to 9020** when the human is ready (announce when ready; do not pre-announce).

### Self-hosted vs cloud (all nodes)

- **Self-hosted (GPU)**: Ollama on Sabretooth 1070 (gemma4 etc.)
- **Cloud / API** (available to all companies via adapters): Nous Portal (primary credits), xAI / Grok (OAuth), OpenAI Codex (OAuth), Gemini CLI, OpenRouter / Pi agents, Ollama Cloud.

## Current Automation Layer

Scheduled local proofs on Sabretooth (the brain):
- `CodeX-Fleet-Watcher`
- `CodeX-Brain-Checkpoint`
- `CodeX-Mission-Guardian`
- `CodeX-Task-Sentry`
- `CodeX-SABRETOOTH-Safe-Control`
- `OpenClaw Gateway` (local orchestrator runtime, Sabretooth)

Remote approved tasks (cold nodes, opt-in only):
- `CodeX-9020-Safe-Drafts` (9020, pure dev lane)
- `CodeX-T5500-Safe-Marketing-Audit` (T5500, payments/tunnels lane — read-only audits only)
- `CodeX-T5500-Revenue-Pack` (T5500, payments lane — read-only audits only)

> **Reminder:** T5500 is no longer a "build node" or "manus-claw" lane. It is the public-internet-facing payment/tunnel/domains node. Sandbox-style automation on T5500 violates the 2026-06-13 node lock.

## Current Mission Focus

1. Keep `youandinotai.com` truthful, stable, and Square-first (T5500 surfaces, Sabretooth brain)
2. Keep `onlinerecycle.org` operationally honest and security-hardened (T5500 surfaces, Sabretooth brain)
3. Keep watcher-based proof and daily drift detection running from Sabretooth
4. Keep payment and chain claims anchored to the live repo briefing set
5. Keep Grok/OpenClaw local, truthful, and single-owner on Telegram (route through Sabretooth)
6. Move daily chat and dev work to 9020 once it is configured as pure dev

## Mandatory Briefing Set

Every agent should anchor to these first:
- `AGENTS.md` (root)
- `briefings/NODE-ARCHITECTURE-2026-06-13.md` (locked node roles — single source of truth)
- `briefings/FOUNDER-DOCTRINE-2026-05-19.md` (immutable doctrine)
- `briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md` (10% per-bucket reserve)
- `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md`
- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`
- `briefings/HISTORICAL-ONCHAIN-STATUS.md`
- `memory/activeContext.md`

## Prohibited Drift

- No retired or recovery-only repo work from this lane
- No stale `E:\` or `C:\OPUSONLY` context as live truth
- No Stripe-first decisions
- No invented metrics
- No "live" claims that the current runtime cannot prove
- No remote Telegram polling outside Sabretooth
- No "T5500 is primary" framing — T5500 is tunnels + domains + payments, not the brain
- No "Sabretooth runs tunnels" framing — Sabretooth never terminates a Cloudflare tunnel
- No routing `claude-*` traffic through OpenRouter to satisfy any "no Anthropic key" claim (the wall is auth, not key-presence; see `HERMES-MANUS-ORCHESTRATION-LAYERS-2026-06-05.md` §2)
- No resurrecting 60/30/10, 100%-charity, or split-era revenue framing
