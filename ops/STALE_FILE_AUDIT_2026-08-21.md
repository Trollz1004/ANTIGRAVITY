# Stale File Audit — 2026-08-21

> **Scope:** Response to issue #220 (Hermes Contract Integrity Watchdog review) and the
> follow-up request to audit the repository for not-needed files, scripts, and stale docs
> before pulling a clean copy onto marketing nodes. This is a static, read-only audit —
> nothing was deleted here beyond the one item classified as safe below, and every other
> candidate is left for an explicit owner decision, consistent with the precedent set in
> `ClawX/docs/ARCHIVE_CLEANUP_DECISION_2026-08-19.md`.

## Issue #220 disposition

The watchdog flagged commit `9fea5dc4da5d7984396ce809d7986c6694d81dad`, which rewrote
`agent-contracts/HERMES-AGENT.md`, added `agent-contracts/JOURNAL-PROTOCOL.md`,
`.agents/harness-config/hermes.yaml`, `.agents/journals/hermes/STATE.md`, and
`.agents/skills/hermes-agent-skill-authoring/SKILL.md`. The workflow's own authorization
check (`.github/workflows/hermes-integrity-watchdog.yml`) lists `Trollz1004` as an
authorized modifier, and the issue itself records `Authorized modifier: true` with
severity `REVIEW` (not `URGENT-UNAUTHORIZED`). No drift beyond the authored diff was
found. **Disposition: legitimate, authorized contract update — approved for closure.**

## Removed in this pass

| Path | Classification | Reason |
|---|---|---|
| `.agents/skills/skills/` (571 files, ~4.5 MB) | Confirmed non-canonical duplicate | A nested, older/stripped copy of 28 of the 54 top-level skill directories. Every skill name inside it already exists in the canonical `.agents/skills/` tree with no unique files found only in the nested copy (`diff -rq` shows zero `Only in .../skills/skills` entries). Already called out as non-authoritative in `CLAUDE.md` ("The nested duplicate and stripped copies are not a second source of authority") and flagged for deletion in `briefings/CLAUDE-SYNTHESIS-AND-MANUS-FINALIZATION-2026-08-19.md` item P2 #11. No code or config references the `skills/skills` path. |

## Candidates found, retained pending an explicit owner decision

Per the same conservative standard used in `ARCHIVE_CLEANUP_DECISION_2026-08-19.md`
("neither a path name nor an age stamp alone proves safe deletion"), the following were
identified but **not** touched in this pass:

| Path | Observation |
|---|---|
| `agents.json` (repo root) | Retired Paperclip "CEO" roster entry with `dangerouslySkipPermissions: true` and a stale `F:/ANTIGRAVITY` working directory. No script in the repo reads `agents.json` (verified by search), so it is currently inert, but it is a landmine if any tool starts reading it again. |
| `skills-lock.json` -> `agent-browser` entry | Locks a skill at `skills/agent-browser/SKILL.md`, which does not exist anywhere in the tree (only `browser-use` exists). The lock entry is stale relative to the actual installed skill set. |
| `gateway.cmd` (repo root) | Windows launcher hardcoded to `C:\Users\joshl\...` paths for an OpenClaw gateway; likely superseded, but its live/dead status can't be confirmed from static analysis alone. |
| `archive/root-cleanup-2026-08-16/` (~330 files) | Already a self-labeled archive of a prior cleanup pass (legacy prototypes, prospecting data, agent-work-product scan dumps). No active source references it. Large, but historical business/audit evidence -- matches the "retained pending further evidence" classification from the 2026-08-19 archive decision, so it's left untouched here too. |
| `mission-control-v5/` vs `mission-control-v6/` | Two full app trees with overlapping purpose. Determining which is the live one needs a runtime/owner decision, not a static file check. |

## Recommendation

The single removal above is safe to take immediately. The remaining candidates should be
resolved by Joshua directly (or through the judge/review lane this repository already
uses for other contract and archive decisions) before any further deletion, since each
requires either a runtime check or a business-content judgment call that a static audit
cannot make safely.
