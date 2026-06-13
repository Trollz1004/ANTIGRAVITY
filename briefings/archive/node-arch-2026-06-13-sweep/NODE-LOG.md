# NODE-LOG

> Cross-node activity log. One short entry per session per node. Append-only.

## Sabretooth — 2026-05-19
- Opus: created `briefings/CLAUDE-DOCTRINE.md` (11 cross-Claude rules) from worktree on `claude/design-bundle-v1` @ `95159e6c`; Claude Desktop synced (8 MCP servers, packaged install at `AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude`); restart required to load MCPs.

## T5500 — 2026-05-19
- Opus: wrote `OneDrive\Personal Vault\CLAUDE-NODE-MEMORY-T5500-2026-05-19T1615Z.md`. Consolidated branches: FF-merged `claude/design-bundle-v1` → `main`, pushed `main` to origin, deleted 8 non-preserve branches (claude/*, feature/*, main-emergent-*, active). Remaining: `main` + 4 preserves. Collapsed dual `hermes-workspace` checkouts via Junction (B's `.env` migrated to A, B archived as `*.deprecated-2026-05-19`). Patched `scripts/sync-claude-desktop-config.ps1` to detect Microsoft Store installs (helps Sabretooth on re-runs). Open: Claude Desktop sync not yet run on T5500, Docker engine stopped, `gh auth setup-git` not run, graphify not installed, CLAUDE.md "T5500 = auxiliary read-only" is stale doctrine.
