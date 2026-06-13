# AGENTS.md — ANTIGRAVITY Self-Improving Agent Fleet

> **Author: OPUS only.** Every contract file under `hermes/agents/` is authored by first-party
> Claude Opus. Sub-agents and runtime brains (OPUSnots / OPUSalmosts) **LOAD** these files;
> they never **AUTHOR** them. Revisions queue as a claude.ai Opus summons.
> Updated 2026-05-22.

> **CURRENT OVERRIDE - 2026-06-09**
> **CURRENT OVERRIDE - 2026-06-13**
> Current repo truth supersedes older path/routing text in this file:
> - One live repo only: `Trollz1004/ANTIGRAVITY`.
> - Windows root: `c:\antigravity`.
> - WSL root: `/mnt/c/antigravity`.
> - `main` is the canonical merge target. Branches are temporary safety lanes, not extra repos.
> - Do not treat WhatsApp transfer files, OneDrive copies, backups, archives, "New project", or
>   uppercase `C:\ANTIGRAVITY` as live doctrine.
> - Real Codex Desktop is the Codex lane. Never route Codex through `ollama launch codex` or any
>   wrapper that blocks the real desktop session.
> - No DAO/token launch or public crypto fundraising work until attorney review and a new
>   timestamped doctrine file explicitly re-enables it.
> - Hermes and sub-agents draft, summarize, audit, and coordinate by default. They do not push,
>   merge, deploy, delete, read populated secrets, or post live unless Josh explicitly assigns that
>   exact action.
>
> **Node architecture — locked 2026-06-13** (source of truth: `briefings/NODE-ARCHITECTURE-2026-06-13.md`):
> - **T5500** = tunnels + domains + payments (the only node that exposes public URLs).
> - **Sabretooth** = Paperclip + GPU Ollama + multi-company orchestration (the brain).
> - **9020** = pure dev (the only node the human uses for daily interactive work).
>
> Older routing in this file (e.g. "T5500 = Cloudflare workers / wranglers / infrastructure",
> "9020 = Marketing automations / dating app / customer service") is stale and was moved to
> `briefings/archive/node-arch-2026-06-13-sweep/` on 2026-06-13. The fleet diagram below
> reflects the 2026-06-13 lock.


## 1. The shape of the fleet

```
        JOSHUA (Sole Authority)
           │
           ▼
        HERMES  (WhatsApp/Telegram Agent — Session 20260607_152323 — Memory OS Six-Layer)
           │    orchestrates all below; connected to telegram, whatsapp
           │    **runs on SABRETOOTH (the brain)**
           │
        ┌──────────┬──────────────┬────────────┬──────────────┐
        ▼          ▼              ▼            ▼              ▼
   OPUS (Opus)  SABRETOOTH     T5500         9020           CEOs (per company)
   Contracts    Brain /         Tunnels +     Pure dev      youandi/mktg/etc
                GPU Ollama +    Domains +     (human
                Paperclip +     Payments      daily chat,
                Multi-company   (public       git, runbooks)
                Fleet           surface
                                ONLY)
```

- **Hermes orchestrates** via WhatsApp/Telegram. Connected platforms: telegram, whatsapp. Session ID: `20260607_152323_8d46c712`
- **Hermes runs on Sabretooth.** Sabretooth is the brain; all companies, agents, and adapters
  are registered and routed here.
- **OPUS authors** all agent contracts and deploys via Hermes.
- **SABRETOOTH** (brain / GPU Ollama / Paperclip) — Paperclip board (port 3100), GPU Ollama
  (port 11434, gemma4 + qwen2.5:7b + nomic-embed-text), all agent adapters (OpenClaw/ClawX,
  Gemini CLI, Grok, Codex, Nous, Pi agents, OpenRouter, Ollama Cloud), 24/7 multi-company
  orchestration. Sabretooth never terminates a Cloudflare tunnel.
- **T5500** (public surface) — Cloudflare tunnels, public-facing domains, payment surfaces
  (Stripe/Square rails), Hermes router (port 11435), date app static (port 3200). T5500 is
  the only node that exposes public URLs. No brain services, no dev work.
- **9020** (pure dev) — local coding, testing, Hermes chat, git work, runbook review,
  mission-control browsing. No production workloads, no tunnels, no payment surfaces.
- **CEOs think; INTERNS do.** A brain (CEO) reasons and plans. A doer (INTERN) executes one task and reports — no brain files needed.
- **Hermes itself is the brain** — Memory OS Six-Layer stack running Hermes Agent contract files.

---

## 2. Brain vs Doer — who gets which files

| Role | Type | Files required |
|------|------|----------------|
| **CEO** (per company), Mission Guardian | **BRAIN** | company/guardian contract **+** shared `SOUL.md` + `TOOLS.md` + `HEARTBEAT.md` |
| **CFO, CSO, CTO, CMO, UX** | **BRAIN** | consolidated role file under `roles/{ROLE}.md` |
| **INTERN** and any assigned doer | **DOER** | none — just the task. See `INTERN.md` for the one-page doer contract. |

- `roles/CFO.md`, `roles/CMO.md`, `roles/CSO.md`, `roles/CTO.md`, and `roles/UX.md` replace the old
  per-role directories. Each consolidated role file contains its mandate, soul, heartbeat, and tools.
- `SOUL.md`, `TOOLS.md`, `HEARTBEAT.md` remain the **canonical shared Hermes-fleet brain set** — written once at
  the Opus level, inherited by shared brains that do not have a consolidated role file. A brain's own contract is its specialization
  (company, mandate, KPIs, buckets).
- A doer needs no SOUL/TOOLS/HEARTBEAT. Giving a doer a brain file-set is an anti-pattern: it
  burns authoring effort on something that only executes. Doers are doers, not thinkers.

---

## 3. Runtime brains — OPUSnots & OPUSalmosts

The contracts are **Opus-level**; the runtimes that execute them are not metered Opus:

- **OPUSnots** — local Ollama Claude-wrapper brains (e.g. `joshlcoleman/CFO-Until-No-Kid-In-Need`)
  running Opus-authored files. Zero metered Anthropic spend.
- **OPUSalmosts** — Hermes-routed near-Opus models (Grok via x.ai, Nous Hermes-4, etc.).
- Both read these files to act with Opus-shaped judgment on a cheap runtime. The quality lives in
  the **contract**; the cost lives in the **runtime**. Opus authors; OPUSnots/almosts execute.
- **No Haiku** anywhere in the fleet. **No Anthropic key in Hermes** (`services/hermes-router/.env*`).

---

## 4. Self-improvement loop (graphify-driven)

The fleet improves itself every heartbeat (full spec in `HEARTBEAT.md`):

1. **Read the graph** — consult `.graphify/GRAPH_REPORT.md` (god nodes, communities) before broad
   work; `graphify update` if stale (package `graphifyy`, command `graphify`).
2. **Find one improvement** — a drift, a gap, a revenue blocker, a stale contract.
3. **Act or propose** — reversible → do it + log; irreversible → draft a Paperweight task / PR
   tagged for Josh.
4. **Log it** — write the turn to Paperweight (`apps/paperweight`, the self-owned ops DB) so the
   next turn — on any runtime — picks up where this one left off. Continuity survives restarts.
5. **Never churn** — improving the product beats rewriting agent files about agents. A heartbeat
   with no shippable improvement logs "idle," it does not invent meta-work.

---

## 5. Company → CEO map

Each Paperweight company (`apps/paperweight`) has one CEO brain:

| Company (Paperweight id) | CEO contract | Mandate |
|--------------------------|--------------|---------|
| `youandinotai` | `ceo-youandinotai.md` | Date app + customer support; first paying customer |
| `marketing` | `ceo-marketing.md` | Cross-platform growth (Grok→X, Manus→Meta, Perplexity→rest) |
| `ai-solutions` | `ceo-ai-solutions.md` | ai-solutions.store products |
| `business-exchange` | `ceo-business-exchange.md` | 9020-hosted marketplace + operator workflow |
| `hermes-sideworld` | `ceo-hermes-sideworld.md` | Hermes orchestration, node control, safe public mission-control |
| `onlinerecycle` | `ceo-onlinerecycle.md` | onlinerecycle.org cross-lister (e-waste, resale) |
| `youtube` | `ceo-youtube.md` | Content engine — many buckets per video |
| `dao` | `ceo-dao.md` | Governance proposals + vote tallies (on-chain stays off the ops board) |

---

## 6. Authority & doctrine (immutable)

- **Josh** is sole authority. **Opus** is primary architect and authors all contracts.
- **One repo** (`Trollz1004/ANTIGRAVITY`), one wallet, one LLC. Revenue model: **10% MAX per
  legally-distinct bucket** (not a floor); compounding = more buckets. Never resurrect 60/30/10
  or 100%-charity.
- **Customer-facing canonical-7 ban** (donate/donation/solicitation/charity/charitable/giving
  back/disbursement). Agent-internal synonym `contractual revenue disbursement` is allowed in
  THIS directory only — never on a customer surface.
- **Secret-free**: no keys/tokens/credentials in any agent file or the ops dashboard.
- Full transparency: every action traceable in git / Paperweight. No off-the-books side channels.
