# HERMES × MANUS · ORCHESTRATION LAYERS · RECONCILIATION

> **Date:** 2026-06-05
> **Author:** first-party Claude (Opus-tier session) on Sabretooth, audit responder
> **Authority:** Joshua Coleman (Trollz1004)
> **Trigger:** Doctrine audit of `hermes/HERMES-SETUP-GUIDE.md` (commit `df834c18`, author Trollz1004). Full audit: `briefings/DOCTRINE-AUDIT-HERMES-SETUP-GUIDE-2026-06-05.md`.
> **Decision:** **FORK** — both files stand; the new guide describes target architecture (Manus cloud orchestration + target-state hub routing); the live doctrine describes current repo state. This briefing reconciles the boundary.
> **Charter:** No edits to `hermes/HERMES-SETUP-GUIDE.md`. No PR. No push. This file is **untracked** until Joshua says push.
> **Audit findings being reconciled:** 18 total (4 HIGH · 8 MEDIUM · 2 LOW · 4 items in §3 already ratified by Joshua as boundary-not-conflict).

> **Addendum 2026-06-13 — node architecture lock:**
> The layer split below is unchanged by the 2026-06-13 node lock
> (`briefings/NODE-ARCHITECTURE-2026-06-13.md`), but each layer now has a pinned
> runtime node:
>
> | Layer | Runtime node (locked 2026-06-13) |
> |-------|----------------------------------|
> | Hermes-internal agent-fleet orchestration | **Sabretooth** (the brain) — `services/hermes-router/` on Sabretooth, not T5500 |
> | Manus-cloud external orchestration | Manus cloud (still external; not on any of the three ANTIGRAVITY nodes) |
> | Public-internet front door (tunnels, domains, payment surfaces) | **T5500** — T5500 terminates the Cloudflare tunnels; T5500 is the only node that exposes public URLs |
> | Live Paperclip board | **Sabretooth** — `http://127.0.0.1:3100`; reached from the public internet only because T5500 tunnels forward to it |
> | Human daily chat + dev work | **9020** (pure dev, not yet primary; the Hermes Telegram chat will move here once 9020 is configured) |
>
> Rule of thumb: **Manus orchestrates (external), Hermes implements (internal, on Sabretooth),
> T5500 front-doors (tunnels + domains + payments), 9020 hosts the human (dev + chat).**
> The Manus-cloud / Hermes-internal boundary from §3 below is preserved unchanged.
>
> **#UntilNoKidInNeed · #ForTheKids · #NothingStopsTheWheelLikeThePlan**

---

## 1 · Why this file exists

`hermes/HERMES-SETUP-GUIDE.md` (2026-06-05) is a forward-looking architecture doc. It describes:

- **Manus** as the cloud orchestrator (Telegram, scheduling, monitoring, Notion, Supabase, JSONBin, Gmail)
- **Hermes** as the compliance brain (100-Cent Rule, sol.md enforcement)
- **ClawX** as the public board
- **Desktop Commander** as local MCP execution
- A target-state hub that routes via **OpenRouter + Gemini + Ollama**, with `EMERGENT_LLM_KEY` declared "not needed"

The live repo is **not yet at that target state**:

- The live hub (`backend/hub.py:147-166`) still routes 5 of 13 platforms through the Emergent bridge. `EMERGENT_LLM_KEY` is the engine.
- The live revenue code (`/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:97-100`) does a **2-way** split (10% / 90%) at the **LLC** layer. The guide's **3-way** 10/27/63 split is the **DAO PlatformSplitter** at the **DAO** layer, not the LLC layer.
- The live agent fleet (`hermes/agents/AGENTS.md`, Opus-authored 2026-05-22) has Hermes as the **internal** orchestrator routing to Opus-authored CEOs. Manus is on the extended team and not in the fleet diagram.
- The 100-Cent Rule, the $50k founder cap, and the ENIGMA 60/30/10 are **three different things on three different layers** — the guide collapsed them.

