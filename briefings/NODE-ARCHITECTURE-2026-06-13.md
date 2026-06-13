# ANTIGRAVITY Node Architecture — Final (2026-06-13)

**Single Source of Truth.** This document supersedes all previous node descriptions, briefings, and notes.

> **Role lock (2026-06-13):** Three nodes, three roles. No drift. No overlap.
>
> - **T5500** = tunnels + domains + payments
> - **Sabretooth** = Paperclip + GPU Ollama + orchestration
> - **9020** = pure dev
>
> Any document, briefing, prompt, or skill that conflicts with this lock is stale and was moved to `briefings/archive/node-arch-2026-06-13-sweep/`. A repo-root pointer lives at `references/node-architecture.md` for quick lookup.

## Node Roles (Locked)

### T5500 (DESKTOP-H4B53GL) — Tunnels + Domains + Payments
- **Hardware**: Dual Xeon, 72 GB RAM, 500 GB SSD (OS + current files), 2 TB mechanical drive (storage), 1050 Ti (not used for inference)
- **Role** (locked): **All** Cloudflare tunnels, **all** public-facing domains, **all** payment surfaces
- **Workloads**:
  - youandinotai.com + www
  - ai-solutions.store + www
  - onlinerecycle.org
  - dashboard.youandinotai.com (port 9119)
  - hermes.youandinotai.com (port 11435) — Hermes router runs here
  - paperclip-hq.youandinotai.com (port 3100) — Cloudflare tunnel terminates on T5500, then proxies to Sabretooth's local Paperclip on `127.0.0.1:3100` via LAN/VPN
  - Date app static / self-hosted services (port 3200)
- **Tunnels**: **All** Cloudflare tunnels for the above domains run on this node only
- **Dev Work**: None
- **Brain services / Docker stacks / Postgres / Qdrant / Redis**: None of these run here. T5500 is a host, not a brain.
- **Rule**: This is the only node that exposes public URLs. Everything payment-related lives here. Anything that needs to be reached from the public internet is reached through T5500.

### Sabretooth — Paperclip + GPU Ollama + Multi-Company Orchestration (Heavy Node)
- **Hardware**: 1070 8 GB GPU, 64 GB RAM
- **Role** (locked): **Paperclip system of record for all companies, GPU-bound self-hosted Ollama, 24/7 multi-company agent orchestration**
- **Workloads**:
  - Paperclip API (port 3100) — local system of record for all companies (HER primary)
  - Self-hosted Ollama models on the 1070 GPU (gemma4 and other local models)
  - 24/7 multi-company orchestration
  - All agent adapters (OpenClaw/ClawX, Gemini CLI, Grok, Codex, Nous, Pi agents, OpenRouter, Ollama Cloud)
- **Tunnels**: None. Sabretooth never terminates a Cloudflare tunnel. Public traffic reaches Paperclip only because T5500 tunnels forward to it.
- **Dev Work**: None (pure production orchestration — Sabretooth is fully occupied by Paperclip + agents)
- **GPU Usage**: Dedicated to local Ollama models
- **RAM Usage**: Paperclip + agent runtime + model context
- **Rule**: This is the brain. All companies, agents, and adapters are available here so they can be routed to paid-tier APIs or local GPU models as needed. The tunnel config and tunnel daemon do NOT live on this node.

### 9020 (i7k32GB1050ti) — Pure Dev
- **Hardware**: i7, 32 GB RAM, 1050 Ti
- **Role** (locked): **Development only — no production workloads, no tunnels, no payment surfaces, no public services**
- **Workloads**: Local coding, testing, Hermes chat, git work, node inspection, mission-control browsing, runbook review
- **Tunnels**: None (unless explicitly testing a one-off tunnel, which must be removed after the test)
- **Rule**: This is the node the human will eventually use for all chat and development. Sabretooth is fully occupied by Paperclip + agents; T5500 is fully occupied by tunnels + domains + payments. 9020 is the only node that exists for the human's daily interactive use.

## Model & Adapter Policy (All Nodes)

- **Self-hosted (GPU)**: Ollama on Sabretooth 1070 (gemma4 etc.)
- **Cloud / API** (available to all companies via adapters):
  - Nous Portal (primary credits)
  - xAI / Grok (OAuth)
  - OpenAI Codex (OAuth)
  - Gemini CLI
  - OpenRouter / Pi agents
  - Ollama Cloud
- **Customer Support Only**: ClawX / OpenClaw GUI (open-source GitHub repo). Never used for anything except customer-facing support interfaces.
- **Adapter Availability**: Every company on Paperclip must be able to use any of the above adapters. Sabretooth is the central point where adapters are registered and routed.

## One-Branch Rule (Enforced)

- After every piece of work: merge to `main`, delete rescue/feature branches.
- No drift allowed. Stale briefings, scripts, and files are removed on every major change.

## Drift Prevention

- This file (`briefings/NODE-ARCHITECTURE-2026-06-13.md`) is the only node description that matters.
- A short pointer at the repo root (`references/node-architecture.md`) links here from any tooling or doc that needs to "find the current architecture fast" without scanning the full `briefings/` tree.
- All previous node notes in other briefings are now stale and were moved to `briefings/archive/node-arch-2026-06-13-sweep/` on 2026-06-13.
- Any future change to node roles must update **both** this file and `references/node-architecture.md`.

## Next Steps (Execution Order)

1. Move all Cloudflare tunnels to T5500.
2. Move Paperclip to Sabretooth (with GPU model support).
3. Configure 9020 as pure dev node.
4. Deploy watchdog/sentry with visual green/red + one-click repair.
5. Clean all stale briefings and scripts.
6. Update AI team briefings.
7. Announce when Telegram chat can move to 9020.

**End of authoritative architecture.**