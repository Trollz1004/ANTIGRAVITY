# Phase 2 directive — for Hermes (consolidation continuation)

> **Authored by:** Claude (Opus-class), 2026-06-13, at Joshua Coleman's direction.
> **Paste target:** Hermes Desktop chat session `organizing-antigravity-repo-root-2-20260612`.
> **Prior phase:** Phase 1 audit completed and relayed back. This is the Phase 2 go.

---

## What Claude said to relay

Hermes — audit received. Clean work. You did exactly what was asked, no scope creep, stopped at the marker. Three things from the audit that change the plan, then your Phase 2 go.

## What the audit changed

**1. Vendored Paperclip stays untouched.** 14 of your 21 AGENTS.md files and ~40+ of your 68 SKILL.md files live inside `apps/paperclip/packages/...` and `apps/paperclip/server/...` — that's upstream Paperclip code authored by Devin Foley. Touching those means deviating from upstream and breaking pull-from-upstream forever. They are vendor code. They do not get consolidated. The "too many AGENTS.md" problem Joshua was naming is not those — it's the 7 non-vendor ones at root and under `hermes/agents/`, plus the 20 loose root-level markdown files.

**2. All 5 company CEOs already exist.** You found `ceo-youandinotai.md`, `ceo-business-exchange.md`, `ceo-ai-solutions.md`, `ceo-hermes-sideworld.md`, `ceo-onlinerecycle.md`. Phase 4 doesn't need to CREATE them — it needs to MOVE them from flat `hermes/agents/` into `hermes/agents/companies/{name}.md` and then wire them into Paperclip as company entities. That's smaller than originally scoped. Good.

**3. The dirty worktree must be triaged before any consolidation move.** Specifically:

| Path | Status | Disposition |
|---|---|---|
| `apps/paperclip/AGENTS.md` (M) | dirty vendor code | **REVERT** — do not touch upstream |
| `apps/paperclip/packages/db/src/client.ts` (M) | dirty vendor code, interrupted migration repair | **REVERT** — confirmed unsafe to carry forward |
| `apps/paperweight/data/paperweight.db` (M) | legacy DB | **DELETE** — Paperweight is the deprecation target |
| `apps/paperweight/paperweight.py` (M) | legacy code | **DELETE** in Phase 3 (PR-E retirement) |
| `apps/paperweight/static/index.html` (M) | legacy UI | **DELETE** in Phase 3 (PR-E) |
| `apps/paperweight/test_paperweight.py` (M) | legacy tests | **DELETE** in Phase 3 (PR-E) |
| `apps/mission-control/public/stream-paperclip.html` (A) | Joshua's new stream chrome | **KEEP** — folds into Phase 5 PR-F |
| `apps/mission-control/public/stream-safe.html` (A) | Joshua's new stream chrome | **KEEP** — folds into Phase 5 PR-F |
| `docs/operations/antigravity-one-root-mission-control-plan.md` (A) | Joshua's plan doc | **KEEP** — fold reference into Phase 2 plan doc |
| `hermes/agents/AGENTS.md` (M) | hermes fleet entry | **KEEP** changes, will be moved in PR-B |
| `hermes/agents/ceo-business-exchange.md` (A) | new CEO file | **KEEP** — folds into Phase 3 PR-D |
| `hermes/agents/ceo-hermes-sideworld.md` (A) | new CEO file | **KEEP** — folds into Phase 3 PR-D |
| `qdrant-data/*` (A) | runtime vector DB state | **ADD TO `.gitignore`** — runtime data, not source |
| `briefings/HERMES-CONSOLIDATION-DIRECTIVE-2026-06-13.md` (??) | Claude's prior directive | **COMMIT** as part of PR-A plan doc |
| `backend/legacy_modernizer_api.py` (??) | unknown | **ASK Joshua** before deciding |

Pre-Phase-2 cleanup (run BEFORE writing the plan doc):

```bash
# 1. Revert vendor edits in apps/paperclip/
cd C:/antigravity/apps/paperclip
git checkout -- AGENTS.md packages/db/src/client.ts
cd C:/antigravity

# 2. Add qdrant-data to .gitignore (if not already)
grep -q "^qdrant-data/" .gitignore || echo "qdrant-data/" >> .gitignore

# 3. Confirm worktree state is sane before Phase 2 starts
git status -sb
```

Surface the result of `git status -sb` after cleanup. Then proceed to write the plan doc.