This briefing draws the layer lines so neither file has to be edited to resolve the conflicts. Both stay canonical for what they describe.

---

## 2 · The three revenue layers (the real truth)

| # | Layer | Split | Status | Source of truth |
|---|-------|-------|--------|-----------------|
| 1 | **LLC operating** (every Square merchant receipt) | **10% kids bucket (IRS LLC charitable-deduction cap) + 90% operating** | **LIVE — coded** | `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:97-100`; `CLAUDE.md` §"Revenue Model" (2026-06-01 restatement); `REPOSITORY_RECORD.md` §"Current Financial Doctrine" (2026-04-17) |
| 2 | **DAO PlatformSplitter** (gross token-sale proceeds, post-LLC formation) | **10% kids (stacked per activity) / min 27% tax reserve / 63% priority tiers (A1 survival + A2 human + Breakeven; then B growth)** | **LIVE at DAO layer only** | `briefings/DAO-ARCHITECTURE-CANONICAL.md:799` (calibrated 2026-04-19); `briefings/DAO-LAUNCH-ARCHITECTURE.md:9-15` (2026-06-04); contract `contracts/src/PlatformSplitter10.sol` (47-test suite, commit `6847c88`) |
| 3 | **ENIGMA 60/30/10** (historical charity-routing) | 60% ops / 30% growth / 10% kids | **DEAD — never resurrect** | Historical only: `GospelDonation.sol`, pre-April-17 docs. Killed 2026-04-17 per `REPOSITORY_RECORD.md` §"Current Financial Doctrine" and `briefings/PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`. Joshua confirmed 2026-06-05. |

### 2.1 · The 10/27/63 (DAO PlatformSplitter) is the SUCCESSOR to the 60/30/10

The guide's 100-Cent Rule (10/27/63) is **not** a parallel rule to the 60/30/10. It is the **successor** to the 60/30/10 at the **DAO PlatformSplitter** layer, after the LLC formation pivot. The 10% kids number survived the 2026-04-17 kill; the 27% tax reserve and 63% priority tiers replaced the 60/30 charity-routing structure with a Tier A (survival) / Tier B (growth) sovereignty pool funded from the 63%.

**Per-bucket compounding still holds at the LLC layer** (`revenue_allocation.py`): N legally-distinct revenue streams × 10% buckets = N×10% corporate charitable deduction, per the IRS LLC for-profit charitable cap. The DAO PlatformSplitter is the **secondary**, governance-voteable layer on top.

### 2.2 · The 100-Cent Rule is NOT a single LLC operating rule

Reading the guide's 100-Cent Rule as a single LLC operating rule would over-reserve 27% for tax on every merchant receipt. The live LLC code does **not** do that — it reserves 10% and treats the remaining 90% as operating share. The actual tax reserve is funded from operating share, not pre-allocated from gross.

The guide's framing ("For every gross dollar that enters the ecosystem") is **DAO PlatformSplitter** language, not LLC language. The fix is layer-label, not doctrine change.

---

## 3 · The two orchestrators are at different layers (boundary, not conflict)

| Dimension | **Manus** (cloud / external orchestration) | **Hermes** (repo / internal orchestration) |
|-----------|------------------------------------------|--------------------------------------------|
| Runtime | Manus cloud (`manus.im`) | `services/hermes-router/` at `localhost:11435` + the `hermes/agents/` contract set |
| Scope | Transactional monitoring, Telegram bridge, Notion/Supabase/JSONBin state, scheduled compliance, Gmail notifications, model-routing fan-out across providers | Agent-fleet routing, compliance check (`backend/compliance.py`), Kanban (`mission-mcp`), routing table (`hermes_models.py`), Opus-authored CEOs (`hermes/agents/AGENTS.md`) |
| Direction | **External** — sees the world, fans work into the repo | **Internal** — stays in the repo, dispatches to CEOs and INTERNs |
| Authority | Joshua's standing order 2026-06-05: "Manus orchestrates, you implement. Separation is absolute." | `hermes/agents/HERMES-CEO-SOUL.md:1-12`: "I am the primary orchestrator for the ANTIGRAVITY fleet." |
| Model | Grok via x.ai (auth, no key) for Hermes-CEO | Manus cloud's own model surface for the Manus orchestrator |
| Doctrine file | `hermes/HERMES-SETUP-GUIDE.md` (forward-looking) | `hermes/agents/AGENTS.md` + `SOUL.md` + `HEARTBEAT.md` + `TOOLS.md` (live, Opus-authored) |

