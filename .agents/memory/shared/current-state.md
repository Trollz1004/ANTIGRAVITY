# Shared Agent Memory — Current State

> **SUPERSEDED — DO NOT READ AS CURRENT (marked 2026-08-25, judge lane).**
> Everything below is a snapshot from 2026-07-09 describing a topology that no
> longer exists: a T5500 business node, Sabretooth as a DREAM-only node, an
> Agent Hub, an OmniRouter on :11436, and FCC agents on :8082. None of that is
> true now. Sabretooth is the only node, `C:\ANTIGRAVITY` is the sole working
> tree, Mission Control is Paperclip at `http://127.0.0.1:3100`, and **FCC is
> permanently banned** (`agent-contracts/FCC-STATUS.md`). Any `fcc-claude`
> provider entry in the table below is a dead record, not a configured agent.
> For real current state read `AGENTS.md`, `CLAUDE.md`, and
> `agent-contracts/MISSION-CONTROL-GOVERNANCE.md`. Kept only as append-only
> history.

> Append-only after decisions. All agents may READ. No agent may SUMMARIZE or MODIFY another agent's private journal.
> updated: 2026-07-09T07:41:00Z

## Active Architecture

- Business node: T5500 (192.168.0.8) — ANTIGRAVITY, youandinotai.com, Cloudflare, date app, Agent Hub :3130
- DREAM node: Sabretooth (192.168.0.8) — DREAM Online MMO ONLY
- Repo: Trollz1004/ANTIGRAVITY, branch main, C:\antigravity on T5500 (restore pending — see incidents)

## Active Agents

| Agent           | Status     | Node  | Provider             |
| --------------- | ---------- | ----- | -------------------- |
| ceo             | configured | t5500 | fcc/claude           |
| hermes-ceo      | configured | t5500 | hermes-router        |
| fcc-claude      | configured | t5500 | fcc :8082            |
| hermes          | configured | t5500 | hermes-router :11435 |
| ollama-worker   | configured | t5500 | ollama :11434        |
| opencode-worker | configured | t5500 | opencode             |
| ant-dev         | configured | t5500 | fcc-claude           |
| ant-reviewer    | configured | t5500 | fcc-claude           |
| ant-devops      | configured | t5500 | fcc-claude           |
| ant-compliance  | configured | t5500 | fcc-claude           |
| ant-growth      | configured | t5500 | hermes               |
| ant-support     | configured | t5500 | clawx                |
| ebay-lister     | configured | t5500 | ollama               |
| aisol-dev       | configured | t5500 | fcc-claude           |

## Services (T5500)

- OmniRouter :11436 — token routing (start: scripts/start-omni-router.ps1)
- Agent Hub :3130 — task dispatch + leads CRM
- Hermes dashboard :9119 (factory port; the :3000 workspace GUI is retired)
- FCC proxy :8082
- YouAndINotAI API :8000
- Ollama :11434
- PaperclipAI :3110

## Open Incidents

- RESTORE PENDING: Gordon force-push orphaned true tip 66c8390. Run Desktop\RUN-NOW-restore-and-verify.bat on T5500 FIRST before any code work.
- GitHub branch protection on main: not yet enabled (30-sec job after restore)
- Codex governance prompt: not yet run (pending restore)
- Desktop Commander: disabled in claude.ai — re-enable after restore

## Revenue Status (2026-07-09)

- Stripe: $0 revenue, 0 active subscriptions
- GA4: near-zero traffic across all 3 properties
- Square on youandinotai.com: payment rail configured but no live customers yet
- Next action: first paying customer
