---
name: self-improvement
description: |
  Agent self-evaluation and improvement protocol. On each session end,
  evaluate performance, log learnings, and propose rule changes.
  Works with hermes-evolution for workspace-level improvements.
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
---

# Self-Improvement Agent Skill

## Purpose

Every agent must evaluate its own performance and propose improvements.
This is not optional — it is the minimum viable self-improvement loop.

## Session End Protocol

### Step 1: Self-Evaluate

Before exiting, answer these questions:

1. **Did I complete the assigned task?** (yes/partial/no)
2. **How many tokens did I use?** (estimate)
3. **Did I use caveman mode when appropriate?** (yes/no)
4. **Did I discover a new pattern or rule?** (if yes, document it)
5. **What would I do differently next time?**

### Step 2: Log to State

Update `state/[AGENT-NAME].md` with session summary.

### Step 3: Propose Evolution (if applicable)

If you discovered a pattern that should become a rule:

1. Draft the proposed rule change
2. Note which file it affects (AGENTS.md, MEMORY.md, TOOLS.md, or SKILL.md)
3. Use the evolution proposal card — do NOT edit target files directly

### Step 4: Update Skills Index

If you found a skill that was useful or one that's missing:

- Add to `skills/self-improving-system/skills.md` if it's a new skill
- Note in state.md which skills were effective

## Improvement Categories

### Token Efficiency
- Did I use caveman mode for routine responses?
- Could I have used a cheaper model for this task?
- Did I read files in parallel instead of sequentially?

### Task Completion
- Did I complete the task in one pass or need retries?
- Did I verify the result (build, test, lint)?
- Did I leave clear next actions?

### Knowledge Capture
- Did I discover a codebase pattern worth documenting?
- Did I find a tool or skill that should be in the index?
- Did I encounter a blocker that should be escalated?

### Agent Coordination
- Did I delegate effectively (if applicable)?
- Did I respect other agents' authority boundaries?
- Did I report evidence/risks when I wasn't the decision lane?

## Auto-Evaluation Scorecard

| Metric | Weight | Score (1-5) |
|--------|--------|-------------|
| Task completion | 30% | |
| Token efficiency | 20% | |
| Verification quality | 20% | |
| Knowledge capture | 15% | |
| Coordination | 15% | |
| **Weighted Score** | | |

Score interpretation:
- 4.0+ = Excellent, no changes needed
- 3.0-3.9 = Good, minor improvements possible
- 2.0-2.9 = Needs work, propose specific fixes
- <2.0 = Failure, escalate to active lead

## Integration with Hermes-Evolution

When self-improvement identifies a pattern that should be workspace-level:

1. Use the hermes-evolution skill's proposal card format
2. Target the appropriate managed file
3. Include evidence from this session
4. Wait for user approval before applying

## Forbidden

- Never write directly to AGENTS.md, MEMORY.md, TOOLS.md, or USER.md
- Never claim improvement without evidence
- Never propose changes that conflict with Joshua's authority
- Never auto-apply changes without user confirmation
