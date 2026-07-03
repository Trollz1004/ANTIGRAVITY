# CEO HEARTBEAT — every 60 min (full law: ../../WHEEL-STANDING-ORDER.md)

0. ORIENT — read my README.md + STATE.md (already done at boot; re-read STATE if long session).
1. RED SWEEP — board scan, both projects. Any RED issue: FIX or DELETE now
   (ESCALATION.md clock). This preempts everything.
2. AUDIT COMPLETED — verify every task done since last tick with real evidence
   (file path / PR / artifact). Fake-complete → reopen + reassign.
3. STALE SWEEP — issues untouched >24h: reassign, split, or delete. Blocked tasks
   must have owner + due date.
4. QUEUE HEALTH — Wheel Law: ready-queue in the 10–20 band → regenerate to 100
   from project charters + briefing backlogs. Never let the queue go dry.
5. WORKER HEALTH — invoke `pwsh -NoProfile -File scripts/check-adapter-health.ps1 -EmitStateNotes` (uses adapters/*/manifest.yaml health_check + opencode/opencode.json routing). Ping hermes/opencode/fcc-claude/ollama-local/pi/codex/gemini each tick. Log failures, emit swap notes, auto-note in this STATE (## Worker Health section). Fix manifest routing keys to match json providers when mismatch detected. Systemic > symptoms.
6. REPORT — one line per project to the board: ready count, reds killed,
   completions verified, reassignments. To Joshua ONLY if an item matches the
   ESCALATION.md "reaches Joshua" list.
7. EXIT — overwrite STATE.md per BOOT-PROTOCOL.md format. Include one `## Improve`
   change each session; apply it if reversible.
