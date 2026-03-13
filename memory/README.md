# MEMORY BANK — OPUS PERSISTENT MEMORY SYSTEM

This directory IS the memory. Every file here is auto-loaded by Claude Code via CLAUDE.md.
When context resets, this is what survives.

## HOW IT WORKS

1. Claude Code reads `CLAUDE.md` at session start
2. `CLAUDE.md` says "read memory-bank/" 
3. Every new Claude session has FULL context instantly

## FILES

| File | Purpose |
|------|---------|
| `activeContext.md` | What you're working on RIGHT NOW |
| `CODEX-QUICK-MEMORY.md` | Fast re-anchor file for Codex and agent routing truth |
| `projectState.md` | Complete state of every repo, deployment, domain |
| `decisions.md` | Every architectural decision + WHY |
| `credentials-map.md` | Where every key/token/secret lives (paths only, no values) |
| `identity.md` | Who Joshua is, the mission, the stakes |
| `techStack.md` | Every technology, version, config across all nodes |
| `sessionHandoff.md` | Last session's final state — copy-paste for new sessions |

## RULES

- **NEVER delete files** — append or update
- **Timestamp every update** with ISO format
- **Claude Code MUST update activeContext.md** at end of every session
- **sessionHandoff.md** gets rewritten at end of every session
- Shared tracked memory stays operational and secret-free
- Put secret-bearing or node-local notes in `memory/local/` or `memory/private/` so they stay available on the machine but out of git

---
> "AI for kids in need, not adults with greed."
> 
> **Until no kid is in need. #FORtheKIDS 🚀**
