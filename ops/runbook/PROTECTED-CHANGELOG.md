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

2026-09-19 21:56 EDT | scripts/drift.cmd | added ONE new subcommand "reddit-setup" (specs/010-social-publish-pipeline, unit 4), dispatching to `node mission-control/scripts/reddit-setup.mjs`; copied byte-identical to C:\Users\joshi\.local\bin\drift.cmd (diff-verified) — no other line in this file touched | db5865b9

2026-09-18 02:50 EDT | ops/skills/sabretooth-node/SKILL.md | Alienware SSH access (key-only, 192.168.0.40), its layout, and the empty-OmniRoute note | 0d19ac94
2026-09-18 06:35 UTC | ops/skills/sabretooth-node/SKILL.md | Fable's Sentry consolidation: removed the ":9140" restart-set row and rewrote the "One Mission Control" bullet to say the probe engine is folded into JARVIS (mission-control/lib/sentry.mjs, /api/sentry, /api/sentry/summary) — no separate wall service. Tracked copy of the launch skill; the user copy at C:\Users\joshi\.claude\skills\sabretooth-node\SKILL.md was synced byte-identical. | 21603fd3

2026-09-18 06:35 UTC | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md | Fable's Sentry consolidation: removed the ":9140" row from the §3 restart-set table (renumbered the rest, folded in the Domains :9160 row that was missing), rewrote §2's "God's Eye" mapping line, and updated `drift audit`/`drift wall` in §4 to describe JARVIS's own /api/sentry instead of a separate service. | 21603fd3

2026-09-18 06:35 UTC | scripts/drift.cmd | Fable's Sentry consolidation: `drift wall` now opens JARVIS (http://192.168.0.8:9150/, God's Eye) instead of the retired :9140 page; updated the usage/help comments and the stack-summary comment block to match. Tracked copy; C:\Users\joshi\.local\bin\drift.cmd was synced byte-identical. | 21603fd3

2026-09-18 06:35 UTC | scripts/fables-house/FABLES-HOUSE.ps1 | Fable's Sentry consolidation (Joshua's ruling): removed the "FABLE'S SENTRY :9140 (wall display)" stage entirely — the probe engine is folded into JARVIS itself (mission-control/lib/sentry.mjs, already carried by the existing JARVIS stage), so there is nothing left on :9140 for the House to bring up or heal. Left an explanatory comment in its place; updated one stale comment ("MC5 and Sentry stages" -> "MC5 stage") elsewhere in the file. No other lines touched. | 21603fd3

2026-09-18 04:42 UTC | scripts/fables-house/FABLES-HOUSE.ps1 | Cloudflared tunnel stage bugfix: heal now identifies the real sabretooth-main process by command line (Win32_Process filter), not by `Get-Process cloudflared` name-match alone — an unrelated OmniRoute quick-tunnel is also named cloudflared.exe and was making the House believe sabretooth-main was up when it was down. Public identity probe (youandinotai.com / assets/index-) stays the source of truth for UP; command-line match now also drives the stop-before-restart step so the quick-tunnel is never touched. Command lines are never logged, only PID + "sabretooth-main" | cc319de3
2026-09-18 04:40 UTC | ops/runbook/SABRETOOTH-NODE-RUNBOOK.md | added "## 12. Domains" section — vhost static server on :9160, tunnel ingress + DNS for the three landing sites and dashboard.aidoesitall.website, Cloudflare Access sign-in, pending IONOS registrar click, new health probes | 4c92ef74

2026-09-18 04:35 UTC | scripts/fables-house/FABLES-HOUSE.ps1 | added ONE new optional stage "Domains static sites :9160" (probe /health for domains-server identity, heal starts ops/domains-server/server.mjs) — Domains phase Unit 2, no other lines in this file touched | 2f326da4

Entries below cover 2026-09-17, backfilled from `git log` for
`ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` and `ops/skills/sabretooth-node/SKILL.md`,
plus the House and drift.cmd commits Joshua named directly. Commit hashes
are the current `main` hashes — the repo's 2026-09-17 history purge rewrote
the hashes these changes originally landed under.

2026-09-17 23:30 EDT | ops/skills/sabretooth-node/SKILL.md | game vault path corrected to C:DREAMdream-onlineDREAM-ONLINE (id 2289237e7c63ff36) | e2dd35f8
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
