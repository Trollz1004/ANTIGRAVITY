# ANTIGRAVITY Node Architecture — Final (2026-06-13)

**Single Source of Truth.** This document supersedes all previous node descriptions, briefings, and notes.

## Node Roles (Locked)

### T5500 (DESKTOP-H4B53GL) — Production Self-Host + Payments
- **Hardware**: Dual Xeon, 72 GB RAM, 500 GB SSD (OS + current files), 2 TB mechanical drive (storage)
- **Role**: All public-facing domains, payment surfaces, and Cloudflare tunnels
- **Workloads**:
  - youandinotai.com + www
  - ai-solutions.store + www
  - onlinerecycle.org
  - dashboard.youandinotai.com (port 9119)
  - hermes.youandinotai.com (port 11435)
  - paperclip-hq.youandinotai.com (port 3100)
  - Date app static / self-hosted services (port 3200)
- **Tunnels**: **All** Cloudflare tunnels for the above domains run on this node only
- **Dev Work**: None
- **GPU**: 1050 Ti (not used for inference)
- **Rule**: This is the only node that exposes public URLs. Everything payment-related lives here.

### Sabretooth — Paperclip + Multi-Company 24/7 Orchestration (Heavy Node)
- **Hardware**: 1070 8 GB GPU, 64 GB RAM
- **Role**: Paperclip (multiple companies), heavy agent orchestration, self-hosted models
- **Workloads**:
  - Paperclip API (port 3100) — system of record for all companies (HER primary)
  - Self-hosted Ollama models on GPU (gemma4 and other local models)
  - 24/7 multi-company orchestration
  - All agent adapters (OpenClaw/ClawX, Gemini CLI, Grok, Codex, Nous, Pi agents, OpenRouter, Ollama Cloud)
- **Tunnels**: None
- **Dev Work**: None (pure production orchestration)
- **GPU Usage**: Dedicated to local Ollama models
- **RAM Usage**: Paperclip + agent runtime + model context
- **Rule**: This node is the brain. All companies, agents, and adapters are available here so they can be routed to paid-tier APIs or local GPU models as needed.

### 9020 (i7k32GB1050ti) — Developer Workstation
- **Hardware**: i7, 32 GB RAM, 1050 Ti
- **Role**: Development only
- **Workloads**: Local coding, testing, Hermes chat, git work, node inspection
- **Tunnels**: None (unless explicitly testing)
- **Rule**: This is the node the human will eventually use for all chat and development. Sabretooth will be fully occupied by Paperclip + agents.

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
- All previous node notes in other briefings are now stale and will be removed.
- Any future change to node roles must update this file first.

## Next Steps (Execution Order)

1. Move all Cloudflare tunnels to T5500.
2. Move Paperclip to Sabretooth (with GPU model support).
3. Configure 9020 as pure dev node.
4. Deploy watchdog/sentry with visual green/red + one-click repair.
5. Clean all stale briefings and scripts.
6. Update AI team briefings.
7. Announce when Telegram chat can move to 9020.

**End of authoritative architecture.**