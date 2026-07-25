# DOCTRINE AUDIT · HERMES + MANUS CEO SETUP GUIDE v2.0

> **Audit date:** 2026-06-05
> **File audited:** `hermes/HERMES-SETUP-GUIDE.md` (commit `df834c18`, author Trollz1004, 2026-06-05)
> **Authority referenced:** `briefings/FOUNDER-DOCTRINE-2026-05-19.md` (immutable), `CLAUDE.md` (auto-loaded), `hermes/agents/AGENTS.md` (Opus-authored, 2026-05-22), `hermes/agents/HERMES-CEO-SOUL.md` (Opus-authored), `briefings/DAO-ARCHITECTURE-CANONICAL.md` (2026-04-19), `briefings/DAO-LAUNCH-ARCHITECTURE.md` (2026-06-04), `briefings/REVENUE-PIVOT-REPORT.md` (2026-06-04), `briefings/REPOSITORY_RECORD.md` (2026-05-13), `briefings/CLAUDE-MEMORY-2026-06-{01,02,03,05}T*.md`, `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` (live code), `backend/hub.py` (live hub), `backend/hermes_models.py` (live alias table), `backend/compliance.py` (live monitor), `backend/storefront.py` (live catalogue), `backend/fastapi-app/app/config.py` (live env config), `backend/fastapi-app/app/secrets_rotation_config.json` (live rotation ledger).
>
> **Audit charter:** Hold the line. **No edits to `hermes/HERMES-SETUP-GUIDE.md`.** No edits to any doctrine file. No PR. No push. Report only.
>
> **Joshua's stated position (2026-06-05):** the new guide IS canonical for what it states as fact (Manus = CEO orchestrator, Hermes = compliance brain, ClawX = the board, Desktop Commander = local MCP, no Emergent, 1-repo, JSONBin `6a230263f5f4af5e29beef15`, Telegram `@ManusHasHands_Bot` → `6244456983`, Notion `376a4be9d37e81b69764f0d228aad977`). Joshua's standing review items: model routing table, network topology IPs, DAO split percentages, file placement paths. Joshua's role for me is unchanged: architecture, repo-safe execution, push authority on Sabretooth, take orders from Joshua only.

---

## 1 · What is TRUE in `hermes/HERMES-SETUP-GUIDE.md` (verified against live repo)

| # | Claim in guide | Verification | Status |
|---|---|---|---|
| 1 | **1-repo policy** — `Trollz1004/ANTIGRAVITY` non-negotiable | FOUNDER DOCTRINE rule 1, `CLAUDE.md` §"1-REPO POLICY", live `main` branch | ✅ TRUE |
| 2 | **No Emergent dependency** — routes via OpenRouter + Gemini + local Ollama | `backend/hub.py` `_emergent_chat()` still exists and is the default E1 / Claude / OpenAI / Gemini bridge, but `EMERGENT_LLM_KEY` is the engine; OpenRouter and Grok are BYOK paths (`backend/hub.py:94-113`). The "No Emergent" claim is **aspirational** — see §2 conflict #1 | ⚠️ PARTIALLY TRUE |
| 3 | **JSONBin state: `6a230263f5f4af5e29beef15`** | Not verifiable in repo (third-party store), but matches `briefings/HERMES-CEO-READY-2026-04-19.md` and the running Hermes-CEO-Ready doc lineage | 🟡 UNVERIFIED (third-party bin, not in repo) |
| 4 | **Telegram bridge: `@ManusHasHands_Bot` → chat_id `6244456983`** (verified, live) | Live FastAPI backend already wires Telegram: `config.py:57-58` (`telegram_bot_token`, `telegram_chat_id`), `secrets_rotation_config.json:55-58` (rotated 2026-05-19), broadcast endpoints in `backend/hub.py:349-374`. Token + chat id are the only envs needed; whether they hold the new values is a **runtime** question the guide does not prove | 🟡 PARTIALLY TRUE (wiring is real; specific bot/chat values are founder-asserted, not repo-verified) |
| 5 | **Notion memory page `376a4be9d37e81b69764f0d228aad977`** | Not verifiable in repo (Notion is external). Recent `CLAUDE-MEMORY-2026-06-{01,02,03,05}T*.md` runs all reference Notion page `372a4be9-d37e-81d1-95c0-da68a3308d4c` for "Paperweight Daily Memory" — DIFFERENT ID from the guide's claim | 🔴 MISMATCH (guide's id `376a4be9...` vs live id `372a4be9...`; first 4 chars differ — likely a typo in the new guide, but I cannot edit it) |
| 6 | **Square is the only processor for youandinotai.com** | `CLAUDE.md` §"Payments — per-surface ToS", `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` (Square-only `square_payment_id` allocation), `REVENUE-PIVOT-REPORT.md` (Stripe stripped 2026-06-04) | ✅ TRUE |
| 7 | **Telegram as transaction bridge to auto-trigger Manus** | `backend/hub.py` already has Telegram broadcast endpoints (`POST /api/broadcast/telegram`), but **no auto-trigger of Manus** is implemented in the live code — `hub.py` returns `{ok, configured, status}` from Telegram, no callback into Manus. The "auto-trigger" is an aspirational claim | ⚠️ PARTIALLY TRUE (broadcast is real; auto-trigger is forward-looking) |
| 8 | **ClawX board at `clawx-aihub-zwxfcstm.manus.space` (public)** | Listed in `briefings/CLAUDE-MEMORY-2026-06-01T2309Z.md` and `HERMES-AGENT-MEMORY-2026-05-27*.md`; the live `backend/hub.py:122-127` does have a `manus` platform with `MANUS_API_KEY` BYOK path. Whether `clawx-aihub-zwxfcstm.manus.space` resolves and shows a board is runtime verification, not in this repo | 🟡 UNVERIFIED (claim is from a Manus-controlled host) |
| 9 | **The 4 SKUs / 5 Square product links** are live for youandinotai.com | `CLAUDE.md` §"Square" lists 5 product links live; live `backend/fastapi-app` does NOT have `backend/storefront.py` mounted (it lives in the separate `backend/` folder at the repo root, with the Cloud Run deploy); `storefront.py:64-119` STARTER_SKUS shows 9 products but uses a different catalogue (Bot Shield $9, Founding Member $29, 3-Month $79, 12-Month $299, Royalty $499, plus patch/prompt/dropin/consult). The dollar amounts and the count **do not match** the live 5-product $1/$14.99/$39.99/$99.99/$2,500 lineup in `CLAUDE.md` | 🟡 CATALOGUE DRIFT (the `backend/storefront.py` SKUs are a different/older set; the canonical youandinotai.com SKUs are the 5 in `CLAUDE.md`) |
| 10 | **Hub.py lists 13+ platforms** (Hermes, E1, Emergent, Claude, OpenAI, Gemini, Grok, Perplexity, OpenRouter, Genspark, Manus, OpenClaw, Ollama) | `backend/hub.py:38-142` PLATFORMS list confirms this. Guide says "every AI surface Joshua named routes through one contract" — true at the hub level | ✅ TRUE |

