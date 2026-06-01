# DIRTY REPO ALERT — C:\ANTIGRAVITY

**Generated:** 2026-06-01T22:04:33.733208+00:00
**Repo:** C:\ANTIGRAVITY (WSL: /mnt/c/ANTIGRAVITY)
**Trigger:** Scheduled cron check; Discord delivery unavailable; local file is the durable alert.

---

## ALERT

**ALERT: Repo C:\ANTIGRAVITY is dirty. Run 'git status' to review changes.**

DO NOT auto-commit. Review and stage/commit manually.

---

## Why this file exists

- Pre-flight: `hermes send --list discord` reported "No messaging platforms configured or no channels discovered yet."
- `channel_directory.json` has no Discord channels registered.
- Discord gateway pre-flights indicate paused / failed to reconnect state.
- This file is the fallback persistent alert (per `local-platform-bootstrap` skill).

---

## Uncommitted changes (git status --porcelain output as of 2026-06-01 22:04:33 UTC

```
 M .agents/skills/supabase-postgres-best-practices/SKILL.md
 M .agents/skills/supabase-postgres-best-practices/references/_contributing.md
 M .agents/skills/supabase-postgres-best-practices/references/_sections.md
 M .agents/skills/supabase-postgres-best-practices/references/_template.md
 M .agents/skills/supabase-postgres-best-practices/references/advanced-full-text-search.md
 M .agents/skills/supabase-postgres-best-practices/references/advanced-jsonb-indexing.md
 M .agents/skills/supabase-postgres-best-practices/references/conn-idle-timeout.md
 M .agents/skills/supabase-postgres-best-practices/references/conn-limits.md
 M .agents/skills/supabase-postgres-best-practices/references/conn-pooling.md
 M .agents/skills/supabase-postgres-best-practices/references/conn-prepared-statements.md
 M .agents/skills/supabase-postgres-best-practices/references/data-batch-inserts.md
 M .agents/skills/supabase-postgres-best-practices/references/data-n-plus-one.md
 M .agents/skills/supabase-postgres-best-practices/references/data-pagination.md
 M .agents/skills/supabase-postgres-best-practices/references/data-upsert.md
 M .agents/skills/supabase-postgres-best-practices/references/lock-advisory.md
 M .agents/skills/supabase-postgres-best-practices/references/lock-deadlock-prevention.md
 M .agents/skills/supabase-postgres-best-practices/references/lock-short-transactions.md
 M .agents/skills/supabase-postgres-best-practices/references/lock-skip-locked.md
 M .agents/skills/supabase-postgres-best-practices/references/monitor-explain-analyze.md
 M .agents/skills/supabase-postgres-best-practices/references/monitor-pg-stat-statements.md
 M .agents/skills/supabase-postgres-best-practices/references/monitor-vacuum-analyze.md
 M .agents/skills/supabase-postgres-best-practices/references/query-composite-indexes.md
 M .agents/skills/supabase-postgres-best-practices/references/query-covering-indexes.md
 M .agents/skills/supabase-postgres-best-practices/references/query-index-types.md
 M .agents/skills/supabase-postgres-best-practices/references/query-missing-indexes.md
 M .agents/skills/supabase-postgres-best-practices/references/query-partial-indexes.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-constraints.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-data-types.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-foreign-key-indexes.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-lowercase-identifiers.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-partitioning.md
 M .agents/skills/supabase-postgres-best-practices/references/schema-primary-keys.md
 M .agents/skills/supabase-postgres-best-practices/references/security-privileges.md
 M .agents/skills/supabase-postgres-best-practices/references/security-rls-basics.md
 M .agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md
 M .agents/skills/supabase/SKILL.md
 M .agents/skills/supabase/assets/feedback-issue-template.md
 M .agents/skills/supabase/references/skill-feedback.md
 M .gitignore
 M CLAUDE.md
 M "DAO and FOUNDER CAP.md"
 M DIRTY_REPO_ALERT.md
 M GEMINI.md
 M GEMINI_STATE.md
 M GROK.md
 M HERMES_MASTER_PROMPT_WHEEL_KANBAN_EXECUTION.md
 M IDENTITY.md
 M OPUS-MASTER-BRIEFING-FULL-REPLACEMENT.md
 M USER.md
 M _handoff-staging-2026-05-26/_deploy/opushashands/index.html
 M agent.md
 M antigravity/app/page.tsx
 M antigravity/components/CharitySection.tsx
 M apps/mission-control/index.html
 M apps/youandinotai-frontend/app/page.tsx
 M apps/youandinotai-frontend/components/CharitySection.tsx
 M briefings/BUSINESS-PROFILE-CANONICAL.md
 M briefings/CLAUDE-DOCTRINE.md
 M briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md
 M briefings/DAO-TOKENOMICS-FINAL.md
 M briefings/JOSHUAGOSPEL-GROK-HAS-HANDS-2026-05-30.md
 M briefings/MERCH-CHARITY-LOGIC.md
 M briefings/MISSION-CONTROL-ADAPTERS-2026-06-01.md
 M briefings/archive/COPILOT-MEMORY.md
 M briefings/archive/DEPLOYMENT_LOG.md
 M briefings/archive/DIRTY_REPO_ALERT.md
 M briefings/archive/DOCKER-SETUP.md
 M briefings/archive/MISSION_CONTROL_DASHBOARD-manus-orig-20260601-134100.html
 M briefings/archive/ONBOARDING.md
 M briefings/archive/OPENCODE-MEMORY.md
 M briefings/archive/SABRETOOTH-PREWIPE.md
 M briefings/archive/SECURITY_AUDIT.md
 M briefings/archive/T5500-CONSOLIDATION.md
 M campaign-deliverables/marketing-campaign-plan.md
 M campaign-deliverables/payment-flow-verification.md
 M campaign-deliverables/social-platform-api-audit.md
 M contracts/src/CharityRouter100.sol
 M contracts/src/DatingRevenueRouter.sol
 M contracts/src/GospelDonation.sol
 M contracts/src/MissionTreasury.sol
 M contracts/src/PlatformSplitter.sol
 M contracts/src/PlatformSplitter10.sol
 M data/post-queue-dao-launch.json
 M frontend/react-app/src/components/CharitySection.tsx
 M frontend/react-app/src/components/CharityTab.tsx
 M hermes-config-improved-xai.md
 M hermes-config.json
 M hermes.md
 M hermes/agents/CLOSER-SUBMISSION-PACKAGER.md
 M hermes/agents/HERMES-REVENUE-SCOUT.md
 M memory/decisions.md
 M memory/identity.md
 M mission-control/0001_futuristic_guardian.sql
 M mission-control/ABOUT.md
 M mission-control/App.tsx
 M mission-control/CLAUDE.md
 M mission-control/CLAUDE_CODE_STRATEGIC_PROMPT.md
 M mission-control/CREDITS.md
 M mission-control/DELIVERY_MANIFEST.md
 M mission-control/DEPLOYMENT_GUIDE.md
 M "mission-control/HERMES + MANUS ARCHITECTURE \342\200\224 Refined.md"
 M "mission-control/HERMES KANBAN MASTER SETUP PROMPT.md"
 M "mission-control/HERMES KANBAN SETUP PROMPT.md"
 M "mission-control/HERMES SETUP PROMPT \342\200\224 Manus API Multi-Provider Orchestration + Financial Compliance.md"
 M mission-control/IMPLEMENTATION_GUIDE.md
 M mission-control/INCOME_ENGINE_ENV.example
 M mission-control/INCOME_ENGINE_GITHUB.md
 M mission-control/INCOME_ENGINE_PAPERCLIP.md
 M mission-control/INTEGRATION_GUIDE.md
 M mission-control/JOSHUA_COLEMAN_MEMORY.md
 M mission-control/LICENSE
 M mission-control/OPENCLAW_README.md
 M mission-control/PAPERCLIP_INTEGRATION.md
 M "mission-control/PAYMENT PROCESSING GUIDE.md"
 M mission-control/PaperclipIntegration.tsx
 M mission-control/README.md
 M mission-control/README_OPENCLAW.md
 M mission-control/SKILL.md
 M mission-control/Settings.tsx
 M mission-control/TaskAssignmentPanel.tsx
 M mission-control/Workspace.tsx
 M mission-control/db.ts
 M mission-control/fetcherAgent.ts
 M mission-control/hermesAdapter.test.ts
 M mission-control/hermesAdapter.ts
 M mission-control/imageGeneration.ts
 M mission-control/index.css
 M mission-control/issues.md
 M mission-control/modelProvider.test.ts
 M mission-control/modelProvider.ts
 M mission-control/ollamaCloud.ts
 M mission-control/package.json
 M mission-control/paperclipIntegration.ts
 M mission-control/routers.ts
 M mission-control/schema.ts
 M mission-control/task.create.mdx
 M mission-control/todo.md
 M package.json
 M paperclip/agents/audit/AUDIT-2026-05-30.md
 M paperclip/agents/audit/AUDIT-2026-05-31.md
 M paperclip/agents/audit/AUDIT-2026-06-01.md
 M pnpm-lock.yaml
 M services/mission-control-backend/KANBAN_STATE_LOGGER.py
 M services/mission-control-backend/README.md
 M services/mission-control-backend/SABRETOOTH_FAILSAFE.py
 M services/mission-control-backend/T5500_CREDIT_MONITOR.py
 M services/mission-mcp/package-lock.json
 M services/mission-mcp/package.json
 M skills-lock.json
 D test_result.md
?? "@NO PLACEHOLDERS LIVE PRODUCTION FULL CODE ONLY  g.md"
?? mission-control/pasted_content.txt
?? mission-control/pasted_content_2.txt
?? mission-control/pasted_content_3.txt
?? mission-control/pasted_file_MCPBht_image.png
?? mission-control/pasted_file_NY8Q5v_image.png
?? mission-control/pasted_file_Ry74vT_image.png
?? "soundtrack 2.mp4"
?? soundtrack.mp4
?? soundtrack0.mp4
?? tmp/
```

