## Hermes Agent Skills Hub — Quick Reference

### Official Documentation
- **Primary docs**: https://hermes-agent.nousresearch.com/docs/user-guide/skills
- **Skill authoring (software-dev)**: https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring

### Skill Sources
1. **skills.sh** — Open agent skills ecosystem (CLI: `npx skills`)
2. **Claw Hub** — Hermes plugin marketplace
3. **Nous Research** — Official Hermes bundled skills
4. **GitHub** — `https://github.com/skill-repo/skill-name`

### Finding Skills
```bash
npx skills find [query] [--owner <owner>]
# Browse: https://skills.sh/ (leaderboard by install count)
```

### Installing Skills
```bash
npx skills add <package> -g -y
# OR via Hermes:
hermes skills install <name>
```

### Creating Custom Skills (Hermes Format)
```markdown
---
name: my-skill
description: >
  Brief description. Use when user wants to X.
version: 1.0.0
author: Hermes Agent
---
# Skill Name

## When to Use
- User says "X" or "Y"

## Steps
1. Step one
2. Step two

## Pitfalls
- Common mistake 1
```

### Skill Management Commands
- `hermes skills list` — List installed skills
- `hermes skills install <name>` — Install from hub
- `hermes skills info <name>` — Show skill details
- `hermes skills update` — Update all skills
- `hermes curator pin <name>` — Pin skill to prevent deletion

### Bundled Skill Categories
- **software-development**: code-review, simplify-code, test-driven-development, systematic-debugging, spike, plan
- **agency-workflow-architect**: workflow mapping
- **agency-customer-service**: support specialist
- **copywriting**: marketing copy
- **cold-email**: B2B outreach
- **content-strategy**: content planning
- **seo-audit**: SEO diagnosis
- **dating-app-social-marketing**: TOS-compliant organic social
- **revenue-10k-swarm**: Autonomous sales engine
- **hermes-config**: Model routing configuration

### Related Skills to Load
- `create-skills` — Guide for creating effective skills
- `find-skills` — Discover and install agent skills
- `hermes-agent-skill-authoring` — In-repo SKILL.md authoring

### Installed Mission Skills

| Skill | Use before work or delegation |
|---|---|
| `i-have-adhd` | Concise, action-first, token-saving human updates; this is not a diagnosis. |
| `agent-reach` | External research, source discovery, and capability comparison. |
| `find-skills` | Discover an existing skill before hand-rolling a repeated capability. |
| `tdd` | Test-first implementation at agreed public seams. |
| `browser-use` | Interactive or authenticated browser work; use approved cookie sync only when needed. |
| `brainstorming` | Feature or behavior design before implementation. |
| `systematic-debugging` | Root-cause investigation before any proposed bug fix. |
| `hermes-agent-skill-authoring` | Scoped in-repo skills and Hermes configuration authoring through `author-hermes-artifact`. |

### Hermes Authoring Boundary

Hermes may author only these repository paths through Mission Control MCP: `.agents/skills/<name>/SKILL.md`, `.agents/harness-config/hermes.yaml`, `ops/skills/`, and `agent-contracts/`. The tool rejects environment files, credential-like content, and any path outside `C:\ANTIGRAVITY`. This gives Hermes a usable authoring path without granting access to runtime secrets or arbitrary service configuration.
