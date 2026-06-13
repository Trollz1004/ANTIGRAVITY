# Hermes Consolidation Audit — Share File for Opus/Coworker

Date: 2026-06-13
Authoring context: Hermes / GPT-5.5 Codex medium, acting under Joshua Coleman's authority.
Intended recipient: Opus in Coworker.
Active Hermes Desktop chat session: `organizing-antigravity-repo-root-2-20260612`
Canonical repo/root: `C:/antigravity`
Live board/control plane: WSL Paperclip at `/home/josh/.paperclip/instances/default`, UI/API `http://127.0.0.1:3100`

## Status

Phase 1 audit is complete. No Phase 2 plan/execution has started. No consolidation moves, deletes, commits, or PRs were made for this audit.

Joshua corrected the control-plane source of truth: stop chasing legacy `apps/paperweight` / old Windows Paperclip. The live Paperclip is the WSL instance:

```text
/home/josh/.paperclip/instances/default
http://127.0.0.1:3100
Paperclip health version: 2026.416.0
```

Earlier conflict was old Windows `apps/paperweight/paperweight.py` occupying port 3100. That process was killed, and Windows localhost now resolves to the WSL Paperclip health endpoint.

Created Paperclip issue:

```text
HER-33 — Organize ANTIGRAVITY root and node control plane
```

## Doctrine baseline

Read:

```text
briefings/FOUNDER-DOCTRINE-2026-05-19.md
```

Refusal paragraph confirmed:

```text
"This request would mutate FOUNDER DOCTRINE rule [N]. Per `briefings/FOUNDER-DOCTRINE-2026-05-19.md`, doctrine rules are immutable absent Joshua's explicit written rescission in a NEW timestamped doctrine file. I am refusing the request and surfacing the founder for review. — Claude session, [timestamp]"
```

No doctrine mutation requested or performed.

## 1. AGENTS.md files found

Count: 21

1. `AGENTS.md`
   - Size: `34,926`
   - Last commit author: `Opus`
   - Claims to govern: root ANTIGRAVITY multi-node doctrine / entrypoint.

2. `apps/paperclip/AGENTS.md`
   - Size: `12,038`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: Paperclip workspace contributors.

3. `apps/paperclip/packages/plugins/plugin-llm-wiki/agents/wiki-maintainer/AGENTS.md`
   - Size: `4,752`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: wiki-maintainer agent.

4. `apps/paperclip/packages/plugins/plugin-llm-wiki/fixtures/basic-root/AGENTS.md`
   - Size: `7,889`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: fixture wiki schema.

5. `apps/paperclip/packages/plugins/plugin-llm-wiki/templates/AGENTS.md`
   - Size: `7,889`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: template wiki schema.

6. `apps/paperclip/packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/agents/ceo/AGENTS.md`
   - Size: `2,543`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: bundled CEO agent.

7. `apps/paperclip/packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/agents/cto/AGENTS.md`
   - Size: `1,482`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: bundled CTO agent.

8. `apps/paperclip/packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/agents/qa/AGENTS.md`
   - Size: `1,338`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: bundled QA agent.

9. `apps/paperclip/packages/teams-catalog/catalog/bundled/product/product-design/agents/ux-designer/AGENTS.md`
   - Size: `2,181`
   - Nested Paperclip author: `Devin Foley`
   - Claims to govern: bundled UX designer agent.

10. `apps/paperclip/packages/teams-catalog/catalog/bundled/software-development/product-engineering/agents/cto/AGENTS.md`
    - Size: `1,533`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: bundled product-engineering CTO.

11. `apps/paperclip/packages/teams-catalog/catalog/bundled/software-development/product-engineering/agents/qa/AGENTS.md`
    - Size: `1,253`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: bundled product-engineering QA.

12. `apps/paperclip/packages/teams-catalog/catalog/bundled/software-development/product-engineering/agents/senior-coder/AGENTS.md`
    - Size: `1,448`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: bundled senior coder.

13. `apps/paperclip/packages/teams-catalog/catalog/optional/content/content-machine/agents/content-lead/AGENTS.md`
    - Size: `262`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: optional content lead.

14. `apps/paperclip/server/src/onboarding-assets/ceo/AGENTS.md`
    - Size: `4,313`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: Paperclip onboarding CEO persona.

15. `apps/paperclip/server/src/onboarding-assets/default/AGENTS.md`
    - Size: `3,063`
    - Nested Paperclip author: `Devin Foley`
    - Claims to govern: default Paperclip onboarding agent.