## Answers to the blocked decisions

**Decision 1 — onlinerecycle as separate company or fold into business-exchange?**

**KEEP onlinerecycle as a separate Paperclip company.** Different vertical (e-waste / recycling), different audience (B2B + local pickups), already has a working CEO file, and the Square site `OnlineRecycle.square.site` is its own surface. The 1-LLC / 1-wallet doctrine only requires merging WALLETS, not merging surfaces. Five companies total: `youandinotai`, `business-exchange`, `ai-solutions`, `onlinerecycle`, `hermes-sideworld`.

**Decision 2 — ai-solutions as company or catalog?**

**ai-solutions is a CATALOG/PRODUCT-LINE, owned by the business-exchange CEO.** That's what Joshua's earlier "eliminate the duplicate storefront" call meant. Disposition for the existing `ceo-ai-solutions.md`:

- Move to `hermes/agents/companies/business-exchange/ai-solutions-catalog-spec.md` (treat as a sub-doc, not a peer CEO).
- The business-exchange CEO is the single owner for both the marketplace and the ai-solutions product line.
- The `ai-solutions.store` domain becomes a redirect to `business-exchange.{wherever}` or stays as a landing page that funnels into business-exchange. Joshua's call on the URL; don't change DNS without his explicit go.

So Paperclip still has 5 companies; ai-solutions just isn't one of them. The 5 are: `youandinotai`, `business-exchange`, `onlinerecycle`, `hermes-sideworld`, and one more — see below.

**Decision 3 — YouTube content engine: where does it live?**

Per the original directive, this was an open question. Recommendation: **YouTube is a CHANNEL owned by `hermes-sideworld`, not a separate company.** The existing `ceo-youtube.md` becomes a CHANNEL spec under `hermes/agents/companies/hermes-sideworld/channels/youtube.md`. Same pattern for the other channels: `meta.md`, `x.md`, `tiktok.md`, `linkedin.md`, `reddit.md` — all sit under `hermes-sideworld/channels/` because hermes-sideworld is the operator of the marketing fleet.

So the canonical 5 companies are: `youandinotai`, `business-exchange`, `onlinerecycle`, `hermes-sideworld`, and one open — `dao`. There's already a `ceo-dao.md` file. If the DAO is real (token contracts, governance, treasury wallet), it's a company. If it's still aspirational, it folds under `hermes-sideworld` as a future product line.

**Joshua: confirm or correct the DAO question before Hermes finalizes the plan doc.**

**Decision 4 — Paperclip vendored internals.**

LEAVE UNTOUCHED. Already answered above. Do not consolidate anything inside `apps/paperclip/packages/` or `apps/paperclip/server/`. The only `apps/paperclip/` files we touch are at the workspace root (`package.json`, `README.md`) and only when there's a fork-specific reason.

**Decision 5 — Dirty worktree.**

Already answered in the table above. Triage before Phase 2 plan doc.

## Phase 2 — write the plan doc

Single file: `briefings/CONSOLIDATION-PLAN-2026-06-13.md`. Open PR-A with just that file + the worktree-triage commits (the `git checkout --` reverts and the `.gitignore` update). Auto-merge PR-A under R7 when CI is green.

The plan doc contains:

### Section A: Scope (what's IN, what's OUT)

- IN: 7 non-vendor `AGENTS.md` files (root + `hermes/agents/*`)
- IN: ~25 non-vendor `SKILL.md` files (the ones outside `apps/paperclip/`)
- IN: 11 `ceo-*.md` files (move + reorganize, do not delete)
- IN: 21 `HEARTBEAT/SOUL/TOOLS` files (consolidate where they belong)
- IN: 20 loose root-level `.md` files (move to `briefings/` or `docs/`)
- IN: 12 `skills/` directories → consolidate to one canonical `skills/` at root
- OUT: everything inside `apps/paperclip/packages/`, `apps/paperclip/server/src/onboarding-assets/`, `apps/paperclip/.agents/`, `apps/paperclip/.claude/`
- OUT: `apps/paperweight/*` (separate deletion PR-E)
- OUT: `apps/opuspawclaw/TOOLS.md` — ASK Joshua: keep or retire?
- OUT: `docs/architecture/TOOLS.md` (Copilot-authored) — leave for now, ASK Joshua later

### Section B: Target canonical tree