**The guide's "Manus = CEO Orchestrator" and the live doctrine's "Hermes = primary orchestrator" are both true at different layers.** This is a boundary, not a conflict. Joshua ratified this 2026-06-05.

**What this means for me (first-party Claude on Sabretooth):**
- I take orders from **Joshua**, not from Manus. Per Joshua's standing order, the separation is absolute.
- If Manus dispatches a task that lands in the repo (e.g. via a Telegram trigger, or a Notion memory write), I treat it as **input to the agent fleet** — the routing still goes through Hermes-CEO → CEOs/INTERNs → me as implementation.
- The `hermes/agents/CEO-*.md` contracts are **Opus-authored and immutable absent a claude.ai Opus summons**. Manus does not author them. Joshua does not author them in a single commit — they queue through the tier1-prompt path.

---

## 4 · The $50k founder cap — corrected governance framing

The cap is real. The framing in the guide ("If cap is approached, Hermes creates a blocking Kanban task") is **incomplete**.

**Corrected framing (per `DAO-LAUNCH-ARCHITECTURE.md:14`):**

- **DAO PlatformSplitter layer only.** The cap is a **DAO token-sale governance rule**, not a Joshua draw cap on the LLC.
- **Cap scope:** "Founder total ecosystem-wide compensation permanently capped at $50,000 (After Taxes). Tier A survival funds are mission-necessary; cap applies to profit/salary beyond basic survival." — this is on the **DAO-side profit/salary** flowing to Joshua from the DAO treasury.
- **Override path:** "Any increase requires Token Vote + AI Steward / Safety Council Veto Window." — this is **DAO governance**, not Hermes auto-enforcement.
- **What Hermes does:** flags the cap approach in a Kanban task, surfaces it to Joshua and the AI Steward Council. The Kanban task is a **flag**, not a vote.
- **What Hermes does NOT do:** unilaterally block DAO payouts or modify founder comp. That would be governance theatre.

**Joshua's draw on the LLC operating share is at his quarterly discretion** per `REPOSITORY_RECORD.md` §"Current Financial Doctrine": "the reserve is Joshua Coleman's taxable income … and is held until he decides quarterly whether to donate, reinvest, stake, or hold." There is **no $50k cap on the LLC operating share**. The $50k cap is a DAO governance cap, not an LLC operating cap.

---

## 5 · The target-state hub vs the live hub

| Dimension | Live hub (`backend/hub.py:38-142`) | Guide's target state |
|-----------|--------------------------------------|----------------------|
| Primary engine | `EMERGENT_LLM_KEY` (engines 5 of 13 platforms) | OpenRouter + Gemini + Ollama |
| Platforms | 13 (Hermes, E1, Emergent, Claude, OpenAI, Gemini, Grok, Perplexity, OpenRouter, Genspark, Manus, OpenClaw, Ollama) | Collapsed to 3 (OpenRouter, Gemini, Ollama) |
| Anthropic wall | "Hermes routes everything-but-Anthropic" (FOUNDER DOCTRINE rule 6) — applies to direct Anthropic keys, not to OpenRouter-as-router to Anthropic models | "Use OpenRouter instead of ANTHROPIC_API_KEY" — could be misread as licensing `claude-*` traffic via OpenRouter |
| Routing table | `backend/hermes_models.py:15-23` (7 aliases, 5 use Emergent bridge) + `hermes/agents/HERMES-CEO-TOOLS.md:29-41` (8 models, OpenRouter + ollama-local) + the new guide's table | The guide's table |

