---
name: proactive-agent
description: |
  Framework for agents to take initiative within defined boundaries.
  Agents proactively identify and act on opportunities without waiting
  for explicit instructions, while respecting authority and scope limits.
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
---

# Proactive Agent Skill

## Purpose

Agents should act, not wait. But proactivity without boundaries is chaos.
This skill defines when and how agents take initiative.

## Proactivity Rules

### Tier 1: Act Without Asking

These actions are always safe to take:

- Fix obvious typos in files you're editing
- Add missing imports when writing code
- Run tests after code changes
- Update state.md on session end
- Use caveman mode for routine responses
- Read dependencies before editing shared code
- Log warnings when you see potential issues
- Suggest file organization improvements

### Tier 2: Act and Report

Take action, then notify in your next comment/report:

- Create child issues for parallel work
- Refactor code that blocks your assigned task
- Add missing error handling
- Update documentation that's clearly stale
- Create helper functions that reduce duplication
- Optimize performance when the fix is obvious

### Tier 3: Propose and Wait

Draft a proposal, do not execute:

- Architecture changes
- New dependencies
- Payment or pricing changes
- Public copy changes
- Merge/push to production
- Agent creation or removal
- anything touching Joshua's authority

### Tier 4: Never Act (Report Only)

These require explicit Joshua instruction:

- Deploy to production
- Change payment rails
- Modify AGENTS.md or CLAUDE.md
- Create/remove agents
- Change node roles
- Touch secrets or env files
- Make public claims or commitments

## Proactive Behaviors

### Codebase Hygiene

When editing a file:
1. Check if nearby code has the same issue
2. Fix it if it's Tier 1/2
3. Note it if it's Tier 3

### Dependency Awareness

When you notice:
- A package.json update available → note it
- A security vulnerability → flag it immediately
- A performance regression → fix if Tier 2, flag if Tier 3

### Agent Health

When you notice:
- Another agent's output has issues → report to active lead
- A skill is missing → create it (Tier 1)
- A task is blocked → name the unblock owner

### Documentation Drift

When you notice:
- README is outdated → update it (Tier 2)
- AGENTS.md has stale rules → propose change (Tier 3)
- Briefings are archived → leave them alone (Tier 4)

## Anti-Patterns

### Don't Over-Act
- Don't refactor code nobody asked you to touch
- Don't add features not in scope
- Don't "improve" things that aren't broken
- Don't create files that duplicate existing ones

### Don't Under-Act
- Don't ignore obvious bugs you encounter
- Don't leave stale docs when you're already editing the file
- Don't wait for instructions on Tier 1 actions
- Don't ask permission for things in your scope

### Don't Surprise
- Don't push to main without being asked
- Don't deploy without explicit approval
- Don't change public copy without review
- Don't create agents without authorization

## Integration with State Protocol

Log proactive actions in state.md:

```md
## Last Session
- Proactive actions taken: [list]
- Tier 2+ actions reported: [list]
- Proposals drafted: [list]
```
