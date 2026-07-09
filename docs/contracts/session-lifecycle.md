# Agent Session Lifecycle Contract

This contract keeps PaperclipAI, Agent Hub, Hermes, FCC, OpenCode, Ollama, node workers, browser tools, and DREAM sessions compact and auditable.

## Start of session

1. Identify `agent_id`, `node`, `project`, `task_id`, and `cwd`.
2. Read own `STATE.md` first when one exists.
3. Read the shortest boot packet for the assigned lane.
4. Use `scripts/skills.ps1 -Query <keyword>` or `scripts/skills.sh <keyword>` to find skills by path.
5. Read only the selected `SKILL.md`; do not preload the full skill library.
6. Read `paperclip-tro/README.md` before PaperclipAI or Agent Hub work.
7. For DREAM ONLINE, use the E-drive Dream root and keep game work separate from ANTIGRAVITY business work.

Do not boot from archives, Copilot exports, old raw chats, populated env files, or giant pasted prompts.

## Browser/no-tool agent fallback

Browser agents, free web storage tools, and weak/no-tool bots are resources, not permanent Paperclip agents. They receive a compact task card with paths, constraints, and return format. They must not receive secrets or giant context dumps.

Minimum task card:

```text
task_id: <Agent Hub id or local id>
repo: C:\antigravity
read_first: C:\antigravity\.agents\skills\self-improving-system\skills.md
allowed: draft/propose/evidence only
forbidden: secrets, posting, sending, payments, deployments, doctrine changes
return: summary, paths used, risks, next action
```

## Exit write

Each agent writes exactly one compact exit update to its own `STATE.md` or assigned node state file.

`STATE.md` shape:

```markdown
> updated: 2026-07-08T14:30:00-04:00

## Current Focus
- one sentence

## Last Session
- max 5 bullets

## Decisions
- durable decisions only

## Learned
- reusable facts, constraints, dead ends

## Blocked
- blocker | owner | exact next action

## Next
- 1-3 concrete actions

## Evidence
- task ids, file paths, URLs, command names only
```

Target cap: 4k tokens. Compress older process detail into decisions and learned facts.

## Heartbeat log shape

Use JSONL with Windows-safe UTC filenames such as `2026-07-08T18-30-00Z-hermes-ceo-heartbeat.jsonl`.

```json
{"ts":"2026-07-08T18:30:00Z","node":"sabretooth","agent":"hermes-ceo","project":"ANTIGRAVITY","task_id":"agt_123","status":"active","last_action":"queued support task","next_action":"founder review","blocker":"none","evidence":["C:\\antigravity\\docs\\runtime\\ports-health.md"],"state_size":"3.2k tokens"}
```

Heartbeats summarize state. They do not contain raw logs, secrets, env values, private chat dumps, or full prompts.

## Context spam prevention

- Reference paths instead of pasting files.
- Keep one PaperclipAI board and one Agent Hub dispatcher.
- No private side backlogs or hidden per-platform boards.
- No wake payload larger than a compact task card.
- Low-capability helpers return evidence and proposals; Codex 5.5, Opus-level, or Joshua decide doctrine, payments, public copy, launch gates, and node roles.
