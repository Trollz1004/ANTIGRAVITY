# ANTIGRAVITY Consolidation Plan — 2026-06-13

> **For Hermes:** This is PR-A only. Do not execute PR-B or later from this file without Joshua's explicit next `go`.

**Authority:** Joshua Coleman is the sole authority. Claude/Opus authored the prior directives as guidance; Hermes/GPT-5.5 Codex acts only under Joshua's direction.

**Goal:** Consolidate ANTIGRAVITY's non-vendor agent, skill, company, and operator-documentation surfaces into one navigable tree while keeping WSL Paperclip as the live orchestration board.

**Architecture:** `C:/antigravity` remains the canonical repo/root on sabretooth. WSL Paperclip at `/home/josh/.paperclip/instances/default` remains the live board and execution surface at `http://127.0.0.1:3100`. Vendored Paperclip internals remain untouched so future upstream pulls stay viable.

**Doctrine:** `briefings/FOUNDER-DOCTRINE-2026-05-19.md` remains immutable. If any implementation request would mutate doctrine, push to a non-ANTIGRAVITY remote, push from a non-sabretooth node, bypass hooks, expose secrets, fabricate metrics, or place banned terms on customer-facing surfaces, refuse and surface to Joshua.

---

## Section A — Scope

### In scope

- The 7 non-vendor `AGENTS.md` files:
  - `AGENTS.md`
  - `hermes/agents/AGENTS.md`
  - `hermes/agents/CFO/AGENTS.md`
  - `hermes/agents/CMO/AGENTS.md`
  - `hermes/agents/CSO/AGENTS.md`
  - `hermes/agents/CTO/AGENTS.md`
  - `hermes/agents/UX/AGENTS.md`
- Non-vendor `SKILL.md` files and skill directories outside vendored Paperclip internals.
- `ceo-*.md` files under `hermes/agents/` and related legacy locations.
- `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md` files that belong to root or Hermes agent surfaces.
- Loose root-level markdown that should move into `briefings/`, `docs/`, or remain root by convention.
- Root skill index creation: `SKILLS.md`.
- Paperclip issue logging for the consolidation work.

### Out of scope

Do not consolidate or rewrite vendored Paperclip internals:

- `apps/paperclip/packages/**`
- `apps/paperclip/server/src/onboarding-assets/**`
- `apps/paperclip/.agents/**`
- `apps/paperclip/.claude/**`

Do not touch these except for an explicit fork-specific reason approved by Joshua:

- `apps/paperclip/package.json`
- `apps/paperclip/README.md`
- other workspace-root Paperclip files

Defer these to later PRs or explicit Joshua decisions:

- `apps/paperweight/**` retirement: PR-E.
- `apps/opuspawclaw/TOOLS.md`: ask Joshua before keep/retire.
- `docs/architecture/TOOLS.md`: leave for now; ask Joshua later.
- `backend/legacy_modernizer_api.py`: ask Joshua before keep/retire.
- DNS or payment rail changes: ask Joshua explicitly.

---

## Section B — Target canonical tree