---

## 2 · Conflicts with live doctrine (with severity)

Severity scale: **🔴 CRITICAL** = mutates a FOUNDER DOCTRINE rule, **🟠 HIGH** = contradicts the live revenue code or a ratified agent fleet contract, **🟡 MEDIUM** = stale or imprecise, **🟢 LOW** = cosmetic / wording.

### Conflict #1 · "No Emergent dependency" — but the live hub is an Emergent bridge
- **Severity:** 🟠 HIGH
- **Guide §2 / §13:** "No Emergent. No middleman. No extra subscriptions." → "No `EMERGENT_LLM_KEY` needed."
- **Live code:** `backend/hub.py:147-166` defines `_emergent_chat()` and uses it for `e1`, `hermes`, `emergent`, `claude`, `openai`, `gemini` providers. `EMERGENT_LLM_KEY` is the **primary** engine for 5 of 13 platforms.
- **Live memory:** `CLAUDE-MEMORY-2026-06-03T1002Z.md` and `2026-06-05T1206Z.md` both still report E1 as the default and Emergent as a tier.
- **Live doctrine:** `CLAUDE.md` §"Conventions" / FOUNDER DOCTRINE rule 6 — "Hermes routes everything-but-Anthropic" does NOT exclude Emergent. Emergent is a router, not Anthropic.
- **Why it matters:** If the guide's "no Emergent" is treated as directive, every `_emergent_chat()` call in `hub.py` would have to be replaced with an OpenRouter BYOK call. That is a non-trivial backend surgery, AND it would change the **model** the user gets (Emergent gives `claude-opus-4-5` via their bridge; OpenRouter gives whatever is upstream, possibly a different version of the same family).
- **Recommendation:** The guide's "no Emergent" is **forward-looking architecture**, not live state. The repo still runs on Emergent. Flag this so the guide is not read as a directive to rip `EMERGENT_LLM_KEY` out tonight.

