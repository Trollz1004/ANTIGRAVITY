# ROSTER — Paperclip active seats

> Updated 2026-07-03 by Joshua directive.
> Architecture: Hermes is the only required active Paperclip agent. Paperclip is the visible, timestamped work/status board over Hermes work, not a separate agent company.

## Active architecture

| Seat | Runtime | Adapter | Port/feed | Purpose |
|---|---|---|---|---|
| hermes-ceo | Hermes Agent | `hermes` / `pi_local` | `http://127.0.0.1:9119` | CEO/operator brain, work execution, tool/API access, subagent spawning when useful, status updates to Paperclip |

## Paperclip role

Paperclip is organizational visibility:

- tasks
- routines
- issues
- goals
- timestamps
- evidence / verification notes
- done log

Paperclip does not need a permanent staff of CFO/CTO/CMO/etc agents. Those are now department skills that Hermes loads from `.agents/skills/` when needed.

## Department library, not permanent agents

The old roster below is inactive as permanent board seats. Treat these as skill lanes / reference folders only:

- `ant-dev` -> use `.agents/skills/agency-senior-developer/SKILL.md` or spawn Codex/OpenCode only for a concrete coding task.
- `ant-reviewer` -> use `.agents/skills/agency-code-reviewer/SKILL.md` or spawn a reviewer subagent only when a change exists.
- `ant-devops` -> use `.agents/skills/agency-devops-automator/SKILL.md` only for deploy/infra tasks.
- `ant-compliance` -> use `.agents/skills/agency-compliance-auditor/SKILL.md` or legal/compliance skills only for actual scans.
- `ant-support` -> use `.agents/skills/agency-support-responder/SKILL.md` only for customer-support work.
- `ant-growth` -> use `.agents/skills/agency-growth-hacker/SKILL.md` only for growth tasks.
- `ebay-lister` -> use `.agents/skills/agency-cross-border-e-commerce-specialist/SKILL.md` only for listing work.
- `aisol-dev` -> use `.agents/skills/agency-backend-architect/SKILL.md` only for AI-solutions/business-exchange implementation.
- `dream-*` -> use game/design/MCP skills only when DREAM work is active.

## Optional helper runtime

FCC-Claude may be used as a helper/browser-controlled CEO hand if Josh explicitly wants it for a task. It is not a required permanent Paperclip agent. If used, it is controlled/monitored by Hermes and Opus via browser, and its work is still represented in Paperclip as Hermes-owned work.

## Subagent rule

Hermes may spawn temporary subagents through built-in tools/APIs for parallel work. Subagents are not standing Paperclip employees. They exist for one task, produce evidence, and exit. Paperclip shows the task/routine/issue/goal status; Hermes remains accountable.
