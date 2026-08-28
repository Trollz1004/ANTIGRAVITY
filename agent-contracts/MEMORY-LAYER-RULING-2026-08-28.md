# Memory layers — what is authoritative, and what is only recall

**Judge lane, 2026-08-28.** Joshua asked whether Supermemory is worth using and
whether it beats Obsidian. Measured before answering.

## What actually exists

| Layer | Measured | Verdict |
|---|---|---|
| **Paperclip** | **1** memory-ish route in 526: `/api/issues/{id}/heartbeat-context` — per-issue heartbeat context, not memory | **No memory layer at all.** A real gap. |
| **Agent journals** (`.agents/journals/*/STATE.md`) | **3,442 lines / 368 KB** across 8 files. `paperclip-judge` alone is **2,177 lines / 184 KB** | Authoritative, and past what any agent should read at session start |
| **Obsidian** (`nodes/9020/vaults/knowledge/`) | **11 notes / 49 KB** | Barely used. One note is `node-9020.md` — documenting a node that does not exist |
| **Supermemory** | Live, authenticated, MCP tools loaded, SessionStart hook active | Fills the Paperclip gap |

## The answer

**Supermemory is worth it, and it is not competing with Obsidian.** Obsidian was
never really in the game here — 11 notes, one of which is itself drift. The gap
Supermemory fills is real: Paperclip has no memory, and a 2,177-line journal does
not scale as session-start context.

## The rule, because the risk is specific

Supermemory **auto-injects at session start**. If it learns something false, it
re-injects that falsehood forever, silently, into every future session. That is
drift with a cloud amplifier — the exact failure this repo spent a full session
digging out (the `E:` drive, the T5500 that was this machine, a working-hours
rule fabricated from a 403).

Git journals have one property a vector store cannot match: **`git log -S`**.
That is literally how the fabricated hours rule was traced back to the commit
that invented it. You cannot bisect a vector store.

So:

- **Git is authoritative.** Doctrine, governance, node topology, rulings, and
  anything an agent must not get wrong lives in `CLAUDE.md`, `AGENTS.md`,
  `agent-contracts/`, and `.agents/journals/`. Versioned, diffable, traceable.
- **Supermemory is recall only.** It speeds up finding what happened. It is
  **never** a source of truth for a governance fact.
- **When they disagree, git wins** — and the Supermemory entry gets corrected
  with `add_memory action:"forget"`, not left to keep re-injecting.

## What may be written to Supermemory

Only facts that are (a) verified with evidence in-session, (b) durable rather
than session-specific, and (c) expensive to rediscover. Highest value are
**corrections to beliefs that were confidently wrong**, since those are what get
re-derived incorrectly.

Seeded 2026-08-28 in space `repo_antigravity__02249b9e7104105f`:
1. Node topology — one node, `192.168.0.8` IS Sabretooth, no T5500/9020/Aurora, no `E:`.
2. Hermes bot traps — `--clone-from` silently drops `auth.json`; `stealth/ox-alpha` is a dead model; bots route via OmniRoute while Hermes default stays on Nous; gateway serves `/health` not `/api/health`.
3. Four corrections to confidently-wrong claims — the agency skills DO exist (in the laptop vault); archiving a repo does NOT take its content offline; the OmniRoute schedule WAS real (wrong db file + wrong column name produced a false all-clear); Unreal MCP is not the backend API.

## Do not write to Supermemory

Secrets or key material of any kind. Anything still being decided. Anything
contradicting a git-tracked ruling. Session chatter.

## The unaddressed problem

None of this fixes `paperclip-judge/STATE.md` at 2,177 lines. Retrieval makes it
cheaper to *query*; it does not stop the file growing. That journal needs
compaction on its own merits — the `self-improving-system` skill exists for
exactly this and is not being applied to it.
