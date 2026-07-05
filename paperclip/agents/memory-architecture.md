# Paperclip Agent Memory Architecture

**Version:** 1.0  
**Authority:** Joshua Coleman (`Trollz1004`) / CEO Agent  
**SOL Anchor:** `SOL.md`

---

## Goal

- Survive restart / power loss.
- Slash per-session token burn by replacing giant prompt dumps with a compact, capped state file.
- Give every Paperclip agent a single, auditable `STATE.md` that is read on entry and written on exit.
- Persist the same truth to a Supabase-backed "brain" so state survives even if local files are lost.
- Make the CEO enforce this pattern for every agent ever created.

---

## Core Pattern: 1 File Per Agent

Every canonical PaperclipAI standing CEO or temporary subagent has:

```text
paperclip-tro/agents/{agent}/
├── AGENTS.md      # static identity + rules (protected, read-only)
├── HEARTBEAT.md   # current status + pulse checks (read-only entry snapshot)
├── TOOLS.md       # capability map + skills index (read-only entry snapshot)
└── STATE.md       # COMPACT rolling state: read on entry, write on exit
```

### STATE.md responsibilities

- Hold only **what changed this session**: decisions made, tasks completed, blockers, next actions.
- Summarize older state aggressively so the file never grows past its cap.
- Be the **only file an agent writes** during normal operation.
- Be mirrored to Supabase on every exit.

### Entry protocol (every session)

1. Read `AGENTS.md` + `HEARTBEAT.md` + `TOOLS.md` once (static, small).
2. Read `STATE.md` (compact rolling state).
3. Read Supabase `paperclip_agent_state` row if `STATE.md` is stale or missing.
4. Produce a 3-line `CEO ENTRY:` summary.

### Exit protocol (every session)

1. Append a concise session delta to `STATE.md`.
2. If the file exceeds its size cap, compress history into a `STATE-SUMMARY` block and drop detailed older lines.
3. Write the same delta to Supabase `paperclip_agent_state`.
4. Produce a 3-line `CEO EXIT:` summary.

---

## Size Caps

| Agent | STATE.md cap | Rationale |
|---|---|---|
| `ceo` / `claude-ceo` | 16 KB | Code, compliance, doctrine, payments, merge/push, PR gates. |
| `hermes-ceo` | 14 KB | Growth, support, research, external APIs, leads, workspace memory. |
| temporary subagent | 8 KB | Task-specific state only; archive/delete when task closes unless promoted. |

**Audit rule:** Mission Guardian checks each `STATE.md` size on every run. Any file > cap is flagged.

---

## Supabase Brain Schema

Table: `paperclip_agent_state`

| Column | Type | Purpose |
|---|---|---|
| `agent_id` | text, PK | e.g. `paperclip-agents-ceo` |
| `state_md` | text | Full `STATE.md` content. |
| `checksum` | text | SHA-256 of `state_md` for integrity. |
| `updated_at` | timestamptz | Last write. |
| `node_id` | text | Source node (`sabretooth`, `t5500`, etc.). |
| `session_count` | int | Incremented on each exit write. |

Row-level security (RLS): service-role key only; agents never expose state to public.

---

## Required Env

The memory bridge and Paperclip startup script both load env in this priority:

1. `C:\antigravity\.env.paperclip` — stable, repo-local, gitignored, NOT inside a timer-locked vault.
2. `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` — fallback / backup.
3. `C:\antigravity\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` — secondary fallback.
4. `.env` in repo root — final fallback.

Only keys required for the brain:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (service role key)
- `SUPABASE_PUBLISHABLE_KEY` (anon/public key also accepted as fallback)

If the local `.env.paperclip` is missing or its keys are still `YOUR_*_HERE` placeholders, the bridge will fall back to local `STATE.md` and warn.

---

## MCP / Brain Connector

A lightweight MCP plugin exposes two tools:

- `paperclip_memory.read_state(agent_id)` — returns current `state_md`.
- `paperclip_memory.write_state(agent_id, delta_md, node_id)` — appends, caps, and persists.

The connector lives in `paperclip-mcp-plugins/paperclip-memory/` and uses the existing Supabase server env vars. If Supabase is unreachable, it falls back to the local `STATE.md` file and logs a warning.

---

## CEO Enforcement Rule

Any new agent created under PaperclipAI must:

1. Live in `paperclip-tro/agents/{slug}/` on `main`.
2. Have `AGENTS.md`, `HEARTBEAT.md`, `TOOLS.md`, and `STATE.md`.
3. Use the read-on-entry / write-on-exit protocol.
4. Have a documented `STATE.md` size cap ≤ 16 KB.
5. Mirror state to Supabase `paperclip_agent_state` on exit.
6. Reference `.agents/skills` via `TOOLS.md` index, never by embedding skill text.

Claude CEO or Hermes CEO blocks any agent that does not meet these criteria.

---

## Token-Cost Reduction Rules

1. **Never re-read huge docs.** `AGENTS.md` + `HEARTBEAT.md` + `TOOLS.md` + `STATE.md` are the only Paperclip files loaded per session.
2. **Reference, don't embed.** Skills, playbooks, and long docs are referenced by path in `TOOLS.md`.
3. **Summarize in `STATE.md`.** Older work is compressed; only recent deltas are detailed.
4. **No runtime log dumps.** Audit logs, full git history, and large JSON exports are read only when explicitly needed.
5. **MCP lookup on demand.** The Supabase brain is queried only when state is missing locally or cross-node sync is required.

---

## Recovery After Power Loss

1. PaperclipAI restarts automatically via the Windows Scheduled Task `PaperclipHQ-Watchdog` (registered by `scripts/paperclip/setup-windows-autostart.ps1`).
2. The watchdog starts the local PaperclipAI listener on `:3110`; Agent Hub remains the dispatcher on `:3130`.
3. Agent reads local `STATE.md`. If missing or older than Supabase `updated_at`, pulls from Supabase.
4. Agent reads `AGENTS.md`, `HEARTBEAT.md`, `TOOLS.md` (small static files).
5. Agent resumes from the last exit summary + open blockers.
6. No full doctrine dump is required.

See [`windows-runtime-checklist.md`](windows-runtime-checklist.md) for the full dependency list.

---

## Output Formats

### Entry summary
```text
CEO ENTRY: {agent_id}
LAST STATE: {date} | {session_count} sessions | {blockers}
FOCUS: {top 1-3 next actions}
```

### Exit summary
```text
CEO EXIT: {agent_id}
DELTA: {what changed this session}
NEXT: {top next action}
SIZE: {N} KB / {cap} KB
```
