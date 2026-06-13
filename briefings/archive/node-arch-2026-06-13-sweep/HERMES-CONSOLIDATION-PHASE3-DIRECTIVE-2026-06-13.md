# Phase 3 directive — for Hermes (consolidation continuation)

> **Authored by:** Claude (Opus-class), 2026-06-13, at Joshua Coleman's direction.
> **Paste target:** Hermes Desktop chat session `organizing-antigravity-repo-root-2-20260612`.
> **Prior phase:** Phase 2 complete. PR #139 (plan doc) merged as `58ba0b88`. PR #140 (pnpm-lock.yaml fix for `apps/business-exchange/package.json`) merged as `ad905b82`. All CI green including CodeRabbit. Lockfile drift catch was clean discipline — exactly the cadence asked for.

---

## ⚠️ UPDATES SINCE FIRST DRAFT — read first

Three things changed in the ~hour between writing this directive and Joshua relaying it. Each adjusts the work:

**1. Stripe is now LIVE on the AI Solutions side.** First product (Custom Consult $99) approved and live at `buy.stripe.com/aFa7sNfK6aOC3b60MT1wY00`. `STRIPE_SECRET_KEY` rerolled and freshly synced in GitHub Secrets at `2026-06-13T06:24:30Z`. This means:
   - **HER-25 (Stripe/payment drift) is no longer a "verify during Phase 3" item.** It is now a **PR-A1 must-clear precondition** to any further consolidation work. If there is ANY route on youandinotai.com (dating surface) that could fire a Stripe SDK call with the live key — automated test, scheduled job, dead-code-that-still-runs, anything — it is an immediate Stripe AUP violation risk because the credentials are hot. PR-A1 was inserted below specifically to scrub this before PR-B runs.
   - **`STRIPE_PUBLISHABLE_KEY` in GH Secrets is from 2026-06-09 — likely stale post-reroll.** Joshua should reroll the publishable too (or confirm it survived) and re-sync. Note for Phase 4 wiring.
   - **`STRIPE_PUBLIC_KEY` and `STRIPE_PUBLISHABLE_KEY` are both set as separate secrets** in the repo. That's duplicate naming. Consolidate to one canonical name during PR-D or a small dedicated PR-D1.

**2. Stripe keys have ~7-day TTL on this account.** Joshua's restricted-key tier rotates short. File a new HER issue (HER-34 or whatever's next) titled `Stripe credential rotation: 6-day auto-pull from dashboard, sync to GH Secrets`. The pattern: a scheduled Hermes task that runs every 6 days, authenticates against the Stripe dashboard via Joshua's browser session, reveals the fresh secret, pipes silently to `gh secret set STRIPE_SECRET_KEY`, logs the rotation to HER. Without this, the `STRIPE_SECRET_KEY` in GH Secrets goes dead every week and Phase-4-onward batch product creation breaks.

**3. `STRIPE_RESTRICTED_KEY` is blocked by GitHub Secrets API (HTTP 400).** Likely GitHub's secret-scanning push-protection refusing to accept the `rk_live_` value via API and requiring the web UI paste path. Joshua will paste it manually via `https://github.com/Trollz1004/ANTIGRAVITY/settings/secrets/actions/new` as a 30-second action. Do NOT plan to consume `STRIPE_RESTRICTED_KEY` from secrets API automation until Joshua confirms it's been pasted. Until then, use `STRIPE_SECRET_KEY` only.

These three updates DO NOT change the 8 decisions answered below — only the PR sequence (PR-A1 inserted, PR-D may grow a Stripe-secrets-cleanup sub-task) and the surfacing flags (HER-25 hoisted to critical-blocking, HER-34 new for rotation).

---

## What Claude said to relay

Hermes — Phase 2 came back clean. Two PRs, both green, lockfile rot caught before it could compound. Joshua relayed the report. Here are answers to all 8 open decisions, plus the Phase 3 go (with PR-A1 inserted ahead of PR-B per the Stripe-live update above). After Phase 3 PR-E merges, stop again — Phase 4 (companies in Paperclip) needs Joshua's confirmation that PR-A1 cleared HER-25 cleanly.

## Answers to the 8 open decisions

These come from Joshua via Claude. Treat them as authoritative for Phase 3 execution. If anything here conflicts with what Joshua tells you directly, Joshua wins.

**1. Root `HEARTBEAT.md` / `SOUL.md` / `TOOLS.md` — keep root or move under `hermes/agents/`?**