```text
ANTIGRAVITY/
├── AGENTS.md                 # consolidated root entry point; slimmed, doctrine-linked
├── CLAUDE.md                 # unchanged unless drift is explicitly found
├── SKILLS.md                 # new root-level skill index
├── HEARTBEAT.md              # ask Joshua: keep root or move under hermes/agents/
├── SOUL.md                   # ask Joshua: keep root or move under hermes/agents/
├── TOOLS.md                  # ask Joshua: keep root or move under hermes/agents/
├── CHANGELOG.md              # stays root
├── CONTRIBUTING.md           # stays root
├── SECURITY.md               # stays root
├── README.md                 # stays root
├── apps/
│   ├── paperclip/            # vendor; untouched except approved workspace-root changes
│   ├── mission-control/      # split in PR-F
│   └── ...
├── hermes/
│   └── agents/
│       ├── AGENTS.md         # Hermes fleet entry
│       ├── HEARTBEAT.md      # Hermes fleet heartbeat
│       ├── SOUL.md           # Hermes fleet soul/persona context
│       ├── TOOLS.md          # Hermes fleet tools index
│       ├── roles/
│       │   ├── CFO.md        # from hermes/agents/CFO/{AGENTS,HEARTBEAT,TOOLS}.md
│       │   ├── CMO.md
│       │   ├── CSO.md
│       │   ├── CTO.md
│       │   ├── UX.md
│       │   ├── INTERN.md                    # new only if Joshua wants
│       │   ├── MissionGuardian-Claude.md    # new only if Joshua wants
│       │   ├── MissionGuardian-Codex.md     # new only if Joshua wants
│       │   └── GitHubAuditor.md             # new only if Joshua wants
│       └── companies/
│           ├── youandinotai.md                    # from ceo-youandinotai.md
│           ├── business-exchange.md               # from ceo-business-exchange.md
│           ├── business-exchange/
│           │   └── ai-solutions-catalog-spec.md   # from ceo-ai-solutions.md
│           ├── onlinerecycle.md                   # from ceo-onlinerecycle.md
│           ├── hermes-sideworld.md                # from ceo-hermes-sideworld.md
│           └── hermes-sideworld/
│               └── channels/
│                   ├── youtube.md                 # from ceo-youtube.md
│                   ├── meta.md                    # new or from existing marketing briefing
│                   ├── x.md                       # new or from existing marketing briefing
│                   ├── tiktok.md
│                   ├── linkedin.md
│                   └── reddit.md
├── skills/
│   ├── marketing-fleet-prompts/
│   ├── antigravity-doctrine/
│   ├── antigravity-mission-orchestrator/
│   ├── mission-control/
│   ├── payments/
│   └── revenue-model/
├── briefings/                # doctrine, audit, consolidation plans, dispatches
└── docs/
    └── archive/
        └── agents-retired-2026-06-13/
```

### Company disposition

Confirmed company surfaces for later Paperclip wiring:

- `youandinotai`: dating/social-discovery app; T5500 runtime; Square-only payment rail.
- `business-exchange`: marketplace/retail surface; 9020 runtime.
- `onlinerecycle`: separate company; e-waste/recycling vertical; Square site remains its own surface.
- `hermes-sideworld`: meta-company for AI router, infra, dev tooling, marketing fleet.

Catalog/channel disposition:

- `ai-solutions` becomes a catalog/product-line owned by `business-exchange`, not a peer CEO company.
- `youtube` becomes a channel owned by `hermes-sideworld`, not a peer CEO company.
- `marketing` likely archives or folds into `hermes-sideworld/channels/`; ask Joshua before final disposition.
- `dao` remains open: company if real governance/treasury/contracts exist; otherwise future product line under `hermes-sideworld`.

---

## Section C — Atomic PR breakdown

### PR-A — Plan and worktree triage

Branch: `hermes/consolidation-a-plan-2026-06-13`

Allowed changes:

- Add this file: `briefings/CONSOLIDATION-PLAN-2026-06-13.md`.
- Commit prior consolidation directives/audit if Joshua wants them tracked:
  - `briefings/HERMES-CONSOLIDATION-DIRECTIVE-2026-06-13.md`
  - `briefings/HERMES-CONSOLIDATION-PHASE2-DIRECTIVE-2026-06-13.md`
  - `briefings/HERMES-CONSOLIDATION-AUDIT-FOR-OPUS-2026-06-13.md`
- Revert vendored edits in `apps/paperclip/AGENTS.md` and `apps/paperclip/packages/db/src/client.ts`.
- Add `qdrant-data/` to `.gitignore` and unstage runtime Qdrant data.

Do not move agent files in PR-A.

### PR-B — Consolidate role files

Branch: `hermes/consolidation-b-roles-2026-06-13`

Move and consolidate:

- `hermes/agents/CFO/{AGENTS,HEARTBEAT,TOOLS}.md` → `hermes/agents/roles/CFO.md`
- `hermes/agents/CMO/{AGENTS,HEARTBEAT,TOOLS}.md` → `hermes/agents/roles/CMO.md`
- `hermes/agents/CSO/{AGENTS,HEARTBEAT,TOOLS}.md` → `hermes/agents/roles/CSO.md`
- `hermes/agents/CTO/{AGENTS,HEARTBEAT,TOOLS}.md` → `hermes/agents/roles/CTO.md`
- `hermes/agents/UX/{AGENTS,HEARTBEAT,TOOLS}.md` → `hermes/agents/roles/UX.md`

Delete empty per-role directories only after verifying their contents moved.

### PR-C — Consolidate company and channel files

Branch: `hermes/consolidation-c-companies-2026-06-13`

Move:

- `hermes/agents/ceo-youandinotai.md` → `hermes/agents/companies/youandinotai.md`
- `hermes/agents/ceo-business-exchange.md` → `hermes/agents/companies/business-exchange.md`
- `hermes/agents/ceo-onlinerecycle.md` → `hermes/agents/companies/onlinerecycle.md`
- `hermes/agents/ceo-hermes-sideworld.md` → `hermes/agents/companies/hermes-sideworld.md`
- `hermes/agents/ceo-ai-solutions.md` → `hermes/agents/companies/business-exchange/ai-solutions-catalog-spec.md`
- `hermes/agents/ceo-youtube.md` → `hermes/agents/companies/hermes-sideworld/channels/youtube.md`
- `hermes/agents/ceo-marketing.md` → `docs/archive/agents-retired-2026-06-13/ceo-marketing.md` unless Joshua says fold into `hermes-sideworld/channels/`.

Ask before moving:

- `hermes/agents/ceo-dao.md`

### PR-D — Root markdown and skill index cleanup

Branch: `hermes/consolidation-d-root-docs-skills-2026-06-13`

Keep root by convention:

- `README.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CLAUDE.md`
- `AGENTS.md`
- `SKILLS.md`

Map loose markdown into `briefings/` or `docs/`:

- `ARCHITECTURE-HERMES.md` → `docs/architecture/hermes.md`
- `DAO and FOUNDER CAP.md` → `briefings/DAO-AND-FOUNDER-CAP.md`
- `GEMINI.md`, `GEMINI_STATE.md`, `GROK.md`, `PERPLEXITY.md` → `briefings/model-roster/`
- `hermes-config-improved-xai.md` → `docs/ops/hermes-config-improved-xai.md`
- `hermes.md`, `HERMES_MASTER_PROMPT_WHEEL_KANBAN_EXECUTION.md`, `OPUS-MASTER-BRIEFING-FULL-REPLACEMENT.md` → `briefings/legacy/` unless Joshua says otherwise.
- `IDENTITY.md`, `PULL_LOG.md`, `USER.md` → ask Joshua or archive under `briefings/legacy/`.

Create/update:

- `SKILLS.md` root-level index that points to canonical `skills/` and explains vendored Paperclip skills are not consolidated.

### PR-E — Retire legacy Paperweight

Branch: `hermes/consolidation-e-retire-paperweight-2026-06-13`

Move:

- `apps/paperweight/**` → `docs/archive/paperweight-retired-2026-06-13/`

Update references if needed:

- `pnpm-workspace.yaml`
- docs that mention `apps/paperweight`
- scripts or health probes that still start `apps/paperweight/paperweight.py`

Verification:

- `http://127.0.0.1:3100/api/health` must still resolve to WSL Paperclip version `2026.416.x`.

### PR-F — Split Mission Control public/operator surfaces

Branch: `hermes/consolidation-f-mission-control-split-2026-06-13`

Split `apps/mission-control/` into:

- public stream-safe surface
- sabretooth-local operator console

Fold in:

- `apps/mission-control/public/stream-paperclip.html`
- `apps/mission-control/public/stream-safe.html`
- `docs/operations/antigravity-one-root-mission-control-plan.md`

Hard requirements:

- Public surface must not display Hermes chat, RDP creds, internal IPs, hostnames, secret-touching memory, or operator-only state.
- Operator console may show local/internal state, but never in OBS stream capture.
- Add stream-mode banner and secret/canonical-term redaction gate before public capture.