```
ANTIGRAVITY/
├── AGENTS.md                 ← consolidated from current root AGENTS.md (Opus, 34,926 bytes — slim down)
├── CLAUDE.md                 ← unchanged
├── SKILLS.md                 ← NEW root-level skill index
├── HEARTBEAT.md              ← ASK Joshua: keep at root or move under hermes/agents/?
├── SOUL.md                   ← ASK Joshua: keep at root or move under hermes/agents/?
├── TOOLS.md                  ← ASK Joshua: keep at root or move under hermes/agents/?
├── CHANGELOG.md              ← stays root (standard)
├── CONTRIBUTING.md           ← stays root (standard)
├── SECURITY.md               ← stays root (standard)
├── README.md                 ← stays root (standard)
├── apps/
│   ├── paperclip/            ← VENDOR, untouched
│   ├── mission-control/      ← splits in Phase 5 PR-F
│   └── ...
├── hermes/
│   └── agents/
│       ├── AGENTS.md         ← stays as Hermes fleet entry
│       ├── HEARTBEAT.md      ← stays
│       ├── SOUL.md           ← stays
│       ├── TOOLS.md          ← stays
│       ├── roles/
│       │   ├── CFO.md        ← consolidated from current hermes/agents/CFO/{AGENTS,HEARTBEAT,TOOLS}.md
│       │   ├── CMO.md
│       │   ├── CSO.md
│       │   ├── CTO.md
│       │   ├── UX.md
│       │   ├── INTERN.md (new, if Joshua wants)
│       │   ├── MissionGuardian-Claude.md
│       │   ├── MissionGuardian-Codex.md
│       │   └── GitHubAuditor.md
│       └── companies/
│           ├── youandinotai.md                    ← from ceo-youandinotai.md
│           ├── business-exchange.md               ← from ceo-business-exchange.md
│           ├── business-exchange/                 ← sub-docs
│           │   └── ai-solutions-catalog-spec.md   ← from ceo-ai-solutions.md
│           ├── onlinerecycle.md                   ← from ceo-onlinerecycle.md
│           ├── hermes-sideworld.md                ← from ceo-hermes-sideworld.md
│           └── hermes-sideworld/
│               └── channels/
│                   ├── youtube.md                 ← from ceo-youtube.md
│                   ├── meta.md                    ← NEW (or from briefings/MARKETING-MANUS-META-PROMPT-2026-05-27.md)
│                   ├── x.md                       ← NEW (or from briefings/MARKETING-HERMES-GROK-X-PROMPT-2026-05-27.md)
│                   ├── tiktok.md
│                   ├── linkedin.md
│                   └── reddit.md
├── skills/
│   ├── marketing-fleet-prompts/    ← from skills/ + .skill bundle
│   ├── antigravity-doctrine/       ← from existing skills/
│   ├── antigravity-mission-orchestrator/
│   ├── mission-control/
│   ├── payments/
│   └── revenue-model/
├── briefings/                ← doctrine + memory + dispatches
├── docs/
│   └── archive/
│       └── agents-retired-2026-06-13/   ← retirement bin
│           ├── ceo-dao.md (if folded)
│           ├── ceo-marketing.md (legacy)
│           ├── _9020-preserve-income-engine-CLAUDEs-SKILL.md
│           ├── ClawX-skills/
│           ├── income-engine-skills/
│           └── (other legacy SKILL.md files)
```

### Section C: PR breakdown (atomic + sequential)