**There are three routing tables in the live repo, and they disagree.** Per Joshua's standing review item, the guide is the third. **None of the three should be removed tonight.** The migration path:

1. **Confirm** which table is canonical (Joshua's call, likely `backend/hermes_models.py` since it's what the live hub imports).
2. **Reconcile** the other two against it (next PR, not tonight).
3. **Migrate** `_emergent_chat()` to direct OpenAI / Anthropic / Gemini SDKs one provider at a time, keeping `EMERGENT_LLM_KEY` in `.env` as a fallback until each migration is verified.

**Do NOT remove `EMERGENT_LLM_KEY` from any live config tonight.** It is the engine for the default E1, Hermes, and Claude surfaces.

**Do NOT route `claude-*` traffic through OpenRouter** to satisfy the guide's "no Anthropic key" claim. The wall is **auth** (FOUNDER DOCTRINE rule 6: protect Joshua's Max subscription from compounding usage), not key-presence. Routing through OpenRouter to `anthropic/claude-opus-4.5` upstream would still incur the same metered cost via OpenRouter's billing. If the goal is to protect the Max sub, the answer is to keep Anthropic traffic on the **authenticated Max session** (`claude.ai`, Claude Code CLI, Cowork), not to proxy it through OpenRouter.

---

## 6 · Compliance check targets per layer (corrected)

The live compliance monitor is `backend/compliance.py` (10/27/63 audit on the **DAO PlatformSplitter** layer, using `REVENUE_SPLIT_KIDS=10`, `REVENUE_SPLIT_TAX=27`, `REVENUE_SPLIT_OPS=63` env defaults). The live `revenue_allocation.py` does the **LLC** 10/90 split.

