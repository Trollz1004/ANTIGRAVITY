# CLAUDE BROWSER EXTENSION — AGENT DEPLOYMENT PROMPTS
# Use with: Chrome → claude.ai → Extension → paste ONE prompt at a time
# For each role: create OpenClaw agent, seed it with the contract MD,
# wire to WhatsApp, verify with the kanban.

> **Setup order matters.** Deploy in this sequence so the earlier
> agents (CTO, CFO) are operational before the later ones (CSO, Compliance)
> that depend on their rails. Jules/Gemini is a quality gate, not an
> agent — install last and wire as a pre-commit hook, not a WhatsApp agent.

---

## PROMPT 1 — CEO (already in production; do NOT redeploy)

Skip. `hermes/agents/AGENTS.md` CEO entry-point is live. If the browser
extension shows "create CEO agent" → decline. The CEO is Hermes itself.

---

## PROMPT 2 — CTO

You are setting up a new OpenClaw agent named `CTO` on the WhatsApp
gateway that Hermes already runs. The agent contract file is already
authored in the repo at:

  `hermes/agents/CTO/`

Read every `.md` file in that folder before doing anything. They are
the contract — they define the agent's authority, scope, and what it
must NEVER do (the doctrine clauses).

STEPS:

1. **Create the agent** in Paperclip (the kanban UI) under the
   `antigravity` board, name `CTO`, category `software-development`,
   skill set `hermes-agent` (the only correct skill name — do NOT use
   `ci-repair` or any other custom name; that path is broken).

2. **Seed OpenClaw** non-destructively: extend the agent's
   `AGENTS.md`, `SOUL.md`, `HEARTBEAT.md` with **additive blocks** pulled
   from the contract files. Do NOT replace the whole file, do NOT
   remove unrelated lines, do NOT rewrite the persona. If a block
   already exists, refine only the smallest relevant section.

3. **Wire WhatsApp** to the same number the CEO (Hermes) is on. The CTO
   is reachable from the same chat. Verify by sending a test message:
   `@cto status` should return a 1-line ack with the active model
   (`gemma4:31b` on the 1050ti64gbRAMi7 host is the current default).

4. **Assign it the task** `t_23c5434f` from the antigravity board. The
   task body is the briefing at
   `briefings/HERMES-PROMPT-2026-06-05-ci-repair-and-harden.md`. The
   briefing defines 3 items: pytest conftest scope (already committed
   as `514bb447` on branch `claude/ci-repair-and-harden-2026-06-05`,
   needs a regression test), prettier drift on 4 files in
   `apps/dashboard/src/`, and the OWASP `dependency-check-action` SHA
   pin. The CTO is expected to report back in 6 lines per the briefing.

5. **Doctrine constraints (non-negotiable):**
   - 1 repo: `Trollz1004/ANTIGRAVITY`. Branch off `main`, PR back.
   - Sabretooth (`C:\antigravity`) is the only push-authority node.
   - Canonical-7 banned on customer surfaces: `payment · payment ·
     outreach ·  ·  ·  · payout`.
   - No `--no-verify`, no `--no-gpg-sign`, no skipped hooks.
   - No mock data. Real values or fail honestly.
   - Per-bucket 10% ; never resurrect  or
     "100% to " — the 10% is a deduction cap, not a routing.
   - **Above industry standard bar (Joshua's standing order):** every
     fix ships with a regression test AND a harden layer (a CI lint,
     a weekly drift scan, a dependabot config — something that makes
     the same break impossible to recur).

6. **Routing:** Hermes has zero Anthropic key (FOUNDER DOCTRINE rule
   6). Default model: whatever the board's current default is. Escalate
   to Grok (x.ai, user-auth) or Gemini (jules-cli direct) if the task
   needs more reasoning. **The CTO does NOT auto-merge to main.** It
   commits, pushes the branch, waits for the green check. First-party
   Claude (Opus on the Max session) is the only entity that can merge.

7. **Report back** to me (Opus, on this chat) in 6 lines, per the
   briefing's section 4.

**Do not** dispatch before the agent is fully seeded and WhatsApp is
verified. The previous two `t_23c5434f` and `t_34854ee4` dispatches
crashed because the skill name was wrong and the agent wasn't seeded.

---

## PROMPT 3 — CFO

You are setting up a new OpenClaw agent named `CFO` on the WhatsApp
gateway. The contract is at `hermes/agents/CFO/`. Read every `.md`
file there first — they are the law of the agent.

STEPS:

1. Create agent `CFO` in Paperclip, board `antigravity`, category
   `finance`, skill `hermes-agent`.

2. Seed OpenClaw non-destructively from the contract files (same
   rules as CTO: additive blocks, never rewrite, never delete).

3. Wire WhatsApp. Verify with `@cfo status`.

4. **Initial task** — audit the Square webhook + reserve allocation
   pipeline. Verify the 5-SKU store is intact (Bot-Shield $1 through
   Royalty Card $2,500), confirm the 10% per-bucket reserve is the
   hard cap (not a routing), and produce a one-page ledger readout
   that I (Opus) can paste into a board update. The CFO is the
   ledger-truth source; treat it as a read-only auditor on Square +
   Stripe data, never a writer to either.

5. **Doctrine (non-negotiable):**
   - Canonical-7 language ban on customer surfaces. The CFO writes
     briefing-only and agent-internal text. It does NOT author
     customer-facing copy.
   - 1 wallet, 1 LLC (Trash Or Treasure Online Recycler LLC, FL
     #L25000158401). The 10% is a deduction cap, never a routing,
     never a "payment" Joshua makes — that framing is illegal
     (LLC-100%-to- is fraud, see the §496.405 clause).
   - No historical-chain artifacts resurrected: `Gospelpayment.sol`,
     `Router100.sol`, `DatingRevenueRouter.sol`, ``,
     "100% to " — all permanently deprecated.
   - No mock data, no `TODO: real impl` placeholders, no simulated
     revenue numbers. Real totals from Square or
     `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` or fail
     honestly.

6. **Routing:** same as CTO — Hermes has zero Anthropic key.
   Escalation to Grok or Gemini only.

7. **Report back** with the audit readout. One page max. Cite Square
   transaction IDs and `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` line numbers.

---

## PROMPT 4 — CMO

You are setting up a new OpenClaw agent named `CMO` on the WhatsApp
gateway. The contract is at `hermes/agents/CMO/`. Read every `.md`
file there first.

STEPS:

1. Create agent `CMO` in Paperclip, board `antigravity`, category
   `marketing`, skill `hermes-agent`.

2. Seed OpenClaw non-destructively from the contract files.

3. Wire WhatsApp. Verify with `@cmo status`.

4. **Initial task** — verify the **per-surface ToS routing** is
   intact:
   - X (x.com) → Grok via x.ai, user-auth (no API key). Grok is the
     protected co-founder for X.
   - Facebook / Instagram / Threads → Manus.
   - YouTube / research / other platforms → Perplexity.
   - Strategy / assist (NEVER in-platform adapter) → Opus via
     browser only.
   - YouAndINotAI.com → Square only. Stripe AUP prohibits dating
     platforms on Stripe.
   - Non-dating surfaces (onlinerecycle.org, ai-solutions.store) →
     Stripe is fine.

5. **Doctrine (non-negotiable):**
   - Canonical-7 language ban on customer surfaces. The CMO
     authors ads, social posts, video descriptions, marketplace
     listings — every one of those is a customer surface. **No**
     `payment`, `payment`, `outreach`, ``,
     ``, ``, `payout` in any of them.
   - The CMO writes to `briefings/` and `hermes/agents/` for
     internal marketing doctrine; that path is allowlisted.
   - Marketing copy must reflect real surfaces and real revenue
     rails. No invented products, no fake "going to launch"
     claims, no aspirational language that overstates the
     platform's current state.

6. **Routing:** the CMO's primary model is **Grok** via x.ai
   (user-auth, no API key). The x.ai subscription is the auth
   path, not a key. Until x.ai's user-auth stabilizes, route X
   work via Grok's existing API (which the doctrine already
   protects as a Founding Four integration).

7. **Report back** with the per-surface ToS verification readout
   and the marketing channel ownership map. Include the
   Guardian Angels: the four protected co-founders
   (Gemini, Claude, Perplexity, Grok) and Codex (Fifth Chair).

---

## PROMPT 5 — CSO (Chief Security Officer)

You are setting up a new OpenClaw agent named `CSO` on the WhatsApp
gateway. The contract is at `hermes/agents/CSO/`. Read every `.md`
file there first.

STEPS:

1. Create agent `CSO` in Paperclip, board `antigravity`, category
   `security`, skill `hermes-agent`.

2. Seed OpenClaw non-destructively from the contract files.

3. Wire WhatsApp. Verify with `@cso status`.

4. **Initial task** — run the Opus Guardian and report the 8
   invariants status:
   - Zero Secrets in Source
   - Auth on Every Endpoint
   - Legacy Routing Drift Blocker
   -  is CODE not CONFIG
   - PII Isolation
   - No Raw SQL
   - Input Validation
   - CORS Locked

   Current score: 96%. CSO's job is to push toward 100% AND
   surface the 4% gap. Run:
   `python scripts/clawx-control/opus-guardian.py`
   on Sabretooth (`C:\antigravity`). Report the failures as
   actionable issues with file paths and line numbers.

5. **Doctrine (non-negotiable):**
   - Secrets in vault only: `C:\Users\joshl\OneDrive\Personal
     Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`. Never
     in chat, never in git, never in PR bodies, never in any
     agent-internal file the CSO writes. The CSO **fails closed**
     on any secret in the wrong place.
   - 1-wallet, 1-LLC: no new payment processors, no
     unauthorized Square/Stripe keys, no new auth realms.
   - Hermes Anthropic hard wall (FOUNDER DOCTRINE rule 6): zero
     `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` in any
     `services/hermes-router/.env*`. The CSO's job includes
     grepping for this on every push.
   - No `--no-verify`, no `--no-gpg-sign` (FOUNDER DOCTRINE
     rule 12). Banned absent explicit founder instruction.
   - Hooks never bypassed. The CSO enforces this on the agent
     fleet (CTO, CFO, CMO, etc.) — if a sub-agent skipped a
     hook, that's a CSO incident.

6. **Routing:** the CSO uses **Codex** (OpenAI) for security
   review passes. Codex has factory MCP access and is the
   Fifth Chair. The CSO can route to Codex directly. The
   CSO does NOT route through Anthropic (Hermes hard wall).

7. **Report back** with the Opus Guardian 8-invariant readout
   and a punch list for the 4% gap. File paths, line numbers,
   remediations.

---

## PROMPT 6 — COMPLIANCE OFFICER  (NEW ROLE — needs contract MD)

> **Stop and check with Opus first.** The contract file
> `hermes/agents/ComplianceOfficer/ComplianceOfficer.md` does NOT
> exist yet. Joshua asked for this role on 2026-06-05, but the
> Opus-authored contract is required before any agent can be
> seeded — doctrine rule that contract files are Opus-only.

**Action:** Do not create the agent yet. Open a Paperclip issue
on the `antigravity` board titled:

  `[contract] Author ComplianceOfficer.md — Opus-only, doctrine-bound, FL §496.405 + Opus-Guardian scope`

Assign it to the CEO (Hermes) with priority `2` (urgent) and
these notes in the body:

> Compliance Officer role requested by Joshua 2026-06-05. Scope
> is FL §496.405 compliance + Opus-Guardian enforcement + Square
> webhook signature audit. Need an Opus-authored contract MD
> at `hermes/agents/ComplianceOfficer/ComplianceOfficer.md`
> in the same style as `hermes/agents/CFO/CFO.md` and
> `hermes/agents/CTO/CTO.md`. Once the contract lands, the
> Chrome extension can deploy the OpenClaw agent per the
> pattern in Prompt 2.

The Compliance Officer agent is **deferred** until the contract
is authored. Joshua's standing order is doctrine-first,
deployment-second.

---

## PROMPT 7 — UX DESIGNER  (already authored; deploy it)

You are setting up a new OpenClaw agent named `UX` on the
WhatsApp gateway. The contract is at `hermes/agents/UX/`. Read
every `.md` file there first.

STEPS:

1. Create agent `UX` in Paperclip, board `antigravity`, category
   `design`, skill `hermes-agent`.

2. Seed OpenClaw non-destructively from the contract files.

3. Wire WhatsApp. Verify with `@ux status`.

4. **Initial task** — audit the youandinotai.com landing page
   for §496.405 compliance on customer-facing copy. The
   customer-facing language ban means: no `payment`, `payment`,
   `outreach`, ``, ``, ``,
   `payout` on web pages, email copy, ads, in-product
   copy, public API responses, YouTube descriptions, on-screen
   text, social posts, marketplace listings, podcast
   descriptions, or paid ad copy. The UX agent reads the
   current page, finds any banned token, and emits a 1-page
   compliance report with safe-substitution suggestions.

5. **Doctrine (non-negotiable):**
   - Customer-facing language ban is absolute. The UX is the
     last line of defense on this — anything the agent team
     authors must be reviewed by UX before it lands on a
     customer surface.
   - Internal synonym `contractual revenue payout` is
     allowed only in `briefings/`, `hermes/agents/`,
     `AGENTS.md`, `SOUL.md`, `HEARTBEAT.md`, `SKILLS.md`,
     `TOOLS.md`. NEVER on customer surfaces, not even
     self-referentially.
   - The UX does not route through Anthropic (Hermes hard
     wall). Default model is `gemma4:31b` or escalate to
     Perplexity for research and Gemini for design
     inspiration.

6. **Report back** with the compliance report. One page. Use
   the `apps/youandinotai-frontend/app/page.tsx` source as
   the source of truth (per PR #132 the scrub is in flight).

---

## PROMPT 8 — JULES / GEMINI 2.5  (NOT an agent — pre-commit gate only)

> **Jules is not an OpenClaw agent.** Per FOUNDER-DOCTRINE
> Founding Four protection: `jules-cli.py` connects DIRECTLY to
> Google's API — bypasses OpenClaw, MCP servers, and all local
> middleware BY DESIGN. Do not change this.

What you do instead:

1. Verify `jules-cli.py` exists in the repo and is wired to a
   paid Gemini 2.5 tier. The auth is via `GEMINI_API_KEY` in
   the master vault
   (`C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`).
   The key is paid-tier, used only for the pre-commit check.

2. Add a pre-commit hook (or wire it into the existing CI
   workflow `.github/workflows/ci-validate.yml`) that runs
   `jules-cli.py review` against every diff before push.
   Jules comments on:
   - Architectural drift
   - Doctrine violations
   - Unsafe patterns
   - Mock/simulation data
   - Banned §496.405 language

3. Jules is the **last reviewer before the repo** — it
   doesn't merge, doesn't block (warnings only), but its
   comments are visible on every PR. The Opus self-review
   and Codex review are upstream of Jules; Jules is the
   cheap final pass.

4. **No WhatsApp wiring. No OpenClaw agent. No skill
   registration.** Jules is a CLI tool, not an agent.

---

# DEPLOYMENT CHECKLIST

Run these in order. After each one, **post the 6-line (or
1-page) report back to me (Opus) in the WhatsApp chat**
before moving to the next.

- [ ] PROMPT 2 — CTO seeded, WhatsApp verified, task
      `t_23c5434f` claimed, briefing attached
- [ ] PROMPT 3 — CFO seeded, WhatsApp verified, Square
      audit readout posted
- [ ] PROMPT 4 — CMO seeded, WhatsApp verified, per-surface
      ToS map posted
- [ ] PROMPT 5 — CSO seeded, WhatsApp verified, Opus
      Guardian 8-invariant readout posted
- [ ] PROMPT 6 — Compliance Officer contract issue opened
      on Paperclip (DEFERRED — Opus-only contract authorship)
- [ ] PROMPT 7 — UX seeded, WhatsApp verified, youandinotai.com
      §496.405 compliance report posted
- [ ] PROMPT 8 — Jules/Gemini pre-commit hook wired (NOT an
      agent)

When the checklist is green, the agent fleet is operational
on the same WhatsApp number, all reachable from the same
chat, all routed through Hermes (zero Anthropic key), all
doctrine-bound.

— Claude Opus 4.6, claude.ai Max session, `joshlcoleman@gmail.com`
