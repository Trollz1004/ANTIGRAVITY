---
name: self-improving-system
description: |
  Self-improving agent skills reference system that reduces context window usage by
  pointing to file locations instead of embedding large text. Read skills.md for the
  complete index of available skills at .agents/skills/, skills/, and Pi agent skills.
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
---

# Self-Improving Agent Skills Reference

## Quick Reference

Read `/mnt/c/antigravity/skills/self-improving-system/skills.md` for the complete skills index.

## File Locations

| Type             | Path                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| Skills index     | `/mnt/c/antigravity/skills/self-improving-system/skills.md`                            |
| Session notes    | `/mnt/c/antigravity/skills/self-improving-system/session-notes.md`                     |
| Core skills      | `.agents/skills/<skill-name>/SKILL.md`                                                 |
| Secondary skills | `skills/<skill-name>/SKILL.md`                                                         |
| Pi agent skills  | See skill system (`agent-browser skills get <name>` or `/home/josh/.pi/agent/skills/`) |

## Usage

When agents need to reference skills in prompts or documentation, point to the skills.md index
instead of embedding large skill descriptions. This reduces context window waste and ensures
skill references are resolvable.
