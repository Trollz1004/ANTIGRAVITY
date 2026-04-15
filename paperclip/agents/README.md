# Paperclip Agent Instructions Backup

These are the source-of-truth instruction files for all ANTIGRAVITY Paperclip agents.

If Paperclip's database gets wiped or an agent's instructions get corrupted, restore from here.

## Agent Roster

| Agent | Dir | Adapter | Agent ID |
|-------|-----|---------|----------|
| CEO | ceo/ | opencode_local | c4b4a3d9-8e66-4463-bf65-abfc5037b92a |
| CTO | cto/ | opencode_local | b02a21c7-737e-4177-91ac-6d8e57805801 |
| CMO | cmo/ | opencode_local | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 |
| UX Designer | uxdesigner/ | opencode_local | bd6d6722-9f3e-46ba-8651-ec9a219042ee |
| Mission Guardian (Claude) | mission-guardian-claude/ | claude_local | 2229682b-cede-4462-b38b-25a910af022e |
| Mission Guardian (Codex) | mission-guardian-codex/ | codex_local | 42200bfa-fb9e-42b1-901d-6dadf15eb23b |

## IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- ANTIGRAVITY Project ID: 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- Paperclip: localhost:3100 / paperclip-hq.youandinotai.com

## Restore Instructions

Copy the .md files from this folder back to:
C:\Users\joshl\.paperclip\instances\default\companies\{companyId}\agents\{agentId}\instructions\

Then reload the agent from the Paperclip UI.

## Model

All agents except Mission Guardians run on ollama/qwen3-coder:480b-cloud (no Claude tokens).
Mission Guardians use claude_local + codex_local (daily caps — heartbeat set to 3600s).
