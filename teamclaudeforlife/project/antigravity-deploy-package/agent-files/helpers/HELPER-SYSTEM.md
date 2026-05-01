# HELPER AGENT SYSTEM — ANTIGRAVITY
**Design: Claude · April 21, 2026 · #ForTheKids**

---

## What This Is

Lightweight "intern" agents that spin up automatically when any main agent has too many tasks.
They take a scoped slice of work, complete it, report back, then go idle.
No waiting on the pipeline. No one agent becoming the bottleneck.

## Models Used (Free / Ultra-Lightweight)

Helpers run on the cheapest possible model that can do the job.
They never consume Tier 1 API tokens (Claude/Codex) unless explicitly forced by Josh.

| Model | Source | Best For |
|-------|--------|---------|
| OpenCode free tier model 1 | opencode (free) | Research, summarization |
| OpenCode free tier model 2 | opencode (free) | Drafting, copy |
| OpenCode free tier model 3 | opencode (free) | Triage, classification |
| `gemma2:latest` (9.2B local) | Ollama :11434 | Any helper task, offline fallback |
| `qwen2.5:7b` (7.6B local) | Ollama :11434 | Fast lightweight fallback |

When OpenCode free tier is unavailable → fall back to `gemma2:latest` local. Always free.

## Trigger Logic

Any main agent CAN request a helper when:
- Task queue has **5+ open tasks** assigned to them
- A task has been waiting in queue **>4 hours** without progress
- Josh manually says "get help on this"

The CEO monitors all agents and CAN auto-spawn a helper for any overwhelmed direct report.

## Helper Types

| Type | File | Spawned By | Does |
|------|------|-----------|------|
| HELPER-RESEARCH | `HELPER-RESEARCH.md` | CMO, CSO, CEO | Finds info, summarizes, builds briefs |
| HELPER-TRIAGE | `HELPER-TRIAGE.md` | CEO, CTO | Sorts issues, labels, assigns priority |
| HELPER-DRAFT | `HELPER-DRAFT.md` | CMO, CFO, UX | Drafts copy, reports, outlines |
| HELPER-QA | `HELPER-QA.md` | CTO | Runs test checklists, validation reports |
| HELPER-DATA | `HELPER-DATA.md` | CFO, CSO | Formats data, builds summaries, spot-checks numbers |

## Scope Rules (non-negotiable)

- A helper only works tasks given to it by its requesting agent
- A helper CANNOT create new issues, assign work to other agents, or push to repo
- A helper CANNOT access treasury, Square, or payment tools
- A helper reports output ONLY to the agent that spawned it
- A helper dissolves (goes idle) when its task list is empty
- Josh can dissolve any helper at any time
- Helpers NEVER have Tier 1 API access unless Josh explicitly grants it

## Lifecycle

```
Main Agent queue > 5 tasks
        ↓
Main Agent creates HELPER request issue
(title: "[HELPER-REQUEST] {type} for {agent-name}")
        ↓
CEO sees it on next heartbeat → spawns helper
        ↓
Helper receives scoped task list from requesting agent
        ↓
Helper works tasks → reports output as issue comments
        ↓
Main agent reviews + approves output
        ↓
Helper queue empty → status set to IDLE
```

## CEO Heartbeat Integration

CEO checks on every heartbeat:
1. Any agent with 5+ open tasks → auto-create HELPER-REQUEST issue
2. Any task >4h with no activity → flag + offer helper to that agent
3. Any helper that's been IDLE >2 heartbeat cycles → remove from active roster