### Conflict #2 · "Use OpenRouter instead of ANTHROPIC_API_KEY" — but the wall is auth, not keys
- **Severity:** 🟡 MEDIUM (the wall is what matters; the guide's framing is loose)
- **Guide §2 / §13:** "Use OpenRouter instead of `ANTHROPIC_API_KEY`."
- **Live doctrine:** FOUNDER DOCTRINE rule 6 (`briefings/FOUNDER-DOCTRINE-2026-05-19.md` line 27) — "Hermes routes everything-but-Anthropic … Reject `model.startsWith('claude-')` at the router. This protects Joshua's Max subscription from compounding usage."
- **`CLAUDE.md` §"Hermes Anthropic hard wall (FOUNDER DOCTRINE rule 6)":** "the rationale is **auth, not keys** (Founding Four protected via authenticated claude.ai Max session, not via OpenRouter proxies)."
- **Why it matters:** OpenRouter routes to `anthropic/claude-opus-4.5` and other Anthropic models via upstream API key. The wall is not "no Anthropic key in the env" — it is "the Founder Four's Max-session auth must not be the lever for hermes-router scaling." Routing through OpenRouter to an Anthropic model would **violate the spirit** of rule 6 even if the env var name is different.
- **Recommendation:** Read the guide as "no **Anthropic key direct** in Hermes" (which is true) and "OpenRouter as a multi-model fan-out is permitted for non-Anthropic models" (also true). Do NOT let the guide license `claude-*` traffic through OpenRouter.

### Conflict #3 · "100-Cent Rule" — mixes LLC and DAO layers
- **Severity:** 🟠 HIGH (the most material conflict in the file)
- **Guide §3 (line 92-102):** KIDS 10% / TAX 27% / SOVEREIGNTY 63%, presented as a single **gross-revenue** rule on every dollar.
- **Live LLC doctrine (CLAUDE.md §"Revenue Model", 2026-04-17, restated 2026-06-01):** 10% per legally-distinct bucket is the **IRS LLC -deduction cap** (10c per $1 maximum corporate  deduction). 90% is the LLC operating share, NOT 63%. **The 27% / 63% split does not exist at the LLC layer.**
- **Live LLC code (`/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:97-100`):**
  ```python
  _amount_cents=_amount,        # 10%
  operating_amount_cents=amount - _amount, # 90%
  ```
  The operating side is 90%, not 63%. The 27% tax / 63% tiers split is **not in the live allocation code**.
- **Where 10/27/63 DOES exist:** `briefings/DAO-ARCHITECTURE-CANONICAL.md:799` (calibrated 2026-04-19) and `briefings/DAO-LAUNCH-ARCHITECTURE.md:9-15` (2026-06-04) — this is the **DAO token-sale gross split**: 10% kids bucket (stacked per activity), **min 27% tax reserve**, 63% priority tiers (Tier A survival, Tier B growth). It is a **DAO treasury-level** allocation rule, not the LLC operating model.
- **What the guide conflates:** It takes the DAO PlatformSplitter doctrine (10/27/63, where the 27% is a tax RESERVE lock and the 63% is sovereign-tier funding) and presents it as a single gross-revenue rule at the LLC level. That is **architecturally wrong** — the LLC has no "Tier A1/A2" funding chain. Tier A1/A2 is a **DAO concept** (the docs call it a "$600 machine + $2,500 human survival" model from the sovereignty pool).
- **ENIGMA  reference (Joshua's message, 2026-06-05):** Joshua wrote "ENIGMA is  per GLOBALNODE." This is the **historical -routing split** (`60% ops / 30% growth / 10% kids`) that was **formally killed 2026-04-17** per `REPOSITORY_RECORD.md` §"Current Financial Doctrine" and `briefings/PRELAUNCH-TAX-ADJUSTMENT-2026-03-31.md`. The pre-April-17  is `HISTORICAL ONLY`. Joshua's own CLAUDE.md says "Never invent splits. Never resurrect  or -routing."
- **Reconciliation (100-Cent Rule vs ENIGMA ):**
  | Layer | Split | Source of truth | Status |
  |---|---|---|---|
  | **LLC operating** (every merchant receipt) | 10% kids bucket (-deduction cap) + 90% operating | `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py`, `CLAUDE.md` 2026-06-01 | **LIVE** |
  | **DAO token sale** (gross sale proceeds) | 10% kids / min 27% tax reserve / 63% priority tiers (A1+A2 survival, then B) | `DAO-ARCHITECTURE-CANONICAL.md:799`, `DAO-LAUNCH-ARCHITECTURE.md:9-15` | **LIVE** at DAO layer, **not** at LLC layer |
  | **Historical -routing** (, 100% ) | 60% ops / 30% growth / 10% kids | `Gospelpayment.sol`, pre-April-17 docs | **DEAD** — never resurrect |
  | **Guide's 100-Cent Rule** (10/27/63) | Presented as one gross rule on every dollar | `HERMES-SETUP-GUIDE.md:95-102` | **CONFLATES** the LLC and DAO layers |
- **Recommendation:** the 100-Cent Rule, as written, is **not the live LLC operating truth**. It is the DAO gross split. The guide needs a layer label. (Do NOT edit — flag for Joshua.)

### Conflict #4 · "$50,000 cumulative founder cap" — but which layer?
- **Severity:** 🟠 HIGH (cryptic; needs founder clarification)
- **Guide §3 (line 113):** "$50,000 cumulative ecosystem-wide (after taxes). Hermes tracks every payout. If cap is approached, Hermes creates a blocking Kanban task."
- **Live doctrine:**
  - **LLC layer:** Joshua's draw is at his **quarterly discretion** per `REPOSITORY_RECORD.md` §"Current Financial Doctrine": "the reserve is Joshua Coleman's taxable income … and is held until he decides quarterly whether to payment, reinvest, stake, or hold. No agent, surface, or doc may pre-commit that reserve to a beneficiary." There is **no $50k LLC cap**.
  - **DAO layer:** `DAO-LAUNCH-ARCHITECTURE.md:14` says "Founder total ecosystem-wide compensation permanently capped at $50,000 (After Taxes). Tier A survival funds are mission-necessary; cap applies to profit/salary beyond basic survival. Any increase requires Token Vote + AI Steward / Safety Council Veto Window." This is a **DAO token-sale governance rule**, not a Joshua draw cap.
- **What the guide conflates:** It presents the $50k DAO cap as a "Hermes tracks every payout" hard wall. The DAO cap is **governance-voteable** (requires Token Vote + AI Steward Veto Window to raise). Presenting it as an automatic Hermes enforcement creates a **false hard wall** at the LLC layer.
- **Recommendation:** the cap is real, but at the DAO layer with a governance override path, not at the LLC layer. The guide's "Hermes creates a blocking Kanban task" is correct DAO governance, not a Joshua draw cap. (Do NOT edit — flag for Joshua.)

### Conflict #5 · "Manus = CEO orchestrator" — vs the Opus-authored `hermes/agents/AGENTS.md`
- **Severity:** 🟠 HIGH
- **Guide §1 (line 20-35):** "MANUS (CEO Orchestrator) … Task dispatch, Model routing, Provider failover, Telegram monitoring, Webhook processing, Scheduled compliance, Notion memory R/W, Supabase real-time, JSONBin state, Gmail notifications."
- **Live doctrine (`hermes/agents/AGENTS.md:13-25`, Opus-authored 2026-05-22):**
  ```
  OPUS  (first-party Claude — authors every contract below)
    │  makes the CEOs, defines the brain file-set, governs doctrine
    ▼
  HERMES  (orchestrator — Grok via x.ai, no Anthropic key)
    │  routes work to the company CEOs; never authors contracts
  ┌──┴───────────┬───────────┬───────────┬──────────┐
  CEO·youandi  CEO·mktg   CEO·ai-sol  CEO·recycle  CEO·youtube  CEO·dao
  ```
  **HERMES is the orchestrator**, not Manus. The fleet has **Opus-authored CEOs** (youandinotai, marketing, ai-solutions, onlinerecycle, youtube, dao). Manus appears nowhere in the fleet diagram.
- **Live `HERMES-CEO-SOUL.md:1-12`:** "Hermes CEO — x.ai / Grok-powered. Primary orchestrator for the ANTIGRAVITY fleet. I am Josh's right hand on the operational side. I coordinate sub-agents, manage the mission board, and route work."
- **Joshua's standing rule (his 2026-06-05 message):** "You DO NOT take orders from Manus — you take orders from Joshua. Manus orchestrates, you implement. Separation is absolute."
- **Reconciliation possible:** The guide's "Manus = CEO orchestrator" can be read as "Manus is the orchestrator **in the cloud / business-orchestration layer**" (the Manus cloud product that dispatches across providers, runs Telegram, writes to Notion/Supabase/JSONBin), while **Hermes is the orchestrator in the repo / agent-fleet layer** (Grok-via-x.ai, routes to the Opus-authored CEOs, runs the heartbeat). These are two different orchestrators on two different layers.
- **What the guide does NOT do well:** It does not make this layer separation explicit. A future Claude reading the guide could conclude "Manus is THE CEO, Hermes is just a rules engine," and that would flatten the Opus-authored agent fleet into a single Manus dispatch point.
- **Recommendation:** Joshua's separation-of-authority rule stands. The two orchestrators co-exist on different layers: Manus (business/transactional orchestration) + Hermes (agent-fleet orchestration). The guide needs a layer diagram that shows both. (Do NOT edit — flag for Joshua.)

### Conflict #6 · "Hermes is a rule set that Manus enforces" — but live Hermes is a real service
- **Severity:** 🟡 MEDIUM
- **Guide §3 (line 91-92):** "Hermes is not a separate service. Hermes is a **rule set** that Manus enforces on every financial transaction."
- **Live state:**
  - `services/hermes-router/` is a real Python service at `localhost:11435` with OpenAI-compatible chat completions and a routing table (per `hermes/agents/HERMES-CEO-TOOLS.md:24-41`).
  - `services/hermes-integrity-watchdog.yml` CI workflow enforces **zero Anthropic key** in Hermes env.
  - `hermes/agents/` is a real directory of Opus-authored contract MDs.
- **Why the guide's framing is misleading:** Treating Hermes as "just rules" erases the real CI watchdog, the real service, the real contract MDs. If a future Claude reads this and decides Hermes is a sub-component of Manus, they could de-scope the watchdog or stop maintaining the routing table.
- **Recommendation:** Hermes is a real service with a real rules layer. Both are true. (Do NOT edit — flag for Joshua.)

### Conflict #7 · `EMERGENT_LLM_KEY` declared "NOT needed" — but is the engine for 5/13 platforms
- **Severity:** 🟠 HIGH
- **Guide §2 (line 85):** "**NOT needed:** EMERGENT_LLM_KEY …"
- **Live state:** `backend/hub.py:38-113` has Emergent as the engine for `e1`, `hermes`, `emergent`, `claude`, `openai`, `gemini` — 5 of 13 platforms. The `EMERGENT_LLM_KEY` is the single env var that lights up the default LLM bridge for the hub. `backend/hub.py:151-153` raises RuntimeError if it's missing.
- **Live memory:** `briefings/CLAUDE-MEMORY-2026-06-05T1206Z.md` notes the system is running on E1 / Emergent; removing the key would break the live hub.
- **Recommendation:** the guide's "NOT needed" is **the desired end-state**, not the current state. Removing the key would require re-wiring `_emergent_chat()` to use direct OpenAI / Anthropic / Gemini SDKs, which is significant work. (Do NOT edit — flag for Joshua.)

### Conflict #8 · Hub platform list — guide says "OpenRouter + Gemini + Ollama" but live is 13
- **Severity:** 🟡 MEDIUM
- **Guide §2 (line 53-60):** "All routing goes through keys Joshua already owns: OpenRouter, Gemini, Ollama."
- **Live state:** `backend/hub.py:38-142` lists 13 platforms (Hermes, E1, Emergent, Claude, OpenAI, Gemini, Grok, Perplexity, OpenRouter, Genspark, Manus, OpenClaw, Ollama). The guide collapses 13 → 3.
- **Why it matters:** if a future Claude reads the guide and only configures OpenRouter + Gemini + Ollama keys, they will lose Grok (X platform, BYOK), Perplexity (research, BYOK), Genspark (spreadsheet, BYOK), Manus (computer-use, BYOK), OpenClaw/Ollama (local). All currently wired and reported in `CLAUDE-MEMORY-*.md` connector snapshots.
- **Recommendation:** the guide is forward-looking; the live hub is the truth. (Do NOT edit — flag for Joshua.)

### Conflict #9 · Hermes virtual-models table — guide vs `hermes_models.py`
- **Severity:** 🟡 MEDIUM
- **Guide §5 (line 184-192):** Virtual-model aliases and their real backends (hermes, hermes-deep, cfo, code, marketing, kimi, fast).
- **Live `backend/hermes_models.py:15-23`:** matches the alias names but the `bridge_provider` / `bridge_model` are different from the guide's claim of "OpenRouter" — they go through `anthropic` / `openai` / `gemini` via the Emergent bridge (`bridge_provider: "anthropic", bridge_model: "claude-opus-4-5-20251101"` for `hermes`).
- **Live `HERMES-CEO-TOOLS.md:29-41`:** routing table is `grok` (x.ai, no key) → `hermes` (openrouter/nous-hermes-4-405b) → `cfo` (ollama-local) → `marketing` (ollama-local) → `code` (openrouter/qwen-qwen3-coder) → `default` (openrouter/minimax-minimax-m2) → `gemini` (openrouter/google/gemeni-2.5-pro) → `claude` (openrouter/anthropic/claude-sonnet-4.5, Opus CEO only).
- **Two routing tables in the live repo, neither matches the guide.** The guide's "OpenRouter" framing is mostly consistent with `HERMES-CEO-TOOLS.md`, but `backend/hermes_models.py` is the **empirically-used** table (it's what the live hub imports). Joshua's standing review item: "verify against current hermes_models.py in ANTIGRAVITYclip" — the ANTIGRAVITYclip repo is archive-pending per FOUNDER DOCTRINE rule 1; the canonical table is the one in `Trollz1004/ANTIGRAVITY/backend/hermes_models.py`. **They don't match the guide.**
- **Recommendation:** the guide is a third routing table that disagrees with both. Three tables = bug surface. Joshua's review item is the right one — verify the guide against the live `hermes_models.py` and reconcile. (Do NOT edit — flag for Joshua.)

### Conflict #10 · Model id `claude-opus-4-5` — stale
- **Severity:** 🟢 LOW (cosmetic, but it propagates)
- **Guide §2 (line 60):** "max … `claude-opus-4-5, gpt-5.1`"
- **Live env (this session):** resolved model id is `claude-opus-4-7` per environment block. `backend/hub.py:78` lists `claude-opus-4-5, claude-sonnet-4-6, claude-opus-4-6`. The guide's `claude-opus-4-5` matches `hub.py` but is one major version behind the runtime.
- **Recommendation:** update next time someone touches this doc. (Do NOT edit — flag for Joshua.)

### Conflict #11 · Network topology IPs — verify
- **Severity:** 🟡 MEDIUM
- **Guide §6 (line 196-202):** "Sabretooth (192.168.0.8:3300) … T5500 (192.168.0.15:3200) … 9020 (192.168.0.5:11434)."
- **Live doctrine (CLAUDE.md §"Node Topology"):** Sabretooth 192.168.0.8, T5500 192.168.0.15, 9020 192.168.0.5. **IPs match.** Ports differ — guide assigns 3300/3200/11434 to "Desktop Commander MCP" instances; the repo's live `services/` and `apps/` have their own port allocations (`hermes-router` 11435, `mission-control-api` TBD, `openclaw` 3200 per `CLAUDE.md` "Docker Services"). Joshua's review item is correct: the **ports** need to be confirmed against `services/` and `apps/` runtime config.
- **Recommendation:** IPs are correct; ports are aspirational. (Do NOT edit — flag for Joshua.)

### Conflict #12 · JSONBin as canonical state — but Rule 11 says no third-party secrets surface
- **Severity:** 🟡 MEDIUM (the bin doesn't hold secrets; it holds doctrine state, but still a single-master-key SPOF)
- **Guide §10 (line 297-307):** "JSONBin (Project State) — Bin ID: 6a230263f5f4af5e29beef15 — Contents: Doctrine config, agent registry, DAO structure, network topology, funding strategy — Access: Private, X-Master-Key auth."
- **Live doctrine:** FOUNDER DOCTRINE rule 11 forbids secrets in chat/git/PR/scripts/briefings. JSONBin with a single master key is **not a secret store** (the contents are doctrine, not keys), but it IS a single point of failure for live doctrine truth. If the bin is lost or the master key rotates, the repo would have to be re-synchronized from a third-party store.
- **The repo is canonical.** `briefings/`, `AGENTS.md`, `CLAUDE.md`, `hermes/agents/` already hold the doctrine. Putting doctrine in JSONBin creates a second store that can drift from the repo.
- **Recommendation:** the guide should mark JSONBin as **cache**, not **source of truth**. The repo is the source of truth. (Do NOT edit — flag for Joshua.)

### Conflict #13 · File placement paths — guide vs `apps/` / `services/` reality
- **Severity:** 🟢 LOW (Joshua flagged this himself)
- **Guide §12 (line 338-359):** Lists `apps/mission-control/`, `apps/clawx/`, `services/mission-control-api/`, `services/mission-mcp/`, `hermes/HERMES-SETUP-GUIDE.md` (the file itself).
- **Live repo (per `CLAUDE.md` §"Actual Folder Structure"):** `apps/mission-control/` ✅, `apps/clawx/` ❌ (not in `apps/`, but the guide was the one creating it), `services/mission-control-api/` ✅, `services/mission-mcp/` ✅, `hermes/HERMES-SETUP-GUIDE.md` ✅ (this file).
- **`apps/clawx/` is not in the live `apps/` list.** Live apps are `antigravity-cockpit`, `command-center`, `dashboard`, `mission-control`, `opuspawclaw`, `paperweight`, `youandinotai-frontend`. ClawX is a Manus-hosted surface, not a repo app.
- **Recommendation:** Joshua's review item is correct — file placement paths need reconciliation. (Do NOT edit — flag for Joshua.)

### Conflict #14 · Action items reference 4 SKUs — live is 5 with different prices
- **Severity:** 🟢 LOW
- **Guide §14 (line 392-400):** "Seed 4 SKUs with real Square checkout URLs"
- **Live `CLAUDE.md` §"Square":** 5 product links live (Bot-Shield $1, Founding Member $14.99/mo, 3-Month Founder $39.99, 12-Month Founder $99.99, Royalty Card $2,500).
- **`backend/storefront.py:64-119` STARTER_SKUS:** 9 products at different price points (Bot Shield $9, Founding $29, 3-Month $79, 12-Month $299, Royalty $499, patch $9, prompt pack $29, dropin $99, consult $49).
- **Three different SKU sets in three different places.** The repo's live 5-product Square list (CLAUDE.md) is the canonical customer-facing one. The `storefront.py` STARTER_SKUS is a **different/legacy** catalogue that should not be treated as live.
- **Recommendation:** the guide's "4 SKUs" is wrong; live is 5; `storefront.py` is a 9-product older catalogue. Pick one source of truth and align. (Do NOT edit — flag for Joshua.)

### Conflict #15 · DAO founder-cap mechanics — guide says "Hermes blocks", but live is a Token Vote + AI Steward Veto
- **Severity:** 🟠 HIGH
- **Guide §3 (line 112-113):** "If cap is approached, Hermes creates a blocking Kanban task."
- **Live `DAO-LAUNCH-ARCHITECTURE.md:14`:** "Any increase requires Token Vote + AI Steward / Safety Council Veto Window."
- **The governance override path is real, not a Hermes task.** A Kanban task is a **flag**, not a **vote**. The guide flattens "Token Vote + AI Steward Veto" into "Hermes creates a task," which is governance theatre.
- **Recommendation:** the cap is a **DAO governance rule** with a vote-and-veto path. The guide should say so, not imply automatic Hermes enforcement. (Do NOT edit — flag for Joshua.)

### Conflict #16 · The "world's first" marketing pitch — and the canonical-7 ban
- **Severity:** 🟠 HIGH
- **Guide §8 (line 269-271):** "World's first: Competing AI systems from different corporations voting together in a governance structure for children's welfare. Documented in repo. That's not marketing — that's history."
- **Live doctrine:** FOUNDER DOCTRINE rule 8 ("No fabricated numbers"), rule 9 ("No partnership claims" with Anthropic / Google / OpenAI / xAI / Perplexity), and the canonical-7 customer-facing language ban (FOUNDER DOCTRINE / CLAUDE.md "Hard Constraints"). Also `CLAUDE.md` §"Identity": **"Founder-recognized collaboration on work product only"** — the "AI Steward Council" with 6 named AI systems is a **partnership-claim-shaped** statement.
- **Live checker:** `briefings/CLAUDE-MEMORY-2026-06-05T1206Z.md` reports the canonical-7 customer-facing grep is at **9 files** (still failing) — the surgical substitution is queued but not landed.
- **Why it matters:** if "world's first" lands on a customer surface (DAO launch page, video, social post), it risks: (a) rule 9 violation (partnership claim), (b) §496.405 risk if the framing implies  governance that requires FL registration, (c) competitor reaction if Anthropic/OpenAI/Google/xAI are named in marketing copy as "voting partners" when they are not.
- **Recommendation:** the "world's first" pitch is **internal-only** in `briefings/`, `hermes/agents/`, AGENTS.md, SOUL.md, HEARTBEAT.md, SKILLS.md, TOOLS.md. It must NOT appear on DAO landing pages, social posts, video descriptions, or sales copy. (Do NOT edit — flag for Joshua.)

### Conflict #17 · "AntigravityClip" repo reference
- **Severity:** 🟠 HIGH
- **Guide §12 (line 355):** "services/mission-control-api/ (Backend (from ANTIGRAVITYclip))"
- **Live doctrine:** FOUNDER DOCTRINE rule 1 — `ANTIGRAVITYclip` (or any case variant) is **archive-pending**, never authoritative. Live repo is `Trollz1004/ANTIGRAVITY` only. Referencing the archived repo as a source of code is a **1-repo rule violation by reference**.
- **Recommendation:** the "from ANTIGRAVITYclip" annotation must be removed or corrected to "from ANTIGRAVITY" / "from `Trollz1004/ANTIGRAVITY`." (Do NOT edit — flag for Joshua.)

### Conflict #18 · "The Repository record is stale" — true but unflagged in the guide
- **Severity:** 🟡 MEDIUM
- **Guide does not mention** that `briefings/REPOSITORY_RECORD.md` has a stale "T5500 is now the primary node" line (2026-05-13) that contradicts FOUNDER DOCTRINE rule 3 (Sabretooth-only push) and `CLAUDE.md` "Auxiliary node restriction." This is a known unresolved Q2 (carried in every CLAUDE-MEMORY since 2026-06-01) where Joshua has not yet greenlit the edit.
- **Recommendation:** the guide should NOT make doctrinal claims that depend on resolving Q2 without flagging that Q2 is open. (Do NOT edit — flag for Joshua.)

---

## 3 · 100-Cent Rule vs ENIGMA  — the reconciliation (per Joshua's review item #2)

Joshua's review item: "**DAO split percentages — ENIGMA is  per GLOBALNODE, guide says 10/27/63 (different layer — 100-Cent Rule is GROSS , ENIGMA is NET after sovereignty pool)**"

**Joshua's framing is correct on the layer separation.** The 100-Cent Rule is a **gross-revenue** split (every dollar that lands, before LLC cost); ENIGMA  is the **historical -routing doctrine** (60% ops / 30% growth / 10% kids) that was **killed 2026-04-17** and is in the **historical archive** only.

But there is a **third** layer the guide does not name: the **DAO PlatformSplitter**, which is the **DAO token-sale gross split** documented in `DAO-ARCHITECTURE-CANONICAL.md:799` and `DAO-LAUNCH-ARCHITECTURE.md:9-15`. This third layer is **where the 10/27/63 actually lives**.

| Layer | Split | Status | Source of truth |
|---|---|---|---|
| **LLC operating** (every merchant receipt) | 10% kids bucket (IRS -deduction cap) + 90% operating | **LIVE — in `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py`** | `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py:97-100`, `CLAUDE.md` 2026-06-01 |
| **DAO PlatformSplitter** (token sale gross proceeds) | 10% kids (stacked per activity) / min 27% tax reserve / 63% priority tiers (A1 survival + A2 human + Breakeven) | **LIVE at DAO layer only** | `DAO-ARCHITECTURE-CANONICAL.md:799`, `DAO-LAUNCH-ARCHITECTURE.md:9-15` |
| **ENIGMA ** (historical -routing) | 60% ops / 30% growth / 10% kids | **DEAD — never resurrect** | `Gospelpayment.sol`, pre-April-17 docs, `REPOSITORY_RECORD.md` §"Current Financial Doctrine" |
| **100-Cent Rule (guide's framing)** | 10/27/63, presented as a single gross rule on every dollar at the LLC layer | **CONFLATES the LLC and DAO layers** | `HERMES-SETUP-GUIDE.md:95-102` |

**The 100-Cent Rule is structurally accurate at the DAO layer but mis-labeled at the LLC layer.** The 27% tax reserve and 63% priority tiers (A1/A2/B) are **DAO PlatformSplitter mechanics**, not LLC operating mechanics. The LLC has no "Tier A1 machine ($600) / Tier A2 human ($2,500) / Breakeven ($3,100)" funding chain — that is a **DAO treasury allocation rule** for the sovereignty pool.

If the guide's "100-Cent Rule" is read as a **single LLC operating rule**, it would over-reserve 27% for tax on every merchant receipt (the actual LLC code reserves only the 10% bucket and treats the rest as operating share). If read as the DAO PlatformSplitter, it is correct.

**Recommendation:** Joshua, your review item is right that they are different layers. The guide needs the label "DAO PlatformSplitter (gross sale proceeds)" on the 100-Cent Rule, not "for every gross dollar that enters the ecosystem" — because "every gross dollar that enters the ecosystem" is LLC-language, and the 10/27/63 doesn't apply at the LLC layer.

**The  (ENIGMA/GLOBALNODE) is dead, period.** It is not a different layer that the 10/27/63 reconciles with. It is a killed doctrine that the 10/27/63 replaced at the DAO layer. The guide's 100-Cent Rule is the **successor** to the  at the DAO PlatformSplitter layer, not a parallel rule.

---

## 4 · What the guide gets RIGHT (and how to keep it)

1. **1-repo policy** — same as FOUNDER DOCTRINE rule 1.
2. **Square-only on youandinotai.com** — same as CLAUDE.md §"Payments" and the live `revenue_allocation.py`.
3. **No Anthropic key direct in Hermes** — same as FOUNDER DOCTRINE rule 6 / `hermes-integrity-watchdog.yml`.
4. **Telegram bridge already wired** — `config.py:57-58` + `secrets_rotation_config.json:55-58` + `hub.py:349-374` broadcast endpoints.
5. **ClawX as the public board** — consistent with `briefings/CLAUDE-MEMORY-2026-06-01T2309Z.md` and `HERMES-AGENT-MEMORY-2026-05-27*.md`.
6. **Hub.py lists 13+ platforms** — consistent with `backend/hub.py:38-142`.
7. **The 100-Cent Rule is structurally correct at the DAO layer** — it just needs a layer label.
8. **The $50k founder cap is real** — at the DAO layer, with a Token Vote + AI Steward Veto Window to raise.
9. **JSONBin bin id** — matches the running Hermes-CEO-Ready doc lineage.
10. **Hermes virtual-model aliases** — match `hermes_models.py` aliases (though the bridge providers differ — see Conflict #9).

---

## 5 · Recommendations to Joshua (per your action item #1 + #2)

### For the guide itself (no edits, only direction)

1. **Conflict #3 (10/27/63 layer label) is the highest-priority clarification.** The 100-Cent Rule is correct **at the DAO PlatformSplitter layer**, not at the LLC layer. The guide should rename it to "DAO PlatformSplitter (gross token-sale proceeds)" and add a separate "LLC operating layer: 10% per-bucket, 90% operating" section. The two are not in conflict if labeled correctly; the guide conflates them by omission.
2. **Conflict #5 (Manus vs Hermes as orchestrator) needs the layer diagram.** Manus is the cloud/business orchestrator (Notion, Supabase, Telegram broadcast, JSONBin state). Hermes is the agent-fleet orchestrator (Grok via x.ai, routes to Opus-authored CEOs, runs the heartbeat). The guide's "Manus = CEO" is a true statement about the Manus cloud product layer; the live `hermes/agents/AGENTS.md` is a true statement about the repo/fleet layer. Both are true. The guide needs a diagram that shows both, with arrows.
3. **Conflict #6 (Hermes is "not a separate service")** should be reversed: Hermes IS a real service (`services/hermes-router/`, `:11435`, OpenAI-compatible, with the integrity watchdog CI). The "rule set" framing erases the real CI enforcement.
4. **Conflict #1, #7, #8 (no Emergent, no Emergent key, hub is 3 platforms)** are all **forward-looking architecture**, not current state. The guide needs a "Current state" vs "Target state" header so a future Claude does not rip `EMERGENT_LLM_KEY` out tonight.
5. **Conflict #9 (3 routing tables)** — verify the guide against `backend/hermes_models.py` (which is what the live hub imports) and reconcile. The guide is the third table.
6. **Conflict #15 (DAO founder cap governance)** — the guide's "Hermes creates a blocking Kanban task" is **governance theatre** unless paired with "requires Token Vote + AI Steward Veto Window to raise." The cap is a vote-and-veto rule, not an automatic Hermes hard wall.
7. **Conflict #16 ("world's first" pitch)** — internal-only. Must NOT appear on DAO launch pages, social posts, video descriptions, or sales copy. The pitch currently in the guide is in `hermes/HERMES-SETUP-GUIDE.md` which is in `hermes/` (agent-internal directory), so it passes the canonical-7 surface check — but the moment it propagates to a landing page, it becomes a §496.405 + rule 9 risk.
8. **Conflict #17 (ANTIGRAVITYclip reference)** — replace with "from `Trollz1004/ANTIGRAVITY`." 1-repo rule, no exceptions.
9. **Conflict #12 (JSONBin as canonical state)** — repo is canonical. JSONBin is cache.

### For the live repo (no edits, only flags)

- **`backend/storefront.py:64-119` STARTER_SKUS is a legacy catalogue** (9 products at $9/$29/$79/$299/$499 + patch/prompt/dropin/consult). The live 5-product Square list is in `CLAUDE.md`. Pick one source of truth. (The live FastAPI app's `revenue_allocation.py` is canonical for receipt allocation; the catalogue is a separate file.)
- **`backend/hermes_models.py:15-23` is the live alias table** (5 of 7 aliases use `bridge_provider: "anthropic"` / `openai` / `gemini` via the Emergent bridge, not OpenRouter). The guide's "OpenRouter" claim is incorrect for the live code.
- **Notion page id mismatch**: guide says `376a4be9d37e81b69764f0d228aad977`; live `CLAUDE-MEMORY` runs reference `372a4be9-d37e-81d1-95c0-da68a3308d4c` for "Paperweight Daily Memory." Likely a typo in the guide (`376` vs `372`).
- **No 2026-06-04 `CLAUDE-MEMORY-*.md` file** — the daily scheduled task did not write a memory file for 2026-06-04. Q3 in `CLAUDE-MEMORY-2026-06-05T1206Z.md` is still open.

### For your standing open items (already tracked in CLAUDE-MEMORY)

- **Q1** — surgical-substitution PR for canonical-7 customer-facing files (now 9 files). Still no greenlight.
- **Q2** — `REPOSITORY_RECORD.md` push-authority contradiction (T5500 vs Sabretooth). Still no greenlight.
- **Q3** — 2026-06-04 memory gap. Still no answer.
- **Q4 (new, this audit)** — does the 100-Cent Rule apply at the LLC layer or only at the DAO PlatformSplitter layer? (This audit says: DAO only. LLC stays at 10% / 90%.) Joshua's review item is the right shape — confirm layer.
- **Q5 (new, this audit)** — is "Manus = CEO" the cloud-orchestration-layer claim, with Hermes as the agent-fleet-orchestration-layer claim? (This audit says: yes, two layers, both real. The guide needs the layer diagram.) Confirm or reject.

---

## 6 · Action requested (per Joshua's charter)

This audit **does not**:
- ❌ Edit `hermes/HERMES-SETUP-GUIDE.md`
- ❌ Edit `CLAUDE.md`, `briefings/FOUNDER-DOCTRINE-2026-05-19.md`, `briefings/THE-WHEEL.md`, `briefings/COWORKER-DISPATCH.md`, `briefings/DAO-ARCHITECTURE-CANONICAL.md`, `briefings/DAO-LAUNCH-ARCHITECTURE.md`, `briefings/REPOSITORY_RECORD.md`, `hermes/agents/AGENTS.md`, `hermes/agents/HERMES-CEO-SOUL.md`, `hermes/agents/HERMES-CEO-HARTBEAT.md`, `hermes/agents/HERMES-CEO-TOOLS.md`
- ❌ Edit any `backend/` Python file
- ❌ Open a PR
- ❌ Push to `Trollz1004/ANTIGRAVITY`
- ❌ Trigger any CI workflow

This audit **does**:
- ✅ Read all referenced doctrine + code files
- ✅ Flag every conflict with severity
- ✅ Reconcile the 100-Cent Rule (DAO) vs ENIGMA  (dead) vs LLC 10%/90% (live) layer split
- ✅ Surface the open questions for Joshua
- ✅ Hold the line

**Joshua, your call:**
- (a) **Ratify the guide as-is**, with a clarification that the 100-Cent Rule applies at the DAO PlatformSplitter layer (not the LLC layer), and that Manus/Hermes are two different orchestrators on two different layers. I can then update `briefings/DAO-LAUNCH-ARCHITECTURE.md` to add the cross-reference and update `CLAUDE.md` to point at the new guide.
- (b) **Fork the guide** — keep both. The new guide is a Manus-cloud-orchestration view; the live doctrine is the repo/agent-fleet view. Add a `briefings/HERMES-MANUS-ORCHESTRATION-LAYERS-2026-06-05.md` that lays out the two layers side by side and resolves the conflicts by layer.
- (c) **Reject the guide** — move it to `briefings/_archive/` with a one-line "superseded by FOUNDER-DOCTRINE-2026-05-19" note, and the live doctrine stands.
- (d) **Patch the guide in a follow-up PR** — open a `claude/hermes-setup-guide-layer-reconciliation` branch, fix the layer labels, the 10/27/63 layer, the routing table, the catalogue, the Notion id, the "ANTIGRAVITYclip" reference, the "world's first" surface restriction, and PR for Joshua's review. **This is the only path that requires me to touch the guide, and it requires explicit founder order.**

I am NOT opening the PR. Holding the line. Awaiting your call.

---

**#UntilNoKidInNeed · #ForTheKids · #NothingStopsTheWheelLikeThePlan**
