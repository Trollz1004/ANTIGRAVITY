# Agent State File

> **Pattern:** Read on session start, written on session end.
> **Lifecycle:** If agent produces 2 consecutive warnings (no output, errors, or stalled), remove the agent from active rotation.

## Session Start Protocol

1. Read this file at session initialization
2. Load last session summary from `## Last Session` section
3. Check `## Active Warnings` — if count >= 2, agent is suspended pending review
4. Resume from `## Pending Tasks` or `## Last Session → Next Action`

## Session End Protocol

1. Write updated state to this file before exit
2. Update `## Last Session` with summary, skills used, and outcomes
3. Increment `## Session Count`
4. Clear resolved warnings; increment unresolved warning count
5. Set `## Pending Tasks` for next session if applicable

---

## Agent Identity

- **Agent Name:** [AGENT_NAME]
- **Role:** [ROLE]
- **Model Route:** [MODEL]
- **Created:** [DATE]
- **Authority:** Joshua Coleman (sole founder)

## Session Count

- **Total Sessions:** 0
- **Consecutive Failures:** 0

## Active Warnings

- **Warning Count:** 0
- **Max Warnings Before Removal:** 2
- **Last Warning:** None

## Last Session

- **Date:** [DATE]
- **Summary:** [What happened]
- **Skills Used:** [List]
- **Outcome:** [Success/Partial/Failed]
- **Next Action:** [What to do next]

## Pending Tasks

| Task | Priority | Status | Assigned |
|------|----------|--------|----------|
| [Task] | [H/M/L] | [pending/in_progress] | [Agent] |

## Performance Log

| Session | Date | Tasks Completed | Tokens Used | Notes |
|---------|------|-----------------|-------------|-------|
| 1 | [DATE] | [count] | [count] | [notes] |

## Warning History

| Date | Warning | Action Taken | Resolved |
|------|---------|--------------|----------|
| [DATE] | [description] | [action] | [yes/no] |
