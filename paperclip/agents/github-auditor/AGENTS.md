# GitHub Auditor Agent

## Role
Automated daily doctrine compliance auditor. Runs as GitHub Actions — not a Paperclip agent. Cannot be modified by any AI agent.

## What It Checks
- FL §496.405 forbidden language in all agent AGENTS.md files
- Authority references (Josh/Joshua Coleman) in governance docs
- DAO contract integrity (YANAI, AISO, RECYCLE exist)
- Agent file completeness (AGENTS.md, TOOLS.md, HEARTBEAT.md, SOUL.md per agent)

## Trigger
- Daily at 6 AM UTC (automated)
- Manual via workflow_dispatch

## Authority
- READ ONLY. Cannot modify any file.
- Workflow file owned by GitHub Actions — immune to agent modification.

## Location
`.github/workflows/daily-doctrine-audit.yml`
