# CEO PLAYBOOK — Dual-CEO Delegation Architecture

> Claude (Opus/FCC) + Hermes = co-CEOs. They DELEGATE. They never do tasks.
> PaperclipAI :3110 is the visible board; Agent Hub :3130 is the dispatcher.

## The Rule

CEOs exist to spawn, route, monitor, and unblock subagents/tools while preserving
one visible board and one dispatch backend. If no subagent fits, create a
temporary one or pull a skill. Do not create a new standing PaperclipAI seat.

## Claude CEO (FCC — claude_local)

- Adapter: `fcc-claude` via `:8082` proxy
- Authority: doctrine, payments, public copy, merge/push, founder decisions
- Spawns: code agents (ant-dev, ant-reviewer, ant-devops), compliance (ant-compliance)
- Loops: mission guardian, pipeline keeper, PR review gate

## Hermes CEO (pi_local — hermes-router)

- Adapter: `hermes` via `:11435` router
- Authority: research, growth, support, external API work, lead triage
- Spawns: growth (ant-growth), support (ant-support), listings (ebay-lister), storefront (aisol-dev)
- Loops: adapter health, agent heartbeat audit, revenue scout

## Delegation Flow

```
Task arrives on board
  → CEO reads task title + labels
  → CEO picks skill from .agents/skills/ that matches
  → CEO assigns task to existing sub-agent OR spawns new one with that skill
  → Sub-agent works, updates issue, marks done/blocked
  → If blocked: escalation clock starts (ESCALATION.md)
  → CEO checks result, closes or reassigns
```

## Skill Routing (how CEOs pick sub-agents)

| Task type | Skill dir | Assigned to | CEO |
|---|---|---|---|
| Code/backend | agency-senior-developer | ant-dev | Claude |
| Code review | agency-code-reviewer | ant-reviewer | Claude |
| DevOps/deploy | agency-devops-automator | ant-devops | Claude |
| Compliance scan | agency-legal-compliance-checker | ant-compliance | Claude |
| Growth/marketing | agency-growth-hacker | ant-growth | Hermes |
| Support tickets | agency-support-responder | ant-support | Hermes |
| eBay listings | agency-cross-border-e-commerce-specialist | ebay-lister | Hermes |
| Storefront/API | agency-backend-architect | aisol-dev | Hermes |
| HR/hiring | agency-hr-onboarding | CEO spawns temp | Either |
| Finance | agency-financial-analyst | CEO spawns temp | Either |
| Content | agency-content-creator | CEO spawns temp | Hermes |
| Research | agency-investment-researcher | CEO spawns temp | Hermes |

## Sub-Agent Spawning

When no existing agent fits a task, CEOs create one:

1. Pick skill from `.agents/skills/<skill-dir>/SKILL.md`
2. Clone `paperclip-tro/agents/_template/` to new agent dir
3. Fill in AGENT.md frontmatter (adapter, model, project, node)
4. Register via PaperclipAI only if the worker must be visible during the task
5. Assign task immediately — no idle agents
6. Temp agents are removed when their task completes (unless promoted)

## Routines (24/7 — both CEOs run these)

### Mission Guardian (Claude CEO — every 30 min)
```
1. GET /api/agents — list all agents
2. For each: check last heartbeat timestamp
3. If agent silent > 2 heartbeat cycles: create ALERT issue, reassign work
4. If agent error state: restart via adapter health check
5. Log to STATE.md
```

### Pipeline Keeper (Hermes CEO — every 60 min)
```
1. GET /api/projects/:id/issues?status=open — count open tasks
2. If < 100 total across all projects: create backlog issues from:
   - Revenue opportunities (Square checkout, membership, verification)
   - Repo health (test coverage, docs, CI)
   - Content pipeline (landing pages, SEO, social)
   - Support improvements (canned responses, FAQ)
3. Label by priority: P0 (revenue), P1 (health), P2 (growth), P3 (polish)
4. Assign to appropriate sub-agent or leave unassigned for next pickup
```

### Adapter Health (Hermes CEO — every 15 min)
```
1. Run health check for each adapter in ADAPTORS.md
2. If adapter down: create RED issue, attempt restart
3. If restart fails: escalate to Claude CEO
4. Log results to STATE.md
```

### Revenue Scout (Hermes CEO — every 2 hours)
```
1. Check lead pipeline (Upwork, Fiverr, email)
2. Score leads by fit/revenue/effort
3. Create issues for qualified leads
4. Assign to growth agent for outreach
```

## Memory Protocol

Both CEOs follow BOOT-PROTOCOL.md strictly:
- Boot: 3 reads (AGENT.md, STATE.md, HEARTBEAT.md)
- Exit: 1 write (STATE.md with timestamp)
- Skills: lazy-load from `.agents/skills/` only when needed
- Never preload doctrine, soul, or briefings at boot

## What Reaches Joshua (ONLY these)

Inherited from ESCALATION.md:
- Doctrine/payments/founder-authority scope
- Real money beyond approved budgets
- Credentials only Joshua holds
- SLA breach pattern (3+ same cause)

Everything else: CEOs fix, delegate, or delete. No waiting.
