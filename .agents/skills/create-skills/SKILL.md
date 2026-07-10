---
name: create-skills
description: Mandatory fallback skill for creating or improving a reusable ANTIGRAVITY skill when find-skills confirms that no suitable skill exists. Use for new repeatable workflows or missing platform capabilities.
---

# Create Skills

Create a skill only after `find-skills` confirms that the capability is missing.

1. Define concrete trigger examples and the reusable outcome.
2. Prefer updating a close existing skill over creating a duplicate.
3. Create `.agents/skills/<lowercase-hyphen-name>/SKILL.md` with concise YAML metadata and task instructions.
4. Add only essential scripts, references, or assets.
5. Add the skill to `.agents/skills/self-improving-system/skills.md`.
6. Validate paths, frontmatter, triggering language, and one realistic use case.
7. Record the change in the acting agent's own `STATE.md` or approved journal.

Never create a skill that lets one AI control another, bypasses Joshua, exposes secrets, or turns memory/MCP output into authority.
