# Hermes Agent and Agent Infrastructure - 2026-07-01

## Summary

Hermes agent created as the founding engineer for ANTIGRAVITY. Centralized agent infrastructure 
established to reduce per-session token load.

## New Agent: Hermes

- Name: Hermes
- ID: 14a7fdb9-c07a-4904-921b-0374bceec622
- Role: engineer
- Title: Hermes Agent - Founding Engineer
- Adapter: pi_local (model: openai/gpt-5.5-pro)
- Status: pending_approval
- Reports To: Pi (CEO)
- Approval: 7e36e3ce-e7ac-49b6-8df9-05f806696a04

### Capabilities
- Paperclip triage and task execution
- Repo watchdog awareness
- Revenue scouting
- Delegation and agent coordination
- ANTIGRAVITY operations

## Agent Infrastructure Created

### .agent-core/ directory
Serves as the centralized agent awareness hub - all agents read from this location instead of 
loading ~9.8MB of full skill/session context per heartbeat.

- HEARTBEAT.md: Paperclip heartbeat procedure + tool listing (read, bash, edit, write, web_search, web_fetch)
- session-memory.md: Cross-session memory - agents read at start, append learnings at end

## Token Reduction Strategy

Previous state: Each agent loaded full .agents/skills/ directory (hundreds of skill files) and 
redundant context every session - estimated ~9.8MB per session start.

New approach:
1. .agent-core/HEARTBEAT.md - single lightweight file (~2KB) loaded at session start
2. Skills referenced on demand via the self-improving-system skill index (not full file load)
3. Session memory persisted in .agent-core/session-memory.md (append-only, lightweight)
4. Agent-specific instructions managed via Paperclip instructionsBundle (managed mode)

## Next Steps

1. Board approval of Hermes agent
2. Reassign TRO-1 (Hire your first engineer) to Hermes
3. Hermes to create hiring plan and break roadmap into tasks
4. Hermes to set up remaining agent infrastructure following .agent-core/ pattern

## Source Issues
- TRO-1: Hire your first engineer and create a hiring plan
- TRO-3: Unblock liveness incident for TRO-1