**Move under `hermes/agents/`.** Specifically:
- `HEARTBEAT.md` → already a duplicate-ish concept at `hermes/agents/HEARTBEAT.md` (4,779 bytes) which is more recent and substantial. Move the root one to `docs/archive/agents-retired-2026-06-13/root-HEARTBEAT-2026-06-13.md` for history. Keep `hermes/agents/HEARTBEAT.md` as canonical.
- `SOUL.md` → same pattern. `hermes/agents/SOUL.md` (3,627 bytes) is canonical Hermes-fleet persona. Root copy (1,747 bytes) is older — archive it.
- `TOOLS.md` → root copy (1,798 bytes) vs `hermes/agents/TOOLS.md` (2,295 bytes). Canonical is `hermes/agents/`. Archive root.

**Verify before moving:** does the live WSL Paperclip read root `SOUL.md` / `HEARTBEAT.md` / `TOOLS.md` at startup by Devin-Foley-convention? If yes, leave a thin pointer at root: a 1-line markdown file saying `> Canonical version lives at hermes/agents/{NAME}.md` so Paperclip doesn't error on missing file but the actual content lives in one place. If Paperclip doesn't read root, full move is fine.

**2. `apps/opuspawclaw/TOOLS.md` — keep or retire?**

**Keep.** `apps/opuspawclaw/` is still an active Vite + Electron + React 19 desktop AI workstation app per CLAUDE.md. Its tooling doc stays with the app.

**3. `docs/architecture/TOOLS.md` (Copilot-authored, 3,554 bytes) — keep or retire?**

**Read first, then decide.** Open the file, summarize what it covers in 2 sentences, and surface to Joshua. If it documents real architecture that's still accurate, keep. If it's Copilot speculation that never matched reality, retire to `docs/archive/`. Don't decide alone.

**4. `ceo-dao.md` — Paperclip company or future product line under Hermes Sideworld?**

**Fold under Hermes Sideworld for now.** The DAO tokens ($LOVE, $UKID, $GREEN, $AGRAV) are aspirational until smart contracts are deployed on Base L2 with verified treasury addresses and on-chain activity. Move `hermes/agents/ceo-dao.md` → `hermes/agents/companies/hermes-sideworld/product-lines/dao.md`. When the DAO contracts ship and stake real value, promote to its own Paperclip company in a separate PR. Until then, it's a Hermes-Sideworld product line, not a company.

**5. `backend/legacy_modernizer_api.py` (untracked) — keep or retire?**

**Read first, then decide.** Open, summarize in 2 sentences, surface to Joshua. If it's referenced anywhere live (`git grep`), keep. If it's orphan code from an old refactor, move to `docs/archive/legacy/` and remove from `backend/`.

**6. `.agents/skills/` (root) vs `skills/` (root) — which wins?**

**Both stay, they serve different systems.**
- `.agents/skills/` is Paperclip's convention (dot-prefix, agent-tooling config). Paperclip looks for it. Don't touch.
- `skills/` is the canonical root for Claude Code / Cowork skills. Joshua's new `marketing-fleet-prompts` skill lives here pattern.
- They are NOT duplicates — different systems, different consumers. Leave both. Add a note to `SKILLS.md` (the new root index) explaining the distinction so future agents understand.

**7. `.claude/skills/` (root) — what to do?**

**Leave untouched.** That's Claude Code's reserved namespace. Touching it breaks Claude Code's skill resolution. Same as `.agents/` — different system, leave alone.

**8. `ceo-marketing.md` — archive or fold into Hermes Sideworld channels?**

**Archive.** With marketing now broken into per-channel agents (`hermes/agents/companies/hermes-sideworld/channels/{youtube,meta,x,tiktok,linkedin,reddit}.md`), a single `ceo-marketing` role is redundant and creates the exact "too many AGENTS.md" problem Joshua flagged. Move `hermes/agents/ceo-marketing.md` → `docs/archive/agents-retired-2026-06-13/ceo-marketing.md` with a 1-line preamble noting it was superseded by the per-channel agents.

## Phase 3 — execute PR-A1 through PR-E

**PR-A1: HER-25 Stripe-on-dating audit + scrub (INSERTED — must clear before PR-B)**

Branch: `hermes/consolidation-A1-stripe-drift-scrub-2026-06-13`.

Rationale: Stripe is live with a hot secret key in GH Secrets as of tonight. Any code path on a youandinotai.com (dating) route that could fire a Stripe SDK call is now an immediate AUP risk. Find and scrub before any other consolidation PR lands.

Audit steps (read-only first, before any deletion):

1. `git grep -i "stripe"` across the entire repo. Catalog every hit by file path.
2. Classify each hit:
   - **OK**: hits inside `ai-solutions.store`, `business-exchange`, `apps/business-exchange/`, `apps/ai-solutions/`, documentation in `briefings/` / `docs/`, payment-router logic that EXPLICITLY excludes dating routes, vendor code in `apps/paperclip/`, archived `docs/archive/`.
   - **NEEDS SCRUB**: hits inside `apps/youandinotai-frontend/`, `backend/fastapi-app/app/` (when on a dating-route handler), `apps/mission-control-public/`, any deploy config that points dating-surface deploys at Stripe SDK, any test file that exercises a Stripe path on a dating route.
   - **UNCLEAR**: surface to Joshua before touching.
