# Dateapp Swarm Agent Index

| Agent                        | Min skills | Path                                     |
| ---------------------------- | ---------- | ---------------------------------------- |
| dateapp-gui-agent            | 4          | `.agents/skills/dateapp-gui-agent/`      |
| dateapp-payments-agent       | 4          | `.agents/skills/dateapp-payments-agent/` |
| dateapp-growth-agent         | 4          | `.agents/skills/dateapp-growth-agent/`   |
| dateapp-ops-agent            | 4          | `.agents/skills/dateapp-ops-agent/`      |
| dateapp-swarm (orchestrator) | 1          | `.agents/skills/dateapp-swarm/SKILL.md`  |

Sub-agents MUST load skills from these paths before executing lane work.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
