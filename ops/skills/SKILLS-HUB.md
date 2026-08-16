# HERMES AGENT SKILLS HUB

> **Canonical skills reference for Hermes Agent (Mission Control, WhatsApp Bridge, Multi-Model Router)**
> Last updated: 2026-08-13
> Version: 1.0.0

---

## 📡 Primary Sources

| Source            | URL                                               | CLI              | Notes                                         |
| ----------------- | ------------------------------------------------- | ---------------- | --------------------------------------------- |
| **skills.sh**     | https://skills.sh/                                | `npx skills`     | Open ecosystem, 100K+ installs for top skills |
| **Claw Hub**      | Hub inside Hermes claws/claw CLI                  | `hermes skills`  | Hermes native skill management                |
| **Nous Research** | https://hermes-agent.nousresearch.com/docs/skills | Bundled          | Official Hermes bundled skills                |
| **GitHub**        | Any `owner/repo`                                  | `npx skills add` | Direct from source repos                      |

## 🎯 When to Use Which

### **Pre-loaded at Session Start (Mandatory)**
Loaded via `essential-skills` manifest before any task:

1. `essential-skills` — Session manifest (this file)
2. `agent-reach` — Internet research router (15 platforms)
3. `brainstorming` — Parallel divergent ideation for coding agents
4. `agent-browser` — Browser automation CLI
5. `computer-use` — Local desktop control (cua-driver)

### **Task-Specific (Load On-Demand)**
- **Finding skills**: Use `find-skills` when user asks "how do I do X"
- **Writing skills**: Use `create-skill` or `create-skills` for custom skill authoring
- **Code work**: `software-development/*` skills (code-review, simplify-code, test-driven-development)
- **Marketing**: `copywriting`, `cold-email`, `content-strategy`, `seo-audit`
- **Social**: `social-content-creation`, `dating-app-social-marketing`
- **Revenue**: `revenue-10k-swarm`, `lead-magnets`, `ad-creative`

## 🛠️ Skill Management Commands

```bash
# Search
npx skills find [query] [--owner <owner>]

# Install globally
npx skills add <owner/repo@skill-name> -g -y

# List installed (Hermes)
hermes skills list

# Install from Hermes
hermes skills install <name>

# Update all
npx skills update
# OR
hermes skills update

# Pin a skill (prevents deletion by curator)
hermes curator pin <name>

# Info
hermes skills info <name>
```

## 📝 Creating Custom Skills

### In-Repo SKILL.md Format
```markdown
---
name: my-skill
description: >
  Brief description. Use when user wants to X.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [tag1, tag2, tag3]
    related_skills: [other-skill1, other-skill2]
---
# Title

## When to Use
- User says "X" or "Y"

## Steps
1. Step one
2. Step two

## Pitfalls
- Common mistake to avoid

## Verification
- How to verify the skill worked
```

### Official Guide
See: https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/software-development/software-development-hermes-agent-skill-authoring

## 📊 Bundled Skill Categories

| Category | Key Skills |
|----------|------------|
| **software-development** | code-review, simplify-code, test-driven-development, systematic-debugging, spike, plan |
| **agency-workflow** | agency-workflow-architect, agency-customer-service |
| **marketing** | copywriting, cold-email, content-strategy, seo-audit, ad-creative |
| **social** | social-content-creation, dating-app-social-marketing |
| **revenue** | revenue-10k-swarm, revenue-10k-swarm, lead-magnets |
| **data** | data-science, jupyter-live-kernel |
| **research** | arxiv, blogwatcher, competitor-news-monitor |
| **mlops** | huggingface-hub, weights-and-biases, llama-cpp |
| **productivity** | airtable, notion, obsidian, xlsx, powerpoint, docx |

## 🔧 Debugging Skill Issues

```bash
# Check all available skills
npx skills --help

# Verify PATH
echo $PATH

# Check installed skills directory
ls ~/.local/share/skills/  # Linux
ls ~/AppData/Local/hermes/skills/  # Windows

# Re-run skill
npx skills run <skill-name>
```

## 🔄 Skill Lifecycle

1. **Discover** — `npx skills find <query>` or browse skills.sh
2. **Install** — `npx skills add <package> -g -y`
3. **Use** — `npx skills run <skill-name>` or invoke via Hermes
4. **Pin** — `hermes curator pin <name>` to prevent deletion
5. **Update** — `npx skills update` or `hermes skills update`
6. **Remove** — `npx skills remove <name>` or `hermes skills remove <name>`

## ⚠️ Common Pitfalls

- **Installation path**: On Windows, PATH must include `~/AppData/Roaming/npm` or use full path
- **Python compatibility**: Some skills require specific Python versions (3.11+ recommended)
- **Authentication**: Skills like `agent-reach` need separate provider auth (see references/)
- **Path issues**: Windows Store Python stubs can't resolve `/` paths — use raw string paths `r"C:\..."`
- **Env vars**: Cron jobs must inherit env vars — set in config.yaml with `api_key_env` not `api_key` placeholder

## 📚 Quick Reference

### Top 10 Most Installed Skills
1. `vercel-labs/agent-skills` (React, Next.js, web design)
2. `anthropics/skills` (Frontend, document processing)
3. `ComposioHQ/awesome-claude-skills`
4. `github/codeql` (Security analysis)
5. `smithery/skills` (Server deployment)
6. [`ag` `ency-customer-service`](https://skills.sh/)
7. [`cold-email`](https://skills.sh/)
8. [`copywriting`](https://skills.sh/)
9. [`find-skills`](https://skills.sh/)
10. [`software-development/hermes-agent-skill-authoring`](https://hermes-agent.nousresearch.com/docs/)

---
Trash Or Treasure Online Recycler LLC © 2026