3. Search for live wirings specifically: `Stripe(...)`, `stripe.PaymentIntent.create`, `stripe.checkout.Session.create`, `stripe.Customer.create`, `STRIPE_SECRET_KEY` env var consumption, `import stripe` in dating-route code, `<script src="https://js.stripe.com/`, `stripe-buy-button` element in dating-surface HTML.
4. For each `NEEDS SCRUB` hit: produce a diff that removes or quarantines it. Show all diffs in the PR description for review before merge.

Scrub steps:

1. Remove the Stripe SDK consumption from dating-route handlers.
2. Replace with explicit `RuntimeError("Stripe is prohibited on youandinotai.com surface. Use Square. See FOUNDER DOCTRINE §payments-per-surface.")` so any caller fails loud rather than silent.
3. Add a CI grep gate to `.github/workflows/ci-validate.yml` that fails the build if `import stripe` or `stripe-buy-button` or `js.stripe.com` appears in any file path matching `apps/youandinotai-frontend/**` or any dating-route handler. (This prevents drift from re-introducing.)
4. Update HER-25 with the scrub diff summary, link the PR, mark resolved when merged.

CI gate: validate, eslint-prettier-check, black-ruff-check, run-tests, js-tests, guardian-check, owasp-dependency-check, policy guard, CodeRabbit. PLUS the new dating-Stripe grep gate. All must be green.

**Stop after PR-A1 merges.** Surface to Joshua: "HER-25 clear, drift count was N hits scrubbed, CI grep gate live, safe to proceed to PR-B." Wait for Joshua's "go" before PR-B starts.

**PR-B: Consolidate Hermes role files**

Branch: `hermes/consolidation-B-roles-2026-06-13` (or your preferred convention).

Moves:
- `hermes/agents/CFO/` (AGENTS.md, HEARTBEAT.md, TOOLS.md) → consolidate into single `hermes/agents/roles/CFO.md`. Merge contents: AGENTS.md sections become "Role" and "Mandate" at top, HEARTBEAT becomes "Heartbeat" section, TOOLS becomes "Tools" section.
- Repeat for CMO, CSO, CTO, UX.
- Delete the empty per-role directories after consolidation.
- Update `hermes/agents/AGENTS.md` (fleet entry) to point to the new flat-file `roles/{NAME}.md` paths instead of the old per-role dirs.

Also in PR-B (related root-level cleanup that goes hand-in-hand):
- Archive root `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md` per decision 1.
- If Paperclip needs root pointers (check first), add 1-line stub files; if not, full move.

CI must stay green. Run `pnpm install --frozen-lockfile` locally before push to catch any lockfile drift early (same discipline that caught the `apps/business-exchange` drift in Phase 2).

**PR-C: Move CEO files into `companies/`**

Branch: `hermes/consolidation-C-companies-2026-06-13`.

Moves:
- `hermes/agents/ceo-youandinotai.md` → `hermes/agents/companies/youandinotai.md`
- `hermes/agents/ceo-business-exchange.md` → `hermes/agents/companies/business-exchange.md`
- `hermes/agents/ceo-onlinerecycle.md` → `hermes/agents/companies/onlinerecycle.md`
- `hermes/agents/ceo-hermes-sideworld.md` → `hermes/agents/companies/hermes-sideworld.md`
- `hermes/agents/ceo-ai-solutions.md` → `hermes/agents/companies/business-exchange/ai-solutions-catalog-spec.md` (per Phase 2 decision — ai-solutions is a catalog under business-exchange)
- `hermes/agents/ceo-youtube.md` → `hermes/agents/companies/hermes-sideworld/channels/youtube.md`
- `hermes/agents/ceo-dao.md` → `hermes/agents/companies/hermes-sideworld/product-lines/dao.md` (per decision 4)
- `hermes/agents/ceo-marketing.md` → `docs/archive/agents-retired-2026-06-13/ceo-marketing.md` with preamble (per decision 8)

Also in PR-C: create the new channel spec files for the channels that don't have a per-channel CEO yet but have a marketing prompt:
- `hermes/agents/companies/hermes-sideworld/channels/meta.md` — points at `briefings/MARKETING-MANUS-META-PROMPT-2026-05-27.md` and notes Manus as the executor
- `hermes/agents/companies/hermes-sideworld/channels/x.md` — points at `briefings/MARKETING-HERMES-GROK-X-PROMPT-2026-05-27.md`
- Future channels (TikTok, LinkedIn, Reddit) get stubs that say "TBD — generate via `marketing-fleet-prompts` skill when needed."

**PR-D: Move 20 loose root `.md` files**

Branch: `hermes/consolidation-D-root-cleanup-2026-06-13`.

