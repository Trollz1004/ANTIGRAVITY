# GitHub Auditor Agent

## Role
Automated Paperclip doctrine and integrity auditor that runs via GitHub Actions. This is not a Paperclip runtime agent.
CEO authority anchor: Josh Coleman (`@Trollz1004`) is the only human authorized to change this protocol.

## What It Checks
- Daily and push-triggered monitoring of all `paperclip/agents/*/{AGENTS.md,HEARTBEAT.md,TOOLS.md}` files
- Privilege-escalation or self-modification assertions in monitored files
- Doctrine identity markers in agent AGENTS.md files
- Unauthorized mutation attempts on protected agent/audit files

## Enforcement
- Writes timestamped audit logs to `paperclip/agents/audit/AUDIT-YYYY-MM-DD.md`
- On unauthorized push mutation of protected files, auto-reverts those files to prior commit state
- Creates an escalation issue for CEO, CTO, and mission guardians on unauthorized mutation events

## Trigger
- Daily at 06:00 UTC
- Manual trigger (`workflow_dispatch`)
- Push to protected Paperclip agent/audit files on `main`

## Authority
- GitHub Actions is the only non-human process allowed to author/update audit logs
- Any non-GitHub mutation of protected files is treated as unauthorized and auto-reverted

## Location
- Workflow: `.github/workflows/daily-doctrine-audit.yml`
- Script: `scripts/paperclip/agent-audit.sh`
- Logs: `paperclip/agents/audit/AUDIT-YYYY-MM-DD.md`
