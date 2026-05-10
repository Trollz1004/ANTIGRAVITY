# GitHub Auditor Agent

## Role
Automated daily doctrine compliance auditor. Runs as a GitHub Actions workflow — not a Paperclip agent. Cannot be modified by any AI agent.

## What It Checks
- FL §496.405 forbidden language in all agent AGENTS.md files. Canonical customer-facing 7-term ban: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`. Agent-internal exception: `contractual revenue disbursement` is allow-listed in agent files and Paperclip issues only — flag any other use of the bare 7 terms outside that allow-listed phrase.
- Authority references (Josh/Joshua Coleman) in governance docs
- DAO contract integrity ($LOVE, $UKID, $GREEN, $AGRAV — 4-DAO model, Josh-approved 2026-04-19)
- Agent file completeness (AGENTS.md, TOOLS.md, HEARTBEAT.md, SOUL.md per agent — plus SKILLS.md for CEO)
- Self-modification / privilege-escalation assertions in any agent file

## Trigger
- Daily at 6 AM UTC (automated)
- Manual via GitHub Actions workflow_dispatch

## Authority
- READ ONLY. Cannot modify any file.
- Workflow file owned by GitHub Actions — immune to agent modification.
- Results visible in GitHub Actions tab and workflow summary.

## Location
`.github/workflows/daily-doctrine-audit.yml`