---

## Diff vs. prior alert

- Total current dirty items (excluding this alert file): **160**
- Total previous dirty items (excluding this alert file): **82**
- New items since last alert: **122**
- Resolved items since last alert: **44**


### New since last alert
```
?? mission-control/pasted_content.txt
?? mission-control/pasted_content_2.txt
?? mission-control/pasted_content_3.txt
?? mission-control/pasted_file_MCPBht_image.png
?? mission-control/pasted_file_NY8Q5v_image.png
?? mission-control/pasted_file_Ry74vT_image.png
M "mission-control/HERMES + MANUS ARCHITECTURE \342\200\224 Refined.md"
M "mission-control/HERMES KANBAN MASTER SETUP PROMPT.md"
M "mission-control/HERMES KANBAN SETUP PROMPT.md"
M "mission-control/HERMES SETUP PROMPT \342\200\224 Manus API Multi-Provider Orchestration + Financial Compliance.md"
M "mission-control/PAYMENT PROCESSING GUIDE.md"
M .agents/skills/supabase-postgres-best-practices/SKILL.md
M .agents/skills/supabase-postgres-best-practices/references/_contributing.md
M .agents/skills/supabase-postgres-best-practices/references/_sections.md
M .agents/skills/supabase-postgres-best-practices/references/_template.md
M .agents/skills/supabase-postgres-best-practices/references/advanced-full-text-search.md
M .agents/skills/supabase-postgres-best-practices/references/advanced-jsonb-indexing.md
M .agents/skills/supabase-postgres-best-practices/references/conn-idle-timeout.md
M .agents/skills/supabase-postgres-best-practices/references/conn-limits.md
M .agents/skills/supabase-postgres-best-practices/references/conn-pooling.md
M .agents/skills/supabase-postgres-best-practices/references/conn-prepared-statements.md
M .agents/skills/supabase-postgres-best-practices/references/data-batch-inserts.md
M .agents/skills/supabase-postgres-best-practices/references/data-n-plus-one.md
M .agents/skills/supabase-postgres-best-practices/references/data-pagination.md
M .agents/skills/supabase-postgres-best-practices/references/data-upsert.md
M .agents/skills/supabase-postgres-best-practices/references/lock-advisory.md
M .agents/skills/supabase-postgres-best-practices/references/lock-deadlock-prevention.md
M .agents/skills/supabase-postgres-best-practices/references/lock-short-transactions.md
M .agents/skills/supabase-postgres-best-practices/references/lock-skip-locked.md
M .agents/skills/supabase-postgres-best-practices/references/monitor-explain-analyze.md
M .agents/skills/supabase-postgres-best-practices/references/monitor-pg-stat-statements.md
M .agents/skills/supabase-postgres-best-practices/references/monitor-vacuum-analyze.md
M .agents/skills/supabase-postgres-best-practices/references/query-composite-indexes.md
M .agents/skills/supabase-postgres-best-practices/references/query-covering-indexes.md
M .agents/skills/supabase-postgres-best-practices/references/query-index-types.md
M .agents/skills/supabase-postgres-best-practices/references/query-missing-indexes.md
M .agents/skills/supabase-postgres-best-practices/references/query-partial-indexes.md
M .agents/skills/supabase-postgres-best-practices/references/schema-constraints.md
M .agents/skills/supabase-postgres-best-practices/references/schema-data-types.md
M .agents/skills/supabase-postgres-best-practices/references/schema-foreign-key-indexes.md
M .agents/skills/supabase-postgres-best-practices/references/schema-lowercase-identifiers.md
M .agents/skills/supabase-postgres-best-practices/references/schema-partitioning.md
M .agents/skills/supabase-postgres-best-practices/references/schema-primary-keys.md
M .agents/skills/supabase-postgres-best-practices/references/security-privileges.md
M .agents/skills/supabase-postgres-best-practices/references/security-rls-basics.md
M .agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md
M .agents/skills/supabase/SKILL.md
M .agents/skills/supabase/assets/feedback-issue-template.md
M .agents/skills/supabase/references/skill-feedback.md
M GEMINI.md
M GEMINI_STATE.md
M GROK.md
M OPUS-MASTER-BRIEFING-FULL-REPLACEMENT.md
M agent.md
M briefings/JOSHUAGOSPEL-GROK-HAS-HANDS-2026-05-30.md
M briefings/MISSION-CONTROL-ADAPTERS-2026-06-01.md
M briefings/archive/COPILOT-MEMORY.md
M briefings/archive/DEPLOYMENT_LOG.md
M briefings/archive/DIRTY_REPO_ALERT.md
M briefings/archive/DOCKER-SETUP.md
M briefings/archive/MISSION_CONTROL_DASHBOARD-manus-orig-20260601-134100.html
M briefings/archive/ONBOARDING.md
M briefings/archive/OPENCODE-MEMORY.md
M briefings/archive/SABRETOOTH-PREWIPE.md
M briefings/archive/SECURITY_AUDIT.md
M briefings/archive/T5500-CONSOLIDATION.md
M campaign-deliverables/marketing-campaign-plan.md
M campaign-deliverables/payment-flow-verification.md
M campaign-deliverables/social-platform-api-audit.md
M data/post-queue-dao-launch.json
M hermes-config-improved-xai.md
M hermes-config.json
M hermes.md
M hermes/agents/CLOSER-SUBMISSION-PACKAGER.md
M hermes/agents/HERMES-REVENUE-SCOUT.md
M mission-control/0001_futuristic_guardian.sql
M mission-control/ABOUT.md
M mission-control/App.tsx
M mission-control/CLAUDE.md
M mission-control/CLAUDE_CODE_STRATEGIC_PROMPT.md
M mission-control/CREDITS.md
M mission-control/DELIVERY_MANIFEST.md
M mission-control/DEPLOYMENT_GUIDE.md
M mission-control/IMPLEMENTATION_GUIDE.md
M mission-control/INCOME_ENGINE_ENV.example
M mission-control/INCOME_ENGINE_GITHUB.md
M mission-control/INCOME_ENGINE_PAPERCLIP.md
M mission-control/INTEGRATION_GUIDE.md
M mission-control/JOSHUA_COLEMAN_MEMORY.md
M mission-control/LICENSE
M mission-control/OPENCLAW_README.md
M mission-control/PAPERCLIP_INTEGRATION.md
M mission-control/PaperclipIntegration.tsx
M mission-control/README.md
M mission-control/README_OPENCLAW.md
M mission-control/SKILL.md
M mission-control/Settings.tsx
M mission-control/TaskAssignmentPanel.tsx
M mission-control/Workspace.tsx
M mission-control/db.ts
M mission-control/fetcherAgent.ts
M mission-control/hermesAdapter.test.ts
M mission-control/hermesAdapter.ts
M mission-control/imageGeneration.ts
M mission-control/index.css
M mission-control/issues.md
M mission-control/modelProvider.test.ts
M mission-control/modelProvider.ts
M mission-control/ollamaCloud.ts
M mission-control/package.json
M mission-control/paperclipIntegration.ts
M mission-control/routers.ts
M mission-control/schema.ts
M mission-control/task.create.mdx
M mission-control/todo.md
M paperclip/agents/audit/AUDIT-2026-05-31.md
M paperclip/agents/audit/AUDIT-2026-06-01.md
M services/mission-control-backend/KANBAN_STATE_LOGGER.py
M services/mission-control-backend/README.md
M services/mission-control-backend/SABRETOOTH_FAILSAFE.py
M services/mission-control-backend/T5500_CREDIT_MONITOR.py
M skills-lock.json
```

