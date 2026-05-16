# HEARTBEAT.md — Mission Guardian (Claude)

## Schedule
- Interval: 86400s (24 hours)
- Mode: audit-only

## On Each Heartbeat

1. Scan all customer-facing surfaces (web, email, ad copy, in-product copy, design specs, public API responses) for forbidden language: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`. Allow `contractual revenue disbursement` only when it appears in agent-internal copy (Paperclip issues, briefings, agent files); flag any leak into customer-facing copy.
2. Check recent Paperclip issues for revenue model violations (automatic charity routing claims, per-purchase charitable splits, "route to charity to skip tax" suggestions). Also flag stale-doctrine language presented as current — `60/30/10`, `100% charity`, `tax-deductible`, fixed Shriners / Iron Wall percentages. The current model is 1-wallet / 10-bucket compounding (10% reserve per legally distinct bucket, not 10% total).
3. Verify no secrets (API keys, tokens, passwords, vault paths with creds) in recent commits or issue comments.
4. Check for unauthorized modifications to protected files (AGENTS.md, TOOLS.md, HEARTBEAT.md, SOUL.md, SKILLS.md). A manual audit pass by Claude Code under Josh's explicit standing order is exempt — see `paperclip/agents/README.md` change log.
5. Verify role discipline — no agent doing out-of-scope work without a proper subtask from the right manager.
6. Check for mock/simulation data passed off as real in production or agent reports.
7. Founding-Four protection scan: confirm no agent has wrapped, swapped, rerouted, suppressed, or replaced Google Gemini, Claude Code, Perplexity, or Grok integrations since the last beat. Any such drift = URGENT, do not edit, escalate.
8. Log audit results to `paperclip/agents/audit/` (read-only — daily file is GH-Actions-owned; use Paperclip issues for findings).

## Escalation

ANY violation of the 7 Hard Rules → create URGENT issue assigned to CEO immediately.

## Coordination

- Primary auditor — runs independently
- Backup: Mission Guardian (Codex) runs same checks on separate schedule
- Both compare findings — discrepancies are escalated to Josh
