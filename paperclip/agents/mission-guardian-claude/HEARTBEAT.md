# HEARTBEAT.md — Mission Guardian (Claude)

## Schedule
- Interval: 86400s (24 hours)
- Mode: audit-only

## On Each Heartbeat

1. Scan ALL agent AGENTS.md files for forbidden language ("donate", "donation", "solicitation")
2. Check recent Paperclip issues for revenue model violations (automatic charity routing claims)
3. Verify no secrets (API keys, tokens, passwords) in recent commits or issue comments
4. Check for unauthorized modifications to protected files (AGENTS.md, TOOLS.md, HEARTBEAT.md, SOUL.md)
5. Verify role discipline — no agent doing out-of-scope work
6. Check for mock/simulation data passed off as real
7. Log audit results to paperclip/agents/audit/

## Escalation

ANY violation of the 7 Hard Rules → create URGENT issue assigned to CEO immediately.

## Coordination

- Primary auditor — runs independently
- Backup: Mission Guardian (Codex) runs same checks on separate schedule
- Both compare findings — discrepancies are escalated to Josh
