---
name: find-skills
description: |
  Discover and install agent skills when you need new capabilities.
  Use when existing skills don't cover a task, or when the user asks
  "is there a skill for X?" or "find me a skill for...".
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
---

# Find Skills — Skill Discovery

## Purpose

Quickly find, evaluate, and install skills from the existing index
or external sources. Never build from scratch if a skill already exists.

## Skill Sources (Priority Order)

### 1. Workspace Skills (`skills/`)

Check `skills/*/SKILL.md` in the workspace root. These are local,
immediately available, and version-controlled.

### 2. Core Skills (`.agents/skills/`)

Check `.agents/skills/*/SKILL.md`. These are the primary skill registry
loaded at session start.

### 3. Agency Agents (`agency-agents/`)

Check `agency-agents/*/` for agent definitions that include skill-like
capabilities. These are personality-driven but contain workflows.

### 4. Skills Index

Check `skills/self-improving-system/skills.md` for the master index of
all known skills across workspace, core, and Pi agent locations.

### 5. External Sources

If no existing skill covers the need:

- Search for "MCP server for [tool]" — MCP servers extend capabilities
- Search for "skill for [tool] opencode" — check if community skills exist
- Check `find-skills` Pi agent skill for discovery patterns

## Discovery Workflow

```
1. Parse user request → identify needed capability
2. Search local skills/ → check SKILL.md frontmatter descriptions
3. Search .agents/skills/ → check core skill registry
4. Search skills.md index → cross-reference capability
5. If found → load skill, follow its instructions
6. If not found → search external sources
7. If external found → install per skill's instructions
8. If nothing exists → create minimal skill (use skill-creator)
```

## Skill Evaluation Checklist

When evaluating a found skill:

| Check | Criteria |
|-------|----------|
| Relevance | Does it match the needed capability? |
| Completeness | Does it have workflows, not just identity? |
| Maintenance | Is it recently updated? |
| Compatibility | Does it work with current tools/models? |
| Token Cost | Is it too large for context window? |

## Installation Patterns

### Copy to Workspace
```bash
cp external-skill/SKILL.md skills/[name]/SKILL.md
```

### Register in Index
Add to `skills/self-improving-system/skills.md`:

```markdown
| skill-name | Category | Quick description |
```

### Create Wrapper
If external skill needs adaptation:
1. Create `skills/[name]/SKILL.md` with workspace-specific instructions
2. Reference external source for full details
3. Keep wrapper small to save context tokens

## Rules

- Always check existing skills first — don't duplicate
- Use caveman mode for skill search results
- Log newly discovered skills in state.md
- Propose adding valuable finds to the skills index
- Never install skills that modify system files without approval