16. `hermes/agents/AGENTS.md`
    - Size: `6,925`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: Hermes agent fleet.

17. `hermes/agents/CFO/AGENTS.md`
    - Size: `254`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: CFO role.

18. `hermes/agents/CMO/AGENTS.md`
    - Size: `289`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: CMO role.

19. `hermes/agents/CSO/AGENTS.md`
    - Size: `364`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: CSO role.

20. `hermes/agents/CTO/AGENTS.md`
    - Size: `340`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: CTO role.

21. `hermes/agents/UX/AGENTS.md`
    - Size: `315`
    - Last commit author: `Joshua Coleman`
    - Claims to govern: UX role.

## 2. SKILL.md files found

Count: 68

```text
.agents/skills/mission-control/SKILL.md — 1,947
.agents/skills/payments/SKILL.md — 1,699
.agents/skills/revenue-model/SKILL.md — 2,861
.agents/skills/supabase/SKILL.md — 11,265
.agents/skills/supabase-postgres-best-practices/SKILL.md — 2,576
_9020-preserve/income-engine-CLAUDEs/SKILL.md — 7,724
apps/paperclip/.agents/skills/company-creator/SKILL.md — 12,594
apps/paperclip/.agents/skills/create-agent-adapter/SKILL.md — 32,844
apps/paperclip/.agents/skills/create-issue-interaction-ui/SKILL.md — 14,138
apps/paperclip/.agents/skills/deal-with-security-advisory/SKILL.md — 8,218
apps/paperclip/.agents/skills/diagnose-why-work-stopped/SKILL.md — 11,868
apps/paperclip/.agents/skills/doc-maintenance/SKILL.md — 6,987
apps/paperclip/.agents/skills/paperclip-create-plugin/SKILL.md — 6,873
apps/paperclip/.agents/skills/paperclip-dev-workspace-run-verify-fix/SKILL.md — 14,471
apps/paperclip/.agents/skills/pr-report/SKILL.md — 5,547
apps/paperclip/.agents/skills/prcheckloop/SKILL.md — 6,326
apps/paperclip/.agents/skills/release/SKILL.md — 7,002
apps/paperclip/.agents/skills/release-changelog/SKILL.md — 6,246
apps/paperclip/.agents/skills/release-changelog-discord-message/SKILL.md — 19,264
apps/paperclip/.agents/skills/terminal-bench-loop/SKILL.md — 25,889
apps/paperclip/.claude/skills/design-guide/SKILL.md — 13,033
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/index-refresh/SKILL.md — 4,177
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/paperclip-distill/SKILL.md — 11,493
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/wiki-ingest/SKILL.md — 3,916
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/wiki-lint/SKILL.md — 3,669
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/wiki-maintainer/SKILL.md — 1,031
apps/paperclip/packages/plugins/plugin-llm-wiki/skills/wiki-query/SKILL.md — 2,903
apps/paperclip/packages/skills-catalog/catalog/bundled/docs/doc-maintenance/SKILL.md — 4,553
apps/paperclip/packages/skills-catalog/catalog/bundled/paperclip-operations/issue-triage/SKILL.md — 4,116
apps/paperclip/packages/skills-catalog/catalog/bundled/paperclip-operations/task-planning/SKILL.md — 4,733
apps/paperclip/packages/skills-catalog/catalog/bundled/product/wireframe/SKILL.md — 12,080
apps/paperclip/packages/skills-catalog/catalog/bundled/quality/qa-acceptance/SKILL.md — 3,954
apps/paperclip/packages/skills-catalog/catalog/bundled/software-development/github-pr-workflow/SKILL.md — 4,063
apps/paperclip/packages/skills-catalog/catalog/optional/browser/agent-browser/SKILL.md — 5,226
apps/paperclip/packages/skills-catalog/catalog/optional/content/release-announcement/SKILL.md — 4,544
apps/paperclip/packages/skills-catalog/catalog/optional/product/design-critique/SKILL.md — 4,972
apps/paperclip/packages/teams-catalog/catalog/optional/content/content-machine/skills/content-calendar/SKILL.md — 352
apps/paperclip/skills/paperclip/SKILL.md — 35,317
apps/paperclip/skills/paperclip-board/SKILL.md — 22,231
apps/paperclip/skills/paperclip-converting-plans-to-tasks/SKILL.md — 3,739
apps/paperclip/skills/paperclip-create-agent/SKILL.md — 7,691
apps/paperclip/skills/paperclip-dev/SKILL.md — 13,454
apps/paperclip/skills/para-memory-files/SKILL.md — 4,082
income-engine/paperclip/skills/ceo/heartbeat/SKILL.md — 1,131
income-engine/paperclip/skills/ceo/SKILL.md — 2,046
income-engine/paperclip/skills/ceo/tools/fetcher-trigger/SKILL.md — 766
income-engine/paperclip/skills/ceo/tools/lead-scanner/SKILL.md — 1,149
income-engine/paperclip/skills/ceo/tools/model-router/SKILL.md — 1,032
income-engine/paperclip/skills/cfo/heartbeat/SKILL.md — 1,039
income-engine/paperclip/skills/cfo/SKILL.md — 1,158
income-engine/paperclip/skills/cfo/tools/cost-tracker/SKILL.md — 1,177
income-engine/paperclip/skills/cmo/heartbeat/SKILL.md — 1,376
income-engine/paperclip/skills/cmo/SKILL.md — 1,372
income-engine/paperclip/skills/cmo/tools/buyer-outreach/SKILL.md — 2,141
income-engine/paperclip/skills/cto/heartbeat/SKILL.md — 1,026
income-engine/paperclip/skills/cto/SKILL.md — 1,340
income-engine/paperclip/skills/cto/tools/code-review/SKILL.md — 1,561
income-engine/paperclip/skills/fetcher/heartbeat/SKILL.md — 692
income-engine/paperclip/skills/fetcher/SKILL.md — 1,433
income-engine/paperclip/skills/shared/SKILL.md — 1,209
income-engine/paperclip-data/.agents/skills/agent-browser/SKILL.md — 2,904
income-engine/skills/graph-knowledge/SKILL.md — 1,796
mission-control/SKILL.md — 9,229
skills/antigravity-doctrine/SKILL.md — 3,810
skills/antigravity-mission-orchestrator/SKILL.md — 10,597
skills/mission-control/SKILL.md — 1,947
skills/payments/SKILL.md — 1,699
skills/revenue-model/SKILL.md — 2,861
```

