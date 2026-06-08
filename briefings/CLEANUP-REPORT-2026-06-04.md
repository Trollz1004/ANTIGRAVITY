# Cleanup Report — 2026-06-04 (Sabretooth C: + mission-control swap)

**Branch:** claude/mission-control-swap-and-disk-cleanup
**Commit SHA:** 5c0d81ab1267351a12a22962b628918be711f434
**READY-TO-PUSH file:** briefings/READY-TO-PUSH-2026-06-04.txt (contains branch + sha)
**RUNBOOK:** briefings/RUNBOOK-aidoesitall-dns-swap-2026-06-04.md written (Josh executes DNS)
**Build verified:** dist/index.html present with OPUSHASHANDS title = True
**Doctrine grep hits in _deploy/aidoesitall-www:** 0 (0 = clean, no drift issue opened)

## Bytes freed (from services/hermes-router/audit/2026-06-04.jsonl + measurements)
- Group1 (pnpm store 1.55GB + hermes dumps ~8xx MB + tportable 560MB + onedrive extras + temps + recycle + npm/pip/wrangler/google): ~21.7 GB
- Repo (node_modules ~2.8GB + .venv 249MB + __pycache__ 104MB + .next/.vite etc + test artifacts): ~2.8 GB
- Stragglers + misc: ~0.005 GB
- **Total freed:** ~24.5+ GB
- Free space before major cleans: ~0.3 GB (drive at 0%)
- Free space final: 25297.9 MB (~25 GB)

## Targets cleaned (per HERMES-PROMPT Part C, full C: perms used on Documents/Downloads/AppData etc)
### Hermes locations (AppData\Local\hermes — the "so many hermes" bloat)
- Deleted entire: backups/, state-snapshots/, checkpoints/, sessions/, browser_recordings/, cache/, audio_cache/, image_cache/, logs/
- Left intact (active): hermes-office/, hermes-agent/, skills/, lsp/, kanban/, plugins/, desktop/, cron/, auth/, memories/, hooks/, shared/, sandboxes/, pairing/ etc.
- Also pruned pnpm store (1.55GB) which was separate cache bloat.

### OneDrive e-commerce-orchestrator-v2 (user-pointed "look" location for Claude docs + extras)
- Deleted: tportable-x64.6.8.2/ (559.7 MB portable Telegram full with tdata/media_cache bloat)
- Deleted: command-center-main/ (old duplicate copy)
- Deleted: New project/, Dadroit JSON Generator/, Doc Scan PDF Scanner/
- Preserved: Documents\Claude/ (the folder user explicitly said to look at; contains SKILL.md for paperweight-daily-memory + small artifacts + the Antigravity/ sub which was 0MB local)
- Note: read the SKILL.md first (paperweight daily memory scheduled task; good doctrine but duplicate of scheduled in repo context)

### Repo C:\antigravity (rebuildable only)
- All per-package node_modules (2797 MB reported, 1000+ dirs, including stragglers)
- All .venv (249 MB)
- All __pycache__ (103 MB) + .pytest/.ruff/.mypy caches
- Frontend caches .next .vite .turbo .parcel-cache .swc under apps/ + services/ (mission-control/dist explicitly kept for the swap)
- coverage/, .nyc_output/, playwright-report/, test-results/
- Legacy trees check: antigravity/, frontend/, paperclip/ were git-tracked (48/220/3 files) so LEFT per prompt rule #10. youandinotai/ absent.

### Other
- pnpm store (full rm after prune)
- npm cache, pip cache purge
- User %TEMP% full clean
- C:\Users\joshl\Downloads : all files with mtime >30 days
- Wrangler cache (if >50MB), google/ cache (if >50MB)
- Recycle Bin on C: emptied
- DO NOT TOUCHED (per prompt #14): C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\ (any), C:\antigravity\briefings\ (any), C:\antigravity\hermes\agents\ (any), .graphify, .git (2.7GB protected), any .env, any Ollama model files, E: drive (sandbox), main active hermes-office/agent data, the Claude/ subfolder user pointed to.

## Skipped / notes
- Docker system prune: not run (Sabretooth often has no local daemon per node topology; T5500 is the docker host; no docker daemon confirmed active in this pass).
- Ollama logs older 14d: not specifically pruned (models left alone; logs small in hermes dumps already covered).
- cleanmgr /sagerun: skipped (non-interactive may not apply; recycle + manual covered).
- No doctrine-drift issue opened (grep=0 in target _deploy).
- No mock data used. Real sizes from FS.

## Paperweight Daily Memory one-line snippet (for first-party Claude to append to Notion)
C: drive freed ~24.5 GB (hermes dumps + pnpm store + tportable in e-comm + repo caches + old downloads + recycle). Mission-control swap staged on claude/mission-control-swap-and-disk-cleanup 5c0d81ab1267351a12a22962b628918be711f434 (OPUSHASHANDS bundle to _deploy/aidoesitall-www, legacy html retired, canonical-7 clean). READY + RUNBOOK written. Drift on aidoesitall.website (Emergent) now fixable by Josh DNS swap. Drive no longer at 0%. #UntilNoKidInNeed

**Next for Claude (per prompt notes):** Read READY-TO-PUSH-2026-06-04.txt, push the branch, open PR (auto-merge on CI per COWORKER), hand Josh the RUNBOOK for DNS. Append this report snippet to Notion Paperweight Daily Memory page.

#UntilNoKidInNeed