### Resolved since last alert
```
?? .agents/
?? GEMINI_STATE.md
?? OPUS-MASTER-BRIEFING-FULL-REPLACEMENT.md
?? briefings/JOSHUAGOSPEL-GROK-HAS-HANDS-2026-05-30.md
?? briefings/archive/COPILOT-MEMORY.md
?? briefings/archive/DEPLOYMENT_LOG.md
?? briefings/archive/DIRTY_REPO_ALERT.md
?? briefings/archive/DOCKER-SETUP.md
?? briefings/archive/MISSION_CONTROL_DASHBOARD-manus-orig-20260601-134100.html
?? briefings/archive/ONBOARDING.md
?? briefings/archive/OPENCODE-MEMORY.md
?? briefings/archive/SABRETOOTH-PREWIPE.md
?? briefings/archive/SECURITY_AUDIT.md
?? briefings/archive/T5500-CONSOLIDATION.md
?? campaign-deliverables/marketing-campaign-plan.md
?? campaign-deliverables/payment-flow-verification.md
?? campaign-deliverables/social-platform-api-audit.md
?? data/post-queue-dao-launch.json
?? hermes-config-improved-xai.md
?? hermes-config.json
?? hermes.md
?? hermes/agents/CLOSER-SUBMISSION-PACKAGER.md
?? hermes/agents/HERMES-REVENUE-SCOUT.md
?? mission-control-manus.bundle
?? mission-control/
?? scripts/bootstrap-grok-9020.ps1
?? scripts/bootstrap-grok-t5500.ps1
?? services/mission-control-backend/
?? skills-lock.json
D "in the heart of the street. Bro the broke, I feel.md"
D COPILOT-MEMORY.md
D DEPLOYMENT_LOG.md
D DOCKER-SETUP.md
D HIRING_PLAN.md
D ONBOARDING.md
D OPENCODE-MEMORY.md
D PLATFORM-LIVE-STATUS-GEMINI-APPROVED.md
D ROADMAP.md
D SABRETOOTH-PREWIPE.md
D SECURITY_AUDIT.md
D T5500-CONSOLIDATION.md
D hermes_short_scan.txt
M AGENTS.md
M logs/watchdog-boot-marker.txt
```

---

## How to clear this alert

1. Review the changes: `cd /mnt/c/ANTIGRAVITY && git status`
2. Stage & commit: `git add -A && git commit -m "..."`
3. Delete this file once the repo is clean: `rm /mnt/c/ANTIGRAVITY/DIRTY_REPO_ALERT.md`

---

*This is an automated alert. DO NOT auto-commit.*
