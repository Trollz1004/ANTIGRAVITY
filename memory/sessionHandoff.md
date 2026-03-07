# SESSION HANDOFF — CLAUDE / CODEX SHARED STATE

**Last Updated**: 2026-03-07 13:22:15 -05:00  
**Source**: Codex on SABRETOOTH (`C:\ANTIGRAVITY\CodeX`)

## Shared Truth

- `C:\ANTIGRAVITY` is now the live Codex base
- `C:\ANTIGRAVITY\CodeX` is the active Codex workspace
- `E:` is being retired from Codex runtime duty
- Verify by git, SSH, files, and services whenever possible

## Repo Position

- `origin/main` = `1a44f87`
- `C:\ANTIGRAVITY` = active local Codex base
- `E:\ANTIGRAVITY` = legacy local copy pending retirement
- `origin/claude/review-changes-mmeucm90aurnm0ht-3sxI9` advanced again on fetch and should still be treated as a patch source only, not a merge target

## Legacy E: Working Tree To Protect Until Retired

- `README.md`
- `TASK-QUEUE-100.md`
- `memory/codex-orchestrator-handoff.md`
- `scripts/deploy/Setup-MCPs.ps1`
- `scripts/deploy/mcp-config-template.json`
- untracked: `AGENTS.md`
- untracked: `Trollz1004/`
- untracked: `scripts/codex-doctor.ps1`
- untracked: `scripts/fix-ssh-admin-keys.ps1`

## Node / Ops Status

- SSH from Sabretooth to `T5500` passes
- SSH from Sabretooth to `9020` passes
- Sabretooth now runs Codex in desktop-app-first mode; Docker is intentionally not installed
- Retired `CodeX-Memory-SelfHeal-*` tasks are absent and should stay absent unless local memory stack work is explicitly re-enabled
- `T5500` boot is now cold: no custom startup entries remain, `OpenClaw Gateway` and broken `OPUS-CLI-AutoStart` were removed, and `HKCU\...\Run` was trimmed to `OneDrive`
- `9020` boot is now cold: no custom startup entries remain, `OPUS-Marketing-Watchdog` and `OPUS Auto Start` were removed, `HKCU\...\Run` was trimmed to `OneDrive`, and `Redis` is `Manual`
- `T5500` still answers on `qdrant :6333`; remote `Ollama` is intentionally off
- `9020` is intentionally idle after cleanup; remote `Ollama` and `Redis` are off until started on purpose
- Local MCP files exist at both repo root and `CodeX` workspace
- Legacy broken `OPUS-*` scheduled tasks on Sabretooth were disabled
- Continuity export scripts exist and latest continuity status is `GREEN`
- Public continuity pack exists on Kraken USB and OneDrive
- Encrypted secret continuity pack exists on Kraken USB and OneDrive
- Continuity passphrase exists in local ignored storage and OneDrive Personal Vault
- OnlineRecycle local revenue worker is live on `main`:
  - `scripts/run-onlinerecycle-revenue-worker.ps1`
  - `scripts/Run-OnlineRecycle-LocalWorker.ps1`
  - `scripts/onlinerecycle-local-worker.js`
- `qwen2.5:7b` is installed locally for Ollama fallback work on Sabretooth
- OnlineRecycle live intake is FormSubmit -> Gmail -> Square booking/store links
- Daily deterministic outputs now belong under `C:\ANTIGRAVITY\CodeX\state\`
- Structured intake reply drafts are reliable; freeform local-model drafts still need a human read
- Next valuable automation is browser-side inbox handling, not more Ollama generation
- YouAndINotAI backend is on the incremental-hardening path, not the rewrite path:
  - safe pieces from the Claude review branch were ported manually
  - `youandinotai-api` now has Square readiness health checks, auth/verify rate limiting, and no backend `stripe` dependency in `requirements.txt`
  - focused backend suite passes with `uv run --python 3.12 --with pytest --with-requirements requirements.txt pytest ...` (`45 passed`)
- Live/web drift still exists:
  - public OnlineRecycle copy still leans charity/help-kids in places
  - Square storefront title/copy appears stale
  - eBay batch generator still emits `Charity impact` wording in export copy

## Important Caveat

The active Codex desktop thread is now rooted on `C:\ANTIGRAVITY`. Treat any old `E:`-based runtime assumptions as stale and retire them when found.

## Default Coordination Rule

If either Claude or Codex changes shared repo docs, infra, or node behavior, reduce the handoff to: house boundary, repo commit positions, ops health, local deltas, and current risks. No fluff.
