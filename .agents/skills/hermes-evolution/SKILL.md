---
name: hermes-evolution
description: |
  Evaluate and propose self-improvements for agents when receiving evolution-check messages.
  Triggered by `[SYSTEM: Post-turn evolution check` messages from the desktop app. Applies rules
  at workspace-local intensity levels (conservative/assertive/aggressive). Never writes to target
  files without user approval - always uses draft/approve workflow.
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
  intensity_levels:
    - conservative
    - assertive
    - aggressive
---

# Hermes Evolution

## When to Trigger

This skill activates automatically when you receive a `[SYSTEM: Post-turn evolution check` message from the desktop app. The message includes:

- Evolution intensity level (workspace-local)
- Current state summary
- Recent rule applications

## Intensity Levels

| Level                 | Behavior                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **conservative**      | Minimal changes only. Focus on obvious drift fixes and spelling errors. Require explicit user approval for any substantive change.                               |
| **assertive**         | Moderate improvements. Propose optimizations that clearly improve clarity or reduce token count. Flag potential issues.                                          |
| **aggressive (100%)** | Full evaluation. Propose all improvements including reorganization, rule consolidation, and pattern optimization. Always require approval before making changes. |

## Evaluation Workflow

### 1. Receive Evolution Check

The desktop app sends: `[SYSTEM: Post-turn evolution check <intensity> <state-hash>]`

### 2. Analyze Current State

Before proposing changes, evaluate:

- **Drift detection**: Compare AGENTS.md rules against actual agent behavior
- **Token efficiency**: Identify repeated patterns that could be centralized
- **Rule clarity**: Check if directives are actionable and unambiguous
- **Redundancy**: Remove duplicate or superseded guidance
- **File location optimization**: Ensure skills referenced are available at `.agents/skills/` or `skills/`

### 3. Draft Proposal

Create an evolution proposal card with:

- What changed in the last turn
- Why this motivates evolution
- Proposed improvement to AGENTS.md, MEMORY.md, TOOLS.md, or SKILL.md
- Token savings estimate (if applicable)
- Risk assessment

### 4. Wait for Approval

Present the proposal and wait for explicit user confirmation before modifying any target files.

**Never write directly to memory or doctrine files without approval.**

## Core Principles

### Draft/Approve Workflow

```markdown
## Evolution Proposal

**Trigger**: [SYSTEM: Post-turn evolution check aggressive ...]
**Change detected**: [description of what motivated this evaluation]
**File affected**: AGENTS.md / MEMORY.md / TOOLS.md
**Proposed edit**:
```

- old text

* new text

```
**Token savings**: ~X characters
**Risk**: low/medium/high
```

### File Location Rules

- Skills files must exist at `.agents/skills/<skill-name>/SKILL.md` OR `skills/<skill-name>/SKILL.md`
- Referenced skills that don't exist at these paths create context window waste
- This skill evaluates whether skill references are resolvable before suggesting them

## What to Improve

### AGENTS.md

- Remove stale launch blockers
- Clarify ambiguous rules
- Consolidate repeated patterns
- Fix broken cross-references

### MEMORY.md

- Remove obsolete facts
- Update superseded entries
- Consolidate overlapping entries
- Archive old entries to briefings

### TOOLS.md

- Remove deprecated tool references
- Update tool availability notes
- Align with current workspace capabilities

### SKILL.md files

- Verify skill file exists before referencing
- Update skill descriptions to match actual behavior
- Remove stale examples
- Add missing skill variants

## Evolution Echo

When applying knowledge from a previously evolved rule, briefly mention it in responses:

> （基于之前的经验：<one-line rule summary>）

Keep it to one short line maximum. Do not echo on every turn.

## Success Criteria

- All referenced skills are resolvable at `.agents/skills/` or `skills/`
- AGENTS.md is < 15KB (single read)
- MEMORY.md entries are < 8KB each and < 120 per file
- No duplicate rules across AGENTS.md, MEMORY.md, TOOLS.md
- Rules reference concrete files, not abstract concepts

## What NOT to Do

- Never auto-edit AGENTS.md, MEMORY.md, TOOLS.md without approval
- Never add fundraising, control-rights, or ownership-sale language
- Never modify payment or Square configuration rules
- Never change Joshua's authority or business-only boundaries
- Never remove rules without replacement that preserves intent
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
