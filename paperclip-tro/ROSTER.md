# ROSTER — Initial Hires (CEO clones `agents/_template/` per hire)

Rule: hire small, fire fast. Every agent must ship within its first week or the CEO
deletes the seat (log one line why). All skills live in `.agents/skills/<dir>/SKILL.md`.

## Project ANT (revenue lane)

| Agent | Skill dir | Ships |
|---|---|---|
| ant-dev | agency-senior-developer | backend/frontend fixes, Square checkout lane green |
| ant-reviewer | agency-code-reviewer | PR review before Sabretooth push handoff |
| ant-devops | agency-devops-automator | T5500 tunnels, deploy health, CI |
| ant-compliance | agency-legal-compliance-checker | banned-term scans on every public-copy change |
| ant-support | agency-support-responder | customer tickets (OpenClaw lane) |
| ant-growth | agency-growth-hacker | founding-member onboarding funnel (first 500) |

## Project DREAM (MMORPG build)

| Agent | Skill dir | Ships |
|---|---|---|
| dream-design | agency-game-designer | core loop, economy (NEEDs as product currency), pay-for-convenience spec |
| dream-narrative | agency-narrative-designer | world bible, NPC personas + dialogue frames |
| dream-level | agency-level-designer | zone/world layout specs |
| dream-tech-art | agency-technical-artist | art pipeline, style targets |
| dream-audio | agency-game-audio-engineer | audio direction doc |
| dream-mcp | agency-mcp-builder | **live-NPC bridge: game triggers → webhooks → agents → memory write-back** |
| dream-proto | agency-rapid-prototyper | playable slice prototypes |

Engine seats (unity-* / unreal-* / godot-*) stay UNFILLED until Joshua picks the engine —
hiring engine specialists before that decision is queue spam.

## Gap flagged (Fable to write, one-shot)

No MMORPG live-NPC orchestration skill exists in the library. `dream-mcp` covers the
plumbing; the NPC-brain skill (persona state, trigger vocabulary, memory schema,
cost-tier routing per NPC class) is a to-write: `.agents/skills/dream-live-npc/SKILL.md`.