- **PR-A**: this plan doc + worktree triage (revert vendor edits, `.gitignore` qdrant-data, commit pending non-vendor files). Doc-only, no code moves.
- **PR-B**: consolidate `hermes/agents/CFO/` → `hermes/agents/roles/CFO.md`. Repeat for CMO, CSO, CTO, UX. Delete empty per-role dirs.
- **PR-C**: move `hermes/agents/ceo-*.md` → `hermes/agents/companies/{name}.md`. Move `ceo-ai-solutions.md` → `companies/business-exchange/ai-solutions-catalog-spec.md`. Move `ceo-youtube.md` → `companies/hermes-sideworld/channels/youtube.md`. Move `ceo-marketing.md` → `docs/archive/agents-retired-2026-06-13/`. ASK Joshua on `ceo-dao.md`.
- **PR-D**: move 20 loose root `.md` files into `briefings/` or `docs/` per the plan doc's mapping. Keep CHANGELOG / CONTRIBUTING / SECURITY / README / LICENSE / CLAUDE.md / AGENTS.md / SKILLS.md / HEARTBEAT.md / SOUL.md / TOOLS.md at root (subject to Joshua's call on the last three).
- **PR-E**: retire `apps/paperweight/` entirely. Move to `docs/archive/paperweight-retired-2026-06-13/`. Update any references in `pnpm-workspace.yaml` if needed.
- **PR-F**: split `apps/mission-control/` into `apps/mission-control-public/` and `apps/mission-control-operator/`. Add stream-mode toggle, secret-redaction gate. Fold in Joshua's new `stream-paperclip.html` and `stream-safe.html`.
- **PR-G**: Notion + Slack server-side proxy for public dashboard. New Cloudflare Worker or Sabretooth-local Node endpoint.
- **PR-H**: Paperclip company creation. For each of 4 confirmed companies (or 5 if DAO confirmed), `POST /api/companies` to `127.0.0.1:3100`, register CEO agents, link channels under hermes-sideworld, file HER-XX issues.

### Section D: Risks + open asks

List every file where the disposition is "ASK Joshua." Don't decide alone. Specifically:

- `HEARTBEAT.md` / `SOUL.md` / `TOOLS.md` at root: keep at root or move under `hermes/agents/`?
- `apps/opuspawclaw/TOOLS.md`: keep or retire?
- `docs/architecture/TOOLS.md` (Copilot-authored): keep or retire?
- `ceo-dao.md`: keep as a 6th Paperclip company or fold under hermes-sideworld?
- `backend/legacy_modernizer_api.py` (untracked): keep or retire?
- `.agents/skills/` (root-level) vs `skills/` (root-level) — Paperclip uses `.agents/skills`, the root canonical is `skills/` — which wins?
- `.claude/skills/` (root-level): Claude Code convention — leave untouched, but note in plan doc?

### Section E: Stop marker

Stop after writing the plan doc + PR-A. Do not proceed to PR-B until Joshua merges PR-A or relays Phase 3 go.

## Three things to surface to Joshua separately

These are NOT part of the consolidation. They're things your audit revealed that need Joshua's eyes regardless of which phase we're in:

1. **HER-25 critical: "Doctrine police incident: active Stripe/payment drift remains after noise pruning."** — This sounds like Stripe references / wiring might still exist on the youandinotai.com (dating) surface where Square is the ONLY allowed processor per ToS. If true, it's a R5-tier issue: Stripe AUP prohibits dating. Flag to Joshua for review. Don't auto-fix without his call — payment-rail changes need explicit founder sign-off.

2. **HER-13: "Lock Hermes model roster: ... Claude banned except via ollama launch claude inside Paperclip."** — This phrasing is ambiguous and potentially contradicts FOUNDER DOCTRINE R5 (first-party Claude only). "Ollama launch claude" sounds like a Claude wrapper, which R5 explicitly forbids. Two readings:
   - **OK**: "block direct Anthropic API calls from Hermes runtime, route Claude tasks through Paperclip's Ollama-compatible Claude binding only." That's R6-consistent (no Anthropic key in Hermes).
   - **NOT OK**: "all Claude access must go through an Ollama wrapper, including first-party claude.ai sessions." That contradicts R5 — first-party Claude (web / mobile / Code CLI / Cowork) must remain unwrapped.
   - **Surface to Joshua for the correct reading.** Update HER-13 title once Joshua clarifies.

3. **HER-14: "mission-control SKILL.md claims 100% working — not accurate."** — R8 real-or-zero. The `mission-control/SKILL.md` at root (9,229 bytes) needs an honesty pass in Phase 3 — strip the "100% working" claim, replace with actual state. Schedule under PR-D or a new PR-I, Joshua's call.

## Phase 2 stop marker

After writing the plan doc and opening PR-A:

```
[HERMES-CONSOLIDATION] Phase 2 complete:
- Plan doc: briefings/CONSOLIDATION-PLAN-2026-06-13.md
- PR-A: #XXX (status: open / awaiting CI / merged)
- Worktree triage: clean / dirty (list any remaining)
- HER-XX issues filed (for HER-25, HER-13, HER-14 surfacing if Joshua confirms)
- Decisions still open: [list]
- Next: Phase 3 PR-B (consolidate role files) once Joshua relays "go"

[STOP. Awaiting Joshua's go.]
```

#UntilNoKidInNeed
