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
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
