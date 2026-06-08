# AGENTS.md — ANTIGRAVITY Self-Improving Agent Fleet

> **Author: OPUS only.** Every contract file under `hermes/agents/` is authored by first-party
> Claude Opus. Sub-agents and runtime brains (OPUSnots / OPUSalmosts) **LOAD** these files;
> they never **AUTHOR** them. Revisions queue as a claude.ai Opus summons.
> Updated 2026-05-22.

---

## 1. The shape of the fleet

```
        JOSHUA (Sole Authority)
           │
           ▼
        HERMES  (WhatsApp/Telegram Agent — Session 20260607_152323 — Memory OS Six-Layer)
           │    orchestrates all below; connected to telegram, whatsapp
           │
        ┌──────────┬──────────────┬────────────┬──────────────┐
        ▼          ▼              ▼            ▼              ▼
   OPUS (Opus)  9020 NODE    T5500 NODE   INTERNS         CEOs (per company)
   Contracts    Marketing     Cloud/Infra   Doers        youandi/mktg/etc
                Dating App    Wranglers
                Customer Svc  Cloudflare
```

- **Hermes orchestrates** via WhatsApp/Telegram. Connected platforms: telegram, whatsapp. Session ID: `20260607_152323_8d46c712`
- **OPUS authors** all agent contracts and deploys via Hermes.
- **9020 NODE** (GPU primary) — Marketing automations, dating app, customer service.
- **T5500 NODE** (Orchestrator) — Cloudflare workers, wranglers, infrastructure.
- **CEOs think; INTERNS do.** A brain (CEO) reasons and plans. A doer (INTERN) executes one task and reports — no brain files needed.
- **Hermes itself is the brain** — Memory OS Six-Layer stack running Hermes Agent contract files.

---

## 2. Brain vs Doer — who gets which files

| Role | Type | Files required |
|------|------|----------------|
| **CEO** (per company), CFO, CSO, CTO, CMO, Mission Guardian | **BRAIN** | `AGENT.md` (mandate) **+** shared `SOUL.md` + `TOOLS.md` + `HEARTBEAT.md` |
| **INTERN** and any assigned doer | **DOER** | none — just the task. See `INTERN.md` for the one-page doer contract. |

- `SOUL.md`, `TOOLS.md`, `HEARTBEAT.md` are the **canonical shared brain set** — written once at
  the Opus level, inherited by every brain. A brain's own `AGENT.md` is its specialization
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
