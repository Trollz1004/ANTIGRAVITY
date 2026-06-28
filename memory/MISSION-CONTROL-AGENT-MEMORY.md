# Mission Control Agent Memory

Purpose: give every approved AI lane and node one shared operating memory path without using Paperclip as the dependency.

## Load Order

Agents should read these files before acting:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `agent.md`
4. `memory/MISSION-CONTROL-AGENT-MEMORY.md`
5. `GET /memory/bootstrap` from the Mission Control API when available

## Access Points

- GUI: Mission Control -> Agent Memory
- API status: `GET /memory/status`
- API bootstrap: `GET /memory/bootstrap`
- API entries: `GET /memory/entries`
- API write: `POST /memory/entries`
- File log: `memory/mission-control-agent-memory.jsonl`

## Node Map

- Sabretooth `192.168.0.8`: brain/operator node.
- T5500 `192.168.0.15`: public front-door/runtime node.
- 9020 `192.168.0.5`: dev/support checkout.

Each node should either run the Mission Control API on `:8787` or keep the repo memory file synced from `origin/main`/the active checkout.

## AI Lanes

The shared memory is for Codex/OpenAI, Claude, Gemini, Hermes, Meta/Llama, Manus, FCC, OpenCode, Ollama, NVIDIA, OpenClaw support, and other directly assigned capable systems.

Paperclip is not required for this memory path.

## Boundaries

- Joshua's direct assignment chooses the active lead for the task.
- No permanent AI boss.
- Do not store secrets, populated env values, private keys, tokens, passwords, or vault content.
- Do not add private owner accounting, tax handling, giving decisions, control-rights claims, or non-product fundraising logic to public product execution.
- Customer/public surfaces stay focused on membership, verification, support, safety, uptime, account access, matching quality, checkout, receipts, refunds, and platform value.
- Do not store excerpts from quarantined Copilot/OneDrive chat exports as active
  memory. If a historical fact is needed, verify it against current repo/live
  systems and record the validated result in a dated briefing first.

## Entry Shape

Each memory entry should be short and operational:

```json
{
  "title": "What changed or what agents need to know",
  "body": "Concrete fact, decision, blocker, or next action.",
  "scope": "global",
  "source_agent": "codex",
  "agents": ["claude", "gemini"],
  "nodes": ["sabretooth", "t5500"],
  "tags": ["handoff", "mission-control"]
}
```
