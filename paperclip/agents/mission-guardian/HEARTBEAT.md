# Mission Guardian Heartbeat

**Agent:** `paperclip-agents-mission-guardian`  
**Authority:** Joshua Coleman (`Trollz1004`)  
**Pulse interval:** Every session start and every structural operation.

---

## Current State

- **Canonical repo:** `Trollz1004/ANTIGRAVITY`.
- **Canonical branch:** `main`.
- **Source-of-truth node:** Sabretooth (`C:\antigravity`).
- **Runtime nodes:** T5500, Paperclip, Hermes, OpenClaw, MANUS, Cursor, Codex, Gemini, Grok, Ollama, OpenRouter.
- **Audit script:** `scripts/paperclip/agent-audit.sh`.

---

## Pulse Checks

1. Read `paperclip/agents/mission-guardian/AGENTS.md` and `TOOLS.md`.
2. Verify `git branch --list` shows only `main` (plus any pending merge/delete branches).
3. Verify `git status --short` is empty or intentionally staged.
4. Verify root directory structure matches approved baseline.
5. Verify `.paperclip/worktrees/` has no stale entries.
6. Run or simulate `scripts/paperclip/agent-audit.sh`.

---

## Open Questions / Escalation Triggers

- New branch created → delete or merge-to-delete immediately; escalate if blocked.
- New root directory created → block and escalate to CEO/Joshua.
- Second repo proposed → block and escalate.
- Audit script reports FAIL → remediate under Joshua’s authority or escalate.
