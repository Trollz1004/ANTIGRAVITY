---
name: agent-workflow
description: "Multi-agent orchestration, subagent dispatch, autonomous loops, plan-execute-verify."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [agent, workflow, orchestration, subagent, autonomous, delegation]
    related_skills: [brainstorm, test-driven-development]
---

# Agent Workflow

## When to Use

- Multi-step tasks that benefit from parallel execution
- Complex research or analysis
- Codebase-wide changes
- Tasks requiring specialized subagents

## Quick Reference

| Task | Approach |
|------|----------|
| Parallel research | delegate_task with multiple goals |
| Code implementation | delegate_task with TDD context |
| Review/QA | delegate_task with review checklist |
| Long-running | terminal(background=true) + process |

## The Plan-Execute-Verify Loop

### 1. Plan

- Break task into 3-7 subtasks
- Identify dependencies between subtasks
- Determine which can run in parallel
- Assign tools and constraints per subtask

### 2. Execute

```
# Parallel execution for independent tasks
delegate_task(tasks=[
    {"goal": "Research X", "context": "..."},
    {"goal": "Research Y", "context": "..."},
    {"goal": "Research Z", "context": "..."},
])

# Sequential for dependent tasks
result_1 = delegate_task(goal="Step 1")
result_2 = delegate_task(goal="Step 2", context=result_1)
```

### 3. Verify

- Check each subtask output against success criteria
- Integration test the combined result
- Document what worked and what didn't
- Update memory/lessons learned

## Subagent Patterns

### Investigator → Builder → Reviewer

```
# 1. Investigate
investigation = delegate_task(
    goal="Investigate root cause of auth token expiry",
    context="User reports 401 errors after 30 minutes. Stack: Next.js, Supabase.",
)

# 2. Build
build = delegate_task(
    goal="Fix the auth token refresh issue",
    context="Root cause: {investigation}. Follow TDD. Use Supabase auth.",
)

# 3. Review
review = delegate_task(
    goal="Review the fix for correctness and security",
    context="Fix: {build}. Check: token refresh, CSRF, session fixation.",
)
```

### Parallel Scrub

```
# When order doesn't matter, fan out
delegate_task(tasks=[
    {"goal": "Update README", "context": "..."},
    {"goal": "Add tests", "context": "..."},
    {"goal": "Fix lint errors", "context": "..."},
    {"goal": "Update types", "context": "..."},
])
```

## Pitfalls

- Over-parallelizing → Some tasks need sequential context
- Vague goals → Subagents need specific, checkable objectives
- No verification → Always check subagent output
- Ignoring failures → One failed subtask can invalidate the whole
- Too many levels → Max 2 levels of delegation

## Verification

- [ ] All subtasks completed successfully
- [ ] Outputs integrated correctly
- [ ] Success criteria met for each subtask
- [ ] No regressions from parallel changes
- [ ] Lessons learned documented