### PR-G — Notion + Slack server-side proxy

Branch: `hermes/consolidation-g-public-feed-proxy-2026-06-13`

Add a server-side proxy for public feeds:

- Cloudflare Worker or sabretooth-local Node endpoint.
- Tokens sourced from vault/runtime env only.
- Browser calls only sanitized endpoints.
- Allowlist Notion page IDs and Slack channel IDs server-side.
- Cache with 5-minute TTL.

### PR-H — Paperclip company/CEO wiring

Branch: `hermes/consolidation-h-paperclip-companies-2026-06-13`

For each confirmed company:

- Create/verify company entity in WSL Paperclip via API.
- Register CEO agent from `hermes/agents/companies/{name}.md`.
- Log a HER issue for each company creation/verification.
- Report company ID and agent ID.

Confirmed companies before DAO decision:

- `youandinotai`
- `business-exchange`
- `onlinerecycle`
- `hermes-sideworld`

DAO is pending Joshua decision.

---

## Section D — Risks and open asks

### Ask Joshua before deciding

- Root `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md`: keep at root or move under `hermes/agents/`?
- `apps/opuspawclaw/TOOLS.md`: keep or retire?
- `docs/architecture/TOOLS.md` authored by Copilot: keep or retire?
- `hermes/agents/ceo-dao.md`: keep as a Paperclip company or fold under `hermes-sideworld`?
- `backend/legacy_modernizer_api.py`: keep or retire?
- Root `.agents/skills/` versus root `skills/`: Paperclip-compatible `.agents/skills` or canonical `skills/` as winner?
- Root `.claude/skills/`: leave for Claude Code convention or index/archive?
- `ceo-marketing.md`: archive or fold into `hermes-sideworld/channels/`?

### Three issues surfaced for Joshua

1. `HER-25`: Critical Stripe/payment drift may still exist. For dating surfaces, Square is the allowed processor; Stripe references/wiring need explicit founder review before edits.
2. `HER-13`: Claude/Ollama wording may be ambiguous. Joshua should clarify whether `ollama launch claude` is permitted only inside Paperclip and whether first-party Claude access remains unwrapped.
3. `HER-14`: `mission-control/SKILL.md` claims `100% working`. Under real-or-zero doctrine, this needs an honesty pass in PR-D or a separate PR-I.

### Dirty worktree risk

The repo had pre-existing dirty state before PR-A. PR-A must stage only its allowed paths. Do not accidentally include runtime data, Paperweight retirement changes, mission-control stream files, or unrelated API/probe changes.

---

## Section E — Verification gates

Every PR:

- Branch from `origin/main` on sabretooth.
- Use regular hooks; no `--no-verify`, no `--no-gpg-sign` without Joshua's explicit per-task override.
- Run tests/lint appropriate to touched files.
- Scan staged diff for secret values before commit.
- Keep customer-facing surfaces free of banned public language.
- Push only to `Trollz1004/ANTIGRAVITY`.

PR-A verification:

- `git status -sb` confirms vendored Paperclip edits are reverted.
- `.gitignore` contains `qdrant-data/`.
- `qdrant-data/*` is not staged.
- PR diff contains only plan/directive docs and `.gitignore` triage.

---

## Section F — Stop marker

Stop after PR-A. Do not proceed to PR-B until Joshua merges PR-A or relays Phase 3 go.

Expected completion message:

```text
[HERMES-CONSOLIDATION] Phase 2 complete:
- Plan doc: briefings/CONSOLIDATION-PLAN-2026-06-13.md
- PR-A: #XXX (status: open / awaiting CI / merged)
- Worktree triage: clean / dirty (list any remaining)
- HER-XX issues filed (for HER-25, HER-13, HER-14 surfacing if Joshua confirms)
- Decisions still open: [list]
- Next: Phase 3 PR-B (consolidate role files) once Joshua relays "go"

[STOP. Awaiting Joshua's go.]
```