## 3. ceo-*.md files found

Count: 11

```text
briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md — 11,689
hermes/agents/ceo-ai-solutions.md — 1,338
hermes/agents/ceo-business-exchange.md — 1,675
hermes/agents/ceo-dao.md — 1,100
hermes/agents/ceo-hermes-sideworld.md — 1,746
hermes/agents/ceo-marketing.md — 1,695
hermes/agents/ceo-onlinerecycle.md — 1,359
hermes/agents/ceo-youandinotai.md — 1,677
hermes/agents/ceo-youtube.md — 1,669
income-engine/agents/ceo-orchestrator.md — 1,611
memory/ceo-heartbeat-summary-2026-04-16.md — 1,985
```

Companies covered by existing `hermes/agents/ceo-*.md`:

- `youandinotai`
- `business-exchange`
- `ai-solutions`
- `hermes-sideworld`
- `onlinerecycle`
- extra/legacy: `dao`, `marketing`, `youtube`

Missing relative to the four explicitly named core companies: none.

But the company CEO files are flat under `hermes/agents/`, not canonical `hermes/agents/companies/{name}.md`.

Open decision: `onlinerecycle` already has a CEO file, but Joshua/Claude marked its placement as a Phase-2 decision.

## 4. .skill bundles / skills directories

`.skill` zipped bundles found: 0

`skills/` directories found: 12

```text
.agents/skills
.claude/skills
apps/paperclip/.agents/skills
apps/paperclip/.claude/skills
apps/paperclip/packages/plugins/plugin-llm-wiki/skills
apps/paperclip/packages/teams-catalog/catalog/optional/content/content-machine/skills
apps/paperclip/skills
ClawX/skills
income-engine/paperclip/skills
income-engine/paperclip-data/.agents/skills
income-engine/skills
skills
```

## 5. MEMORY / SOUL / HEARTBEAT / TOOLS files

Count: 21

