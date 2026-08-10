# AGENT-DOCTRINE.md — 4-Lane Architecture

Referenced by the global boot doctrine (`~/.claude/CLAUDE.md`) as the
self-improving state protocol. Did not exist before 2026-07-13; this is
the first version, written to match Josh's explicit instruction:

> "have all agents read write to that 1 memory problem solved should only
> be claude hermes open claw fcc these all spawn sub agents of opencode
> ect 1 omni router 1 memory graphy 1 heart beat saying tools available
> read write to memories journals every session then mission on new set
> tires less drift more cruise control for mission success"

## The 3 Agent Lanes (simplified 2026-07-13)

Josh's own words: "if just omni router just pieces with agency skills
3 agents claude hermes open claw ... all on just 1 api pointed omnirouter
chooses best available." Three top-level agent lanes, not four. Everything
else is a sub-agent spawned by one of these three — not an independent peer.

1. **Claude** — Real Claude (Max), `~/.claude` config dir. Co-founder /
   orchestrator. Seat: `paperclip-tro/agents/ceo/`.
2. **Hermes** — router service, `localhost:11435`. Research/synthesis,
   WhatsApp gateway. Reactive-only (see `feedback_hermes_reactive_only`).
3. **OpenClaw** — support-only fleet, Ollama-backed. Seat:
   `paperclip-tro/agents/ollama-worker/` or equivalent. Never governs
   platform/payments/doctrine.

**FCC** is not a 4th memory-writing lane. It's a Claude-API-shaped worker
(`~/.claude-fcc` config dir, proxy `127.0.0.1:8082`) that, like every
other model call in this system, goes through OmniRoute rather than
holding its own provider key. It keeps its own config dir (hard rule:
never share config dirs between lanes) but is not one of the three
agents that own a memory-graph/journal seat.

Sub-agents (OpenCode, Ollama model workers, Gemini, Codex, Manus, etc.)
run *under* one of these three for a specific task. They do not get their
own top-level seat, their own memory-graph credentials, or independent
authority. If a sub-agent needs to persist something, it writes through
the lane that spawned it.

One API surface: every lane and every sub-agent reaches models only
through OmniRoute, which picks the best available model for the job.
No agent picks a provider directly.

## 1 OmniRoute

No agent talks to a model provider directly. Agents talk to OmniRoute;
OmniRoute talks to the world. Sabretooth `192.168.0.8:20128` (brain/agent
node), T5500 `192.168.0.15:20128` (front-door/payments node). Auth =
`OMNIROUTE_KEY` env var only. Fail-closed.

Corrected 2026-07-13 via multi-agent drift audit: this file originally had
Sabretooth and T5500's IPs swapped (wrote `192.168.0.8` for T5500). Every
other doctrine source (repo `CLAUDE.md`, `.claude/agents/Goal.md`,
mission-control `app.jsx`, `ClawX/src/docs/MASTER-INVENTORY.md`,
`HERMES-SESSION-HANDOFF.md`) agrees: `192.168.0.8` = Sabretooth,
`192.168.0.15` = T5500. Also unresolved from that same audit: `SOUL.md`
says the live OmniRoute gate is port `20128`, but
`services/omni-router/.env.example` and `.agents/memory/shared/
current-state.md` say `11436` — not yet reconciled, verify live before
trusting either.
Never set `ANTHROPIC_BASE_URL` directly. (Already-standing rule — this
file does not change it, only restates it as part of the 4-lane picture.)

## 1 Memory Graph

RETIRED (Joshua, 2026-08-10): Pieces LTM is no longer free and is no
longer part of this stack. Do not read from or write to `mcp__pieces__*`,
and do not treat old Pieces memories as live truth.

The shared memory system is now in-repo markdown, versioned with the code:

- **Journals** — append-only per-seat journal/wheel-log files (the
  wheel-log pattern at `paperclip-tro/agents/ceo/wheel-log-*.md`,
  generalized per seat). Short, evidence-backed, timestamped entries.
- **STATE.md files** — the session diary convention
  (`ops/ceo-harness/STATE.md` template, ≤15 lines, overwritten each
  session): what changed, nodes, TODO, quota.
- **Graphify** — the graph *view* over the workspace
  (`graphify-out/graph.html`); a visualization of state, not a separate
  store of truth.

Before assuming a remembered fact is still true, verify against live
files/services — memory entries that name a specific file, function, or
flag go stale. Claude's own `~/.claude/projects/.../memory/` remains
Claude-only personal memory and is unchanged by this.

## 1 Heartbeat

Every session, each of the 4 lanes should, at minimum:

1. State what tools are actually available this session (OmniRoute
   reachable? journal path writable?) — don't assume last session's
   tool list still holds.
2. Read its own journal/seat file before acting (Claude: wheel-log at
   `paperclip-tro/agents/ceo/`; Hermes/OpenClaw/FCC: their own seat dirs
   once created — not yet built, see Open Items below).
3. Write a short status line to its journal and, for anything
   durable/cross-lane-relevant, to the shared STATE.md before ending
   the session.

This is a lightweight convention, not new infrastructure — it matches
the wheel-log pattern already in live use at the CEO seat
(`paperclip-tro/agents/ceo/wheel-log-*.md`), generalized to all 4 lanes
instead of reinvented per-agent.

## Open Items (not yet done as of 2026-07-13)

- Hermes/OpenClaw/FCC seats do not yet have their own HEARTBEAT/journal
  files — only the Claude/CEO seat does (as wheel-logs).
- Pieces retirement (2026-08-10): any remaining `mcp__pieces__*` wiring
  in configs/scripts should be removed as encountered; nothing new may
  depend on it.
- Global boot doctrine's skills section (`~/.claude/CLAUDE.md`) still
  says "219 registered" — verified actual count is 26 symlinked /
  197 master copies. Correction drafted, not yet applied — awaiting
  explicit go-ahead to edit that file.
