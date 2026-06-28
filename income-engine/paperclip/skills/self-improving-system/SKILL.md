---
name: self-improving-system
description: |
  Self-improving agent skills reference system that reduces context window usage by
  pointing to file locations instead of embedding large text. Read skills.md for the
  complete index of available skills at income-engine/paperclip/skills/.
metadata:
  version: 1.0.0
  author: income-engine
  category: meta
---
# Self-Improving Agent Skills Reference

## Quick Reference

Read `/mnt/c/antigravity/income-engine/paperclip/skills/skills.md` for the complete skills index.

## File Locations

| Type | Path |
|------|------|
| Skills index | `/mnt/c/antigravity/income-engine/paperclip/skills/skills.md` |
| Session notes | `/mnt/c/antigravity/income-engine/paperclip/skills/self-improving-system/session-notes.md` |
| Executive skills | `skills/{ceo,cfo,cmo,cto}/SKILL.md` |
| Operating skills | `skills/{fetcher,shared}/SKILL.md` |
| Tool skills | `skills/{agent}/tools/{tool}/SKILL.md` |
| Heartbeat skills | `skills/{agent}/heartbeat/SKILL.md` |
| Agent configs | `skills/{agent}/AGENT.md` |

## Usage

When agents need to reference skills in prompts or documentation, point to the skills.md index
instead of embedding large skill descriptions. This reduces context window waste and ensures
skill references are resolvable.

**Example reference:**
```
For cost tracking, see skills/cfo/tools/cost-tracker/SKILL.md
For lead scanning, see skills/ceo/tools/lead-scanner/SKILL.md
```

## THE WALL

- income-engine NEVER references Antigravity (Trollz1004), Sabretooth node, or port-3100 Paperclip
- All financial actions require revenue flowing OR Joshua explicit approval
- Paperclip for income-engine runs on port 3101 ONLY