```text
apps/opuspawclaw/TOOLS.md — 614 — Joshua Coleman
apps/paperclip/server/src/onboarding-assets/ceo/HEARTBEAT.md — 4,962 — Paperclip nested author Devin Foley
apps/paperclip/server/src/onboarding-assets/ceo/SOUL.md — 2,623 — Paperclip nested author Devin Foley
apps/paperclip/server/src/onboarding-assets/ceo/TOOLS.md — 89 — Paperclip nested author Devin Foley
docs/architecture/TOOLS.md — 3,554 — Copilot
HEARTBEAT.md — 168 — Joshua Coleman
hermes/agents/CFO/HEARTBEAT.md — 206 — Joshua Coleman
hermes/agents/CFO/TOOLS.md — 787 — Joshua Coleman
hermes/agents/CMO/HEARTBEAT.md — 295 — Joshua Coleman
hermes/agents/CMO/TOOLS.md — 1,556 — Joshua Coleman
hermes/agents/CSO/HEARTBEAT.md — 247 — Joshua Coleman
hermes/agents/CSO/TOOLS.md — 1,791 — Joshua Coleman
hermes/agents/CTO/HEARTBEAT.md — 305 — Joshua Coleman
hermes/agents/CTO/TOOLS.md — 2,286 — Joshua Coleman
hermes/agents/HEARTBEAT.md — 4,779 — Joshua Coleman
hermes/agents/SOUL.md — 3,627 — Joshua Coleman
hermes/agents/TOOLS.md — 2,295 — Joshua Coleman
hermes/agents/UX/HEARTBEAT.md — 264 — Joshua Coleman
hermes/agents/UX/TOOLS.md — 1,690 — Joshua Coleman
SOUL.md — 1,747 — Joshua Coleman
TOOLS.md — 1,798 — Joshua Coleman
```

Agent ownership by path:

- Root: `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md`
- Hermes fleet: `hermes/agents/*`
- Hermes role agents: `hermes/agents/CFO`, `CMO`, `CSO`, `CTO`, `UX`
- Paperclip onboarding CEO: `apps/paperclip/server/src/onboarding-assets/ceo/*`
- Other legacy/tooling: `apps/opuspawclaw/TOOLS.md`, `docs/architecture/TOOLS.md`

No exact `MEMORY.md` filename found in repo tree.

## 6. Root-level loose Markdown likely belonging in briefings/ or docs/

Count: 20

```text
agent.md — 7,529
ARCHITECTURE-HERMES.md — 4,180
CHANGELOG.md — 1,622
CONTRIBUTING.md — 20,153
DAO and FOUNDER CAP.md — 4,339
GEMINI.md — 8,485
GEMINI_STATE.md — 4,072
GROK.md — 8,271
HEARTBEAT.md — 168
hermes-config-improved-xai.md — 2,656
hermes.md — 13,514
HERMES_MASTER_PROMPT_WHEEL_KANBAN_EXECUTION.md — 5,027
IDENTITY.md — 723
OPUS-MASTER-BRIEFING-FULL-REPLACEMENT.md — 14,863
PERPLEXITY.md — 2,621
PULL_LOG.md — 3,703
SECURITY.md — 2,965
SOUL.md — 1,747
TOOLS.md — 1,798
USER.md — 558
```

Note: `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` can reasonably stay root depending on policy. The rest look like likely briefing/docs/agent-state material.

## 7. Paperclip workspace state

Live system of record:

```text
/home/josh/.paperclip/instances/default
```

Health:

```json
{
  "status": "ok",
  "version": "2026.416.0",
  "deploymentMode": "local_trusted",
  "deploymentExposure": "private",
  "authReady": true,
  "bootstrapStatus": "ready",
  "bootstrapInviteActive": false,
  "features": {
    "companyDeletionEnabled": true
  }
}
```

Port 3100:

- Old conflict was Windows `apps/paperweight/paperweight.py`.
- Current `http://127.0.0.1:3100/api/health` returns WSL Paperclip `2026.416.0`.

`apps/paperclip` workspace exists:

```text
C:/antigravity/apps/paperclip
apps/paperclip/package.json name: paperclip
apps/paperclip/server/package.json name: @paperclipai/server
apps/paperclip/packages/db/package.json name: @paperclipai/db
```

Nested Paperclip pnpm workspace includes:

```text
packages:
  - packages/*
  - packages/adapters/*
  - packages/plugins/*
  - server
  - ui
  - cli
```

Root `C:/antigravity/pnpm-workspace.yaml` includes:

```text
packages:
  - 'apps/*'
  - 'services/*'
  - 'tools/*'
```

Legacy deprecation target:

```text
apps/paperweight/
apps/paperweight/paperweight.py
```

## 8. Open HER issues in live Paperclip

HER company:

```text
fed73810-8536-4694-acea-9a4080a15fbd — Hermes Side World
```

Open/not-closed HER issues count: 27

