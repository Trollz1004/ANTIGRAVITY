# Protected files changelog

Ruled 2026-09-17: only official Claude, reached through `drift` on the
Sabretooth node, edits the protected paths (`scripts/fables-house/**`,
`scripts/drift.cmd`, `ops/runbook/**`, `ops/skills/sabretooth-node/**`,
`docs/PAYMENTS-TRUTH.md`, `docs/NODE-STATE-*.md`, `.github/**`, and the
drop box `C:\Users\joshi\OneDrive\claude-to-claude\`). Not Hermes, not
OpenClaw, not OpenCode, not a subagent acting on its own — and Joshua
himself has never edited a Claude file or memory and does not intend to.
Every edit to one of these paths gets a line here: date, time, file, what
changed, and the commit that landed it. `.github/CODEOWNERS` and the
`.claude/hooks/guard-protected-paths.ps1` reminder enforce this
mechanically; this file is the human-readable record. Newest entries first.

Entries below cover 2026-09-17, backfilled from `git log` for
`ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` and `ops/skills/sabretooth-node/SKILL.md`,
plus the House and drift.cmd commits Joshua named directly. Commit hashes
are the current `main` hashes — the repo's 2026-09-17 history purge rewrote
the hashes these changes originally landed under.

2026-09-17 21:45 EDT | .github ruleset main-quality-gate (id 23633706) | created active, then set to disabled (evaluate mode is Enterprise-only) because GitHub Actions is billing-locked on the account and no quality-gate check can run; re-enable when Actions runs (gh api -X PUT repos/Trollz1004/ANTIGRAVITY/rulesets/23633706 -f enforcement=active) | see git log
2026-09-17 21:40 EDT | docs/NODE-STATE-2026-09-17.md | signed node state record created, SHA-256 anchored (9ae2de3c), verify-and-countersign convention below the anchor | 388a4ef5
2026-09-17 21:40 EDT | ops/skills/sabretooth-node/SKILL.md | protected-files ruling, signed-artifact verify/countersign rule, landing rule, one-repo statement, drop box, hardware, Obsidian second-brain commands | 388a4ef5
2026-09-17 20:55 EDT | scripts/fables-house/tab-dateapp.cmd, scripts/fables-house/tab-dateapp-api.ps1 | date-app launch scripts moved to domains/youandinotai.com | 16e5e60f
2026-09-17 20:40 EDT | scripts/fables-house/FABLES-HOUSE.ps1 | MC5 (:3151) and Stack Health (:8787) stages removed | 732f2b24
2026-09-17 20:37 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md, ops/skills/sabretooth-node/SKILL.md, scripts/fables-house/FABLES-HOUSE.ps1 | folded ops/dashboard-jarvis into mission-control/, updated references | c2fe2b7b
2026-09-17 19:58 EDT | ops/skills/sabretooth-node/SKILL.md | launch skill switched to obsidian-second-brain commands; Obsidian survey note | c6c52440
2026-09-17 19:35 EDT | ops/skills/sabretooth-node/SKILL.md | Phase E dispatch (archify panel, copy score, review workstation), absorb survey, launch skill update (boot task, paused crons, drop box, vault notes, traps) | ac8aee50
2026-09-17 19:35 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md | git panel hermes path fixed to use homedir, not a hardcoded username (Phase B) | de50136f
2026-09-17 19:30 EDT | scripts/fables-house/FABLES-HOUSE.ps1 | House stale-heal fix: JARVIS heal restarts a stale-but-correct process instead of looping | e4a3a801
2026-09-17 19:27 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md, scripts/fables-house/FABLES-HOUSE.ps1 | House boot task + health S4U: boot-start task (S4U, no stored password), health probe runs pre-login | e3272088
2026-09-17 18:07 EDT | ops/skills/sabretooth-node/SKILL.md | Spec Kit installed, constitution, first spec, Spec Kit panel noted (Phase A) | 3ff79900
2026-09-17 15:31 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md, scripts/fables-house/FABLES-HOUSE.ps1 | House tunnel stage: optional VS Code tunnel keeps JARVIS remote access up after reboot | 0bbf1e78
2026-09-17 15:09 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md | noted auto-heal model step is opt-in and off by default, matching the script | 67023b94
2026-09-17 15:08 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md | tunnel-safe client documented — all sources proxied through :9150, relative URLs, remote-access runbook section | 76a4fa17
2026-09-17 14:57 EDT | scripts/drift.cmd, scripts/fables-house/FABLES-HOUSE.ps1 | House JARVIS stage + MC5 optional, and drift.cmd skill prompt + jarvis/health subcommands: JARVIS is the one Mission Control on :9150 (AIRI retired, MC5 optional), drift loads the sabretooth-node skill, 30-min deterministic health probe with triggers | 09ca78e6
2026-09-17 14:44 EDT | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md, ops/skills/sabretooth-node/SKILL.md | runbook created — one Mission Control ruling (JARVIS :9150), dashboard inventory, sabretooth-node launch skill | 6d3db346