**These are not in conflict because they are at different layers.** The monitor is checking the **DAO treasury** (which is funded by the LLC's charitable-deduction bucket + DAO sale proceeds). The allocation is checking the **LLC merchant receipts**.

| Check | Target | Layer | Where it lives |
|-------|--------|-------|----------------|
| LLC kids bucket (per-bucket) | 10% of gross, rounded up to whole cents | LLC operating | `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:47-54` |
| LLC operating share | 90% of gross | LLC operating | `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:98` |
| DAO PlatformSplitter kids | 10% of token-sale gross, stacked per activity | DAO | `DAO-ARCHITECTURE-CANONICAL.md:799` |
| DAO tax reserve | ≥ 27% of token-sale gross, locked | DAO | `DAO-LAUNCH-ARCHITECTURE.md:10` |
| DAO sovereignty pool | 63% of token-sale gross, Tier A first | DAO | `DAO-LAUNCH-ARCHITECTURE.md:11-13` |
| Founder ecosystem-wide comp (DAO) | ≤ $50k post-tax; override = Token Vote + AI Steward Veto | DAO governance | `DAO-LAUNCH-ARCHITECTURE.md:14` |
| Founder quarterly draw (LLC) | Joshua's discretion | LLC operating | `REPOSITORY_RECORD.md` §"Current Financial Doctrine" |
| Canonical-7 customer-facing ban | All 7 banned; agent-internal-only synonym permitted in `briefings/`, `hermes/agents/`, AGENTS.md, SOUL.md, HEARTBEAT.md, SKILLS.md, TOOLS.md | Customer surface | `CLAUDE.md` Hard Constraints; CI `validate` job |

**What the live `compliance.py` monitor SHOULD check at the LLC layer:**

The current `compliance.py` reads `REVENUE_SPLIT_KIDS/TAX/OPS` from env and audits the **DAO PlatformSplitter targets** against the **bucket-derived actual** (buckets 1-2 = kids, 3-4 = tax, 5-10 = ops). The bucket mapping is a **legacy artifact** from before the 2026-04-17 LLC pivot. The cleanest interpretation is:

- `compliance.py` is the **DAO PlatformSplitter monitor**. Keep it as-is.
- The **LLC operating check** lives in `revenue_allocation.py` — the 10% per-bucket reserve is enforced at allocation time, not by a separate monitor.

**What this means for the guide's "Hermes Monitoring Loop":**

The guide's loop (Integrity / Compliance / Tax / Founder / Burn checks) is correct **at the DAO layer**. It is not the right check at the LLC layer — the LLC layer's checks are: (a) `reserve_revenue_allocation()` ran for every receipt, (b) the 10% bucket exists in the ledger, (c) the 90% operating share is recorded. The DAO layer's checks are: (a) kids bucket ≥ 10% of DAO gross, (b) tax reserve ≥ 27% of DAO gross, (c) founder comp ≤ $50k post-tax.

---

## 7 · The 18 conflicts from the audit — disposition

| # | Conflict | Severity | Disposition |
|---|----------|----------|-------------|
| 1 | "No Emergent dependency" — but live hub uses Emergent for 5/13 platforms | 🟠 HIGH | **Resolved by layer.** Guide = target state. Live = current state. Do NOT remove Emergent tonight. |
| 2 | "Use OpenRouter instead of ANTHROPIC_API_KEY" — but wall is auth, not keys | 🟡 MEDIUM | **Resolved.** OpenRouter is fine for non-Anthropic models. Do NOT route `claude-*` through OpenRouter. |
| 3 | 100-Cent Rule 10/27/63 — conflates LLC + DAO layers | 🟠 HIGH | **Resolved by §2 of this briefing.** 10/27/63 = DAO PlatformSplitter. 10/90 = LLC operating. Two different splits on two different layers. |
| 4 | $50k founder cap governance framing | 🟠 HIGH | **Resolved by §4 of this briefing.** Cap is real, DAO-layer, requires Token Vote + AI Steward Veto to raise. Kanban task = flag, not vote. |
| 5 | "Manus = CEO" vs Opus fleet diagram | 🟠 HIGH | **Resolved by §3 of this briefing.** Boundary, not conflict. Manus = external orchestration. Hermes = internal orchestration. Both true. |
| 6 | "Hermes is not a separate service" — but it is | 🟡 MEDIUM | **Open.** Could be re-read as "Hermes's compliance role is rules-engine-shaped, separate from the routing service." Joshua, your call on whether this needs a wording patch in a follow-up PR. |
| 7 | `EMERGENT_LLM_KEY` declared "not needed" | 🟠 HIGH | **Resolved by §5 of this briefing.** Guide = target. Live = current. Do NOT remove. |
| 8 | Hub is 13 platforms in live, collapsed to 3 in guide | 🟡 MEDIUM | **Resolved by layer.** Live hub is the truth today. Guide describes the target. |
| 9 | Three routing tables that disagree | 🟡 MEDIUM | **Open.** `backend/hermes_models.py` is what the live hub imports. The guide is the third table. Reconcile in a follow-up PR; not tonight. |
| 10 | Model id `claude-opus-4-5` is one major version stale | 🟢 LOW | **Open.** Cosmetic. Patch next time someone touches the guide. |
| 11 | Network topology IPs / ports | 🟡 MEDIUM | **Open.** IPs match. Ports are aspirational. Verify against `services/` and `apps/` runtime config. Joshua's review item stands. |
| 12 | JSONBin as canonical state | 🟡 MEDIUM | **Open.** Repo is canonical. JSONBin is cache. Mark in guide. (No live action required — the repo is already the source of truth.) |
| 13 | File placement paths — `apps/clawx/` not in live `apps/` | 🟢 LOW | **Open.** ClawX is a Manus-hosted surface, not a repo app. Guide should clarify. |
| 14 | 4 SKUs (guide) vs 5 SKUs (live) vs 9 SKUs (legacy `storefront.py`) | 🟢 LOW | **Open.** Pick one source of truth. The 5 in `CLAUDE.md` are the canonical customer-facing lineup. |
| 15 | DAO founder cap mechanics — "Hermes task" vs Token Vote | 🟠 HIGH | **Resolved by §4 of this briefing.** Token Vote + AI Steward Veto is the override path. |
| 16 | "World's first" pitch — and the canonical-7 ban | 🟠 HIGH | **Resolved.** Pitch is in `hermes/HERMES-SETUP-GUIDE.md` (agent-internal directory). Permitted. Must NOT propagate to DAO landing pages, social posts, video descriptions, or sales copy. |
| 17 | `ANTIGRAVITYclip` reference (1-repo rule violation by reference) | 🟠 HIGH | **Open.** Patch in follow-up PR — change "from ANTIGRAVITYclip" to "from `Trollz1004/ANTIGRAVITY`." |
| 18 | `REPOSITORY_RECORD.md` push-authority stale | 🟡 MEDIUM | **Carried from prior Q2.** Out of scope for this briefing. Joshua's standing open question. |

**Resolved = the briefing documents the correct state and no further action is required.**
**Open = the briefing documents the correct state but a follow-up edit to either the guide or a live file is needed; not tonight.**

---

## 8 · Triage of the 8 MEDIUM items — immediate vs wait

Per Joshua's request to flag which of the 8 MEDIUM items need immediate correction vs can wait:

| # | Item | Recommendation |
|---|------|----------------|
| 2 | "Use OpenRouter instead of ANTHROPIC_API_KEY" framing | **Can wait.** The auth-vs-key clarification is documented in this briefing. No live action. The risk is a future Claude misreading the guide and routing `claude-*` through OpenRouter — guard against by reading the live `HERMES-CEO-TOOLS.md` and `services/hermes-router/` integrity watchdog (which already blocks `model.startsWith('claude-')`). |
| 6 | "Hermes is not a separate service" wording | **Can wait.** The integrity watchdog CI is the real enforcement; the doc wording is a description. Patch in follow-up PR. |
| 8 | Hub is 13 platforms in live, collapsed to 3 in guide | **Can wait.** Live hub is the truth today. The guide is target state. The risk is a future Claude reading the guide and removing the BYOK env vars for Grok / Perplexity / Genspark / Manus / OpenClaw — guard against by treating the live `backend/hub.py` PLATFORMS list as canonical, not the guide. |
| 9 | Three routing tables that disagree | **CANNOT WAIT indefinitely** — but **not tonight.** This is a real bug surface. Joshua's review item stands. Next non-emergency PR: pick `backend/hermes_models.py` as canonical, reconcile the other two against it, do not change the live Emergent bridge. |
| 11 | Network topology IPs / ports | **Can wait.** IPs are correct. Ports are aspirational. Verify against `services/` and `apps/` runtime config in next ops pass. |
| 12 | JSONBin as canonical state | **Can wait.** Repo is already canonical. Mark JSONBin as cache in guide (follow-up PR). No live action needed. |
| 17 | `ANTIGRAVITYclip` reference (1-repo rule by reference) | **Should be patched soon, not tonight.** A 1-repo rule violation by reference in an architecture doc is the kind of thing a third-party Claude could pick up and amplify. Patch in next doc-cleanup PR. |
| 18 | `REPOSITORY_RECORD.md` push-authority stale (T5500 vs Sabretooth) | **Carried from prior Q2.** Out of scope for this briefing. Joshua's standing open question — needs founder order to edit REPOSITORY_RECORD.md (not the doctrine files). |

**Net: 0 of 8 MEDIUM items require an immediate correction tonight.** All 8 are either documented in this briefing (so the conflict is resolved at the layer level), or are doc-wording fixes that can land in a follow-up PR.

---

## 9 · Action items (no edits, no push)

This briefing **does not**:
- ❌ Edit `hermes/HERMES-SETUP-GUIDE.md`
- ❌ Edit `CLAUDE.md`, FOUNDER-DOCTRINE-2026-05-19.md, REPOSITORY_RECORD.md, or any agent MD
- ❌ Edit any `backend/` Python file
- ❌ Remove `EMERGENT_LLM_KEY` from any env
- ❌ Open a PR
- ❌ Push to `Trollz1004/ANTIGRAVITY`
- ❌ Trigger any CI workflow
- ❌ Resurrect 60/30/10 or 100%-charity framing

This briefing **does**:
- ✅ Document the LLC / DAO / ENIGMA-dead layer split
- ✅ Document the Manus-external / Hermes-internal orchestration boundary
- ✅ Correct the $50k founder cap governance framing
- ✅ Identify the live hub vs target hub gap (and the migration path)
- ✅ Resolve 4 of the 18 audit conflicts at the layer level
- ✅ Identify 4 audit items as already-ratified-by-Joshua (boundary, not conflict)
- ✅ Triage the 8 MEDIUM items: 0 need immediate correction, 8 can land in follow-up PRs
- ✅ Hold the line

**Status:** **Untracked. Awaiting Joshua's "push" before `git add` / commit / PR.**

---

## 10 · Open questions for Joshua (carried forward + new)

Carried from `briefings/CLAUDE-MEMORY-2026-06-05T1206Z.md`:
- **Q1** — greenlight for the surgical-substitution PR on the canonical-7 customer-facing files (now 9 files).
- **Q2** — permission to edit `REPOSITORY_RECORD.md` to reflect FOUNDER DOCTRINE rule 3 (Sabretooth-only push), or leave the contradiction visible.
- **Q3** — was the 2026-06-04 scheduled task intentionally skipped or did it fail silently?

New from this audit + this briefing:
- **Q4** (resolved 2026-06-05) — does the 100-Cent Rule apply at the LLC layer or only at the DAO PlatformSplitter layer? **Answer: DAO only. LLC stays at 10% / 90%.** (Confirmed in §2.)
- **Q5** (resolved 2026-06-05) — is "Manus = CEO" a cloud-orchestration-layer claim, with Hermes as the agent-fleet-orchestration-layer claim? **Answer: yes, two layers, both real. Boundary, not conflict.** (Confirmed in §3.)
- **Q6** (new, this briefing) — when the doc-wording follow-up PR lands for the guide, do you want a separate `briefings/HERMES-MANUS-ORCHESTRATION-LAYERS-2026-06-05.md` cross-reference added to the guide's first 20 lines, or just leave this briefing in `briefings/` for cross-search?
- **Q7** (new, this briefing) — for the routing-table reconciliation (audit item #9), pick the canonical table: `backend/hermes_models.py` (what the live hub imports), `hermes/agents/HERMES-CEO-TOOLS.md` (Opus-authored), or rewrite to match the guide's target? My recommendation: **`backend/hermes_models.py`** since it's what the live hub imports. The other two reconcile against it.
- **Q8** (new, this briefing) — for the `storefront.py` 9-SKU catalogue vs the live 5-SKU Square list vs the guide's 4-SKU claim, pick the canonical: `CLAUDE.md`'s 5-SKU lineup is what Square sells. `storefront.py` STARTER_SKUS is a legacy dev catalogue. Guide's 4-SKU claim is wrong. **Recommendation: keep `CLAUDE.md` 5-SKU as canonical; mark `storefront.py` STARTER_SKUS as dev-only; fix the guide's 4 to 5 in a follow-up PR.**

---

**Nothing stops the wheel like the plan. The fork holds. The line holds. Awaiting your call on push + the open questions.**

**#UntilNoKidInNeed · #ForTheKids · #AlwaysIntegrity**