Use the disposition table from the Phase 2 plan doc. Files that stay at root: `README.md`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, `CLAUDE.md`, `SKILLS.md` (new). Everything else goes to `briefings/` (for ongoing operational docs) or `docs/` (for stable reference docs) per the plan doc's mapping.

Special handling for the provider-named docs (`GEMINI.md`, `GROK.md`, `PERPLEXITY.md`, `hermes.md`, `GEMINI_STATE.md`, `hermes-config-improved-xai.md`) — these probably belong in `briefings/providers/` or `docs/providers/`. Pick one location, be consistent.

**PR-E: Retire `apps/paperweight/`**

Branch: `hermes/consolidation-E-paperweight-retirement-2026-06-13`.

Moves:
- `apps/paperweight/` (full directory) → `docs/archive/paperweight-retired-2026-06-13/`
- Update `pnpm-workspace.yaml` if it references `apps/paperweight/`
- Update any CI workflow references (search `.github/workflows/*.yml` for "paperweight")
- Update `CLAUDE.md` if it still references `apps/paperweight/` as an active path
- Verify no live process is still pointing at port 3100 toward the old paperweight (the kill from HER-33 should hold, but double-check)

After PR-E merges, `apps/paperweight/` is gone. WSL Paperclip remains the sole system of record at 3100.

## Stop marker after PR-E

After PR-E merges, do NOT proceed to PR-F (mission-control split) without Joshua's explicit go. Phase 4 (companies in Paperclip) and Phase 5 (mission-control split) depend on Joshua having a chance to verify the consolidation looks right before bigger surgery.

Report after each PR:

```
[HERMES-CONSOLIDATION] PR-X complete:
- Branch: hermes/consolidation-X-topic-YYYY-MM-DD
- PR: #NNN
- Merge commit: SHA
- Files moved/changed: count + summary
- CI status: all green / red on [job]
- Worktree remaining: clean / list still dirty
- Next: PR-Y (description)

[STOP. Awaiting Joshua's go.]
```

## Three flags still open from Phase 2 — please address inline

1. **HER-25 Stripe/payment drift — now handled by PR-A1 (see above).** Phase 2's "verify during Phase 3" disposition is superseded by the post-write update: Stripe is live, key is hot, drift scrub is now a hard precondition to PR-B. Run PR-A1 first. Surface verdict to Joshua: drift count, files touched, CI grep gate confirmation. Do not start PR-B until Joshua relays "go" after PR-A1.

2. **HER-13 Claude/Ollama wording clarification.** The "Claude banned except via ollama launch claude inside Paperclip" phrasing needs Joshua's read. Two interpretations:
   - R6-consistent: "no Anthropic API key in Hermes runtime; route any Claude needs through Paperclip's Ollama-compat Claude binding only." OK.
   - R5-violating: "all Claude access including first-party claude.ai gets wrapped." NOT OK.
   
   Surface to Joshua for the correct interpretation. Update HER-13 title once clarified.

3. **HER-14 mission-control SKILL.md honesty pass.** The "100% working" claim is R8 (real-or-zero) violation. Fix during PR-D or a separate PR-I, Joshua's call on which.

## One new flag from tonight's Stripe go-live

4. **HER-34 (NEW) — Stripe credential rotation pattern.** Stripe keys on this account rotate every ~7 days per Joshua. The freshly-synced `STRIPE_SECRET_KEY` in GH Secrets will die in 6 days without intervention. Open HER-34 titled `Stripe credential rotation: 6-day auto-pull from dashboard, sync to GH Secrets`. Suggested implementation:
   - Scheduled task on Sabretooth that fires every 6 days at a low-traffic hour (3am local).
   - Authenticates against the Stripe dashboard via Joshua's saved browser session OR via the Stripe CLI if he's logged into it (`stripe login`).
   - Reveals current live secret key.
   - Pipes silently to `gh secret set STRIPE_SECRET_KEY --repo Trollz1004/ANTIGRAVITY` (stdin pipe, value never echoed).
   - Logs rotation timestamp + new key length (NOT value) to HER-34 as a comment.
   - Optionally also rotates `STRIPE_PUBLISHABLE_KEY` if it's on the same TTL.
   - Surfaces a Telegram alert via `opushashands_bot` on success or failure.
   
   First rotation cycle target: 2026-06-19 (6 days from tonight's sync). Implement before then or the dependent batch-product-creation work breaks.

## Doctrine refusal protocol (unchanged from Phase 1/2)

Refuse and surface if any operation would mutate FOUNDER DOCTRINE rules 1-13, would write a canonical-7 word to a customer surface, would push from a non-Sabretooth node, would add an Anthropic key to any Hermes runtime path, or would bypass git hooks without Joshua's explicit per-task override.

#UntilNoKidInNeed
