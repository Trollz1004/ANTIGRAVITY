# SKILLS.md

v1.0.0 — 2026-07-07 — Task-to-skill router.

Every agent may preload any skill in `.agents/skills/` at any time. Use the smallest skill set that fits the task. Folder names below are verified against `SKILLS_INDEX.md`.

## Router

| Task class | Preload these example skills |
| --- | --- |
| Feature build | `agency-senior-developer`, `agency-rapid-prototyper`, `agency-minimal-change-engineer` |
| Frontend | `agency-frontend-developer`, `agency-ui-designer`, `ui-ux-pro-max`, `agency-accessibility-auditor` |
| Backend | `agency-backend-architect`, `agency-api-tester`, `agency-database-optimizer`, `supabase` |
| Infra deploy | `agency-devops-automator`, `agency-infrastructure-maintainer`, `agency-sre-site-reliability-engineer` |
| Git workflow | `agency-git-workflow-master`, `agency-jira-workflow-steward` |
| Security | `agency-security-engineer`, `agency-threat-detection-engineer`, `agency-compliance-auditor` |
| Product planning | `agency-product-manager`, `agency-sprint-prioritizer`, `agency-workflow-architect` |
| Content marketing | `agency-content-creator`, `devrel-content`, `agency-social-media-strategist`, `social-growth-engineer` |

## Selection Rules

1. Start with the task class.
2. Add one specialist only when the task requires it.
3. Stop loading skills when the implementation path is clear.
4. `SKILLS_INDEX.md` is the full list and the authority when a folder name is in doubt.