```text
HER-5 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-6 | blocked | high | CTO: Quality & Activity Check - Heartbeat Health
HER-7 | blocked | high | ENGINEER: Quality & Activity Check - Task Progress
HER-9 | blocked | high | CFO: Quality & Activity Check - Initial Heartbeat
HER-10 | blocked | high | Joshua (DevOps): Quality & Activity Check - Ops Health
HER-11 | blocked | medium | set up all adapters for best usage
HER-12 | blocked | medium | Wire Hermes (Nemotron/Nous) support-tier probes into HER-5 loop
HER-13 | blocked | high | Lock Hermes model roster: MiniMax-M3 primary, ollama-wrapper fallback chain, Claude banned except via ollama launch claude inside Paperclip
HER-14 | blocked | high | Doctrine drift: mission-control SKILL.md claims 100% working — not accurate
HER-15 | blocked | critical | Recover OpenClaw build context — missing from /mnt/openclaw/
HER-16 | blocked | high | Codex-Max-Sub auth landed — primary is gpt-5.5 via openai-codex, fallback minimax-m3:cloud via ollama-cloud
HER-17 | in_review | high | CMO: Strategic Marketing Plan & Go-to-Market Strategy
HER-18 | blocked | critical | 24/7 operations set heart beat to every 10 mins make sure all agents working
HER-19 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-20 | blocked | critical | use nous research on hermes
HER-21 | blocked | high | Fallback chain empty — needs manual 'hermes fallback add' in a real TTY to restore
HER-22 | blocked | critical | AFK 24/7 operations watchdog active
HER-23 | blocked | critical | Doctrine police active — protect kids mission
HER-24 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-25 | blocked | critical | Doctrine police incident: active Stripe/payment drift remains after noise pruning
HER-27 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-28 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-29 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-30 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-31 | blocked | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-32 | in_progress | medium | every 30 mins YOU Quality / activity check create new issues tasks routines for all agents always 24/7
HER-33 | todo | high | Organize ANTIGRAVITY root and node control plane
```

## 9. Current worktree warning

Current repo is dirty before any Phase-2 work. Relevant status includes:

```text
A  apps/mission-control/public/stream-paperclip.html
A  apps/mission-control/public/stream-safe.html
Am apps/paperclip
M  apps/paperweight/data/paperweight.db
M  apps/paperweight/paperweight.py
M  apps/paperweight/static/index.html
M  apps/paperweight/test_paperweight.py
A  docs/archive/root-cleanup-2026-06-12/README.md
A  docs/operations/antigravity-one-root-mission-control-plan.md
M  hermes/agents/AGENTS.md
A  hermes/agents/ceo-business-exchange.md
A  hermes/agents/ceo-hermes-sideworld.md
A  qdrant-data/aliases/data.json
A  qdrant-data/raft_state.json
?? backend/legacy_modernizer_api.py
?? briefings/HERMES-CONSOLIDATION-DIRECTIVE-2026-06-13.md
```

Inside `apps/paperclip` specifically:

```text
M AGENTS.md
M packages/db/src/client.ts
```

Important: `packages/db/src/client.ts` is dirty from an interrupted migration-repair attempt before Joshua corrected course. It should be cleaned/reverted or handled explicitly before any consolidation PR.

## 10. Summary / blocked decisions / next

What changed in Phase 1:

- No planned consolidation writes.
- No commits.
- No PRs.
- Audit only.

Warnings:

- Worktree is already dirty from previous work and prior root cleanup.
- `apps/paperclip/packages/db/src/client.ts` is dirty and should not be carried into consolidation accidentally.
- Old Windows Paperweight is confirmed as a deprecation target, not the live system.

Blocked decisions for Joshua / Claude plan phase:

- Whether `onlinerecycle` becomes a separate Paperclip company or folds into `business-exchange`.
- Whether `ai-solutions` remains a company or becomes a catalog/data source feeding `business-exchange`.
- Whether Paperclip's vendored internal AGENTS/SKILL files should remain inside `apps/paperclip` as upstream/vendor material, versus only indexing them from root.
- Whether current dirty worktree should be reverted/stashed before Phase 2 plan file.

Next if Joshua says go:

- Phase 2 only: write `briefings/CONSOLIDATION-PLAN-2026-06-13.md`.
- No moves/deletes/commits beyond the plan doc until approved.

Memory note:

- Live board is WSL Paperclip at `/home/josh/.paperclip/instances/default`.
- Old Windows Paperweight is legacy and not the system of record.

## Stop marker

STOP. Awaiting Joshua's go.
