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

Read `C:\antigravity\.agents\skills\self-improving-system\skills.md` for the complete local skills index.

## File Locations

| Type | Path |
|------|------|
| Universal boot | `C:\antigravity\.agents\UNIVERSAL-AGENT-BOOT.md` |
| Skills index | `C:\antigravity\.agents\skills\self-improving-system\skills.md` |
| Session notes | `C:\antigravity\.agents\skills\self-improving-system\session-notes.md` |
| Core skills | `C:\antigravity\.agents\skills\<skill-name>\SKILL.md` |
| Agent configs | `C:\antigravity\paperclip-tro\agents\<agent-id>\AGENT.md` |
| Agent state | `C:\antigravity\paperclip-tro\agents\<agent-id>\STATE.md` |

## Usage

When agents need to reference skills in prompts or documentation, point to the skills.md index
instead of embedding large skill descriptions. This reduces context window waste and ensures
skill references are resolvable.
