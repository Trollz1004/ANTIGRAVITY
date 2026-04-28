# Post-Migration Cleanup Prompt — c:\Antigravity (after OpusPawClaw D:\ → C:\ move)

**Recommended executor:** `ollama launch codex` running `qwen3-coder:480b-cloud` (or local `qwen2.5-coder:7b`). Same trust-tier-#2 default as the broader cleanup prompt.

**Companion to:** `DESKTOP-COMMANDER-CLEANUP-PROMPT-2026-04-28.md` (general drift cleanup) and `CLEANUP-DRIFT-PLAN-2026-04-28.md` (the manifest plan). Read those first if you haven't. This prompt covers ONLY the tail items created by the 2026-04-28 migration: D:\ wipe, superseded zips at the repo root, env-leak audit, stray D-drive references in code.

**Paste the block between the `=== PROMPT ===` markers into your chosen executor. One shot. Manifest lands at `c:\Antigravity\briefings\POST-MIGRATION-CLEANUP-MANIFEST-2026-04-28.md`. Opus reviews the manifest before any deletion or commit.**

---

## === PROMPT ===

You are operating on Joshua Coleman's Windows workstation as Codex (or Desktop Commander) on a tail-cleanup pass. Joshua just migrated the OpusPawClaw flagship from `D:\Antigravity\joshuaclaw-flagship-beta-testing\` to `c:\Antigravity\apps\opuspawclaw\` per the 1-folder rule. Your job is to finish the cleanup that move implies, NOT to invent new scope.

Mission tag: `#UntilNoKidInNeed`, ~14 days runway. Be precise. Manifest first, destruction second, only with explicit approval.

## Hard rules — non-negotiable

1. NEVER read, edit, copy, or move any file matching: `.env*`, `*.key`, `*.pem`, `*.vault`, `*.secret`, `*credentials*`, `*token*`. Skip silently.
2. NEVER touch `c:\Antigravity\.claude\settings.local.json` or anything under `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\` (the OneDrive env vault).
3. NEVER delete, move, edit, or `git mv` anything inside `c:\Antigravity\Antigravity\` (the nested subdirectory). Read-only inspection only.
4. NEVER run: `git push`, `git commit -a`, `wrangler deploy`, `docker-compose up`, `docker run`, `npm publish`, `rm -rf` outside the explicitly-approved deletion list.
5. Stop and surface in the manifest if you find anything that looks like Joshua's in-progress work that's not yet committed and isn't part of the migration tail.

## Tasks (produce a manifest of findings; do NOT delete anything yet)

### 1. Migration parity check

Diff the source tree:

```
diff -r D:\Antigravity\joshuaclaw-flagship-beta-testing c:\Antigravity\apps\opuspawclaw \
  --exclude=node_modules --exclude=.git --exclude=dist --exclude=build
```

Manifest entry: paste the diff output verbatim. If empty, mark "PARITY OK". If non-empty, flag every differing file — Joshua may have edits on D:\ that didn't make the copy.

### 2. D:\ inventory

List everything under `D:\Antigravity\`:

```
dir /b /s D:\Antigravity\ > $TEMP\d-inventory.txt
```

Manifest entry: paste the full list. Group by top-level folder. Flag anything that is NOT obviously the dormant flagship copy (e.g., other folders that pre-date the migration). Joshua needs to decide per-folder whether to migrate, delete, or leave.

### 3. c:\Antigravity\ root junk inventory

List files at the immediate root of `c:\Antigravity\` (not subdirectories) — many are loose .md and .zip files left over from session work. For each, classify:

- Looks like the canonical CLAUDE.md, README.md, package.json, etc. → KEEP
- Looks like a one-off briefing/prompt artifact (e.g., `CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md`, `OPENCLAW-DAILY-ORDERS.md`) → propose moving under `briefings/`
- `*.zip` files (e.g., `joshuaclaw-flagship-beta-testing.zip`, `hermes-paperclip-adapter-main.zip`) → propose deletion (superseded; flagship is now under `apps/`, paperclip-adapter is the worker on Cloudflare)
- Anything you can't classify → flag for Joshua

Manifest entry: a table with columns `path | classification | proposed action | rationale`.

### 4. Env-leak audit under c:\Antigravity\

Search the repo (excluding `node_modules`, `.git`, `dist`, `build`):

```
grep -rn 'sk-[A-Za-z0-9]\{20,\}\|api[_-]key\s*=\s*["'\'']\|password\s*=\s*["'\''].\{4,\}' c:\Antigravity\
```

Also list any tracked or untracked file matching `*.env`, `*.env.*`, `*.secret`, `*.key`, `*.pem` under `c:\Antigravity\` (these should NOT exist there per the secrets-in-OneDrive-vault rule):

```
git ls-files | grep -E '\.(env|secret|key|pem)(\.|$)'
git status --porcelain | grep -E '\.(env|secret|key|pem)(\.|$)'
```

Manifest entry: list every match. ZERO matches expected. Any match is a leak that needs to be moved to `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\` and deleted from the repo.

### 5. D:\ reference scan in code/config

Search for any path string under `c:\Antigravity\` that still references `D:\Antigravity` (case-insensitive):

```
grep -rni 'D:\\\\Antigravity\|D:/Antigravity' c:\Antigravity\ \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

Also check obvious config files explicitly (json/yaml/toml/ps1/cmd/sh) under:

- `c:\Antigravity\.claude\` (settings)
- `c:\Antigravity\scripts\`
- `c:\Antigravity\apps\opuspawclaw\` (just-migrated; should already be clean from this pass but verify)
- `c:\Antigravity\briefings\` (briefings updated by Opus; verify)

Manifest entry: every D:\ reference, with `file:line` and the surrounding context (1 line before/after). Propose the C:\ replacement for each. NEVER auto-rewrite — Opus approves edits per-file.

### 6. Memory cross-check

Read `C:\Users\joshl\.claude\projects\c--Antigravity\memory\MEMORY.md` and report any entry whose linked .md file references a D:\ path or the old `briefings/MASTER-UNIVERSAL-ENV-...env` location instead of the OneDrive vault. Do not edit memory; only report.

## Output

Write the manifest to:

```
c:\Antigravity\briefings\POST-MIGRATION-CLEANUP-MANIFEST-2026-04-28.md
```

Use this structure:

```markdown
# Post-Migration Cleanup Manifest — 2026-04-28

## 1. Parity check
<diff output or "PARITY OK">

## 2. D:\ inventory
<list grouped by top-level folder, flagged items called out>

## 3. c:\Antigravity root junk
| Path | Classification | Proposed Action | Rationale |
|------|----------------|-----------------|-----------|
| ... | ... | ... | ... |

## 4. Env-leak audit
<list of matches; "NONE" if clean>

## 5. D:\ reference scan in code/config
<list with file:line and proposed replacement; "NONE" if clean>

## 6. Memory cross-check
<list of stale entries; "NONE" if clean>

## Summary
- Items proposed for deletion: <count>
- Items proposed for migration: <count>
- Leaks/issues found: <count>
- Recommended next action: <one sentence>

## Awaiting Opus review
This manifest is propose-only. No files were deleted, moved, or edited.
```

After writing the manifest, STOP. Do not run any deletion, move, or commit. Joshua and Opus will review the manifest and issue an approved action list. The deletion pass is a separate, explicit ticket.

## === END PROMPT ===

---

## What happens after Codex returns the manifest

1. Opus reads `briefings/POST-MIGRATION-CLEANUP-MANIFEST-2026-04-28.md` and produces a redlined "approved deletions / approved migrations / questions" pass.
2. Joshua skims the redline, says yes or modifies.
3. Codex (or Opus, depending on size) executes the approved list in a SECOND pass with clearly-scoped commands. Each deletion is logged. Nothing destructive happens without the redline being explicit.
4. The whole tail closes with a single commit on `main` like `chore(cleanup): finish OpusPawClaw migration tail; remove D:\ artifacts`.

## Why this is split from the main cleanup prompt

The general cleanup prompt (`DESKTOP-COMMANDER-CLEANUP-PROMPT-2026-04-28.md`) was written before the migration. It covers drift cleanup at the codebase level. This prompt covers ONLY the tail items the migration created and is shorter so Codex burns less context to absorb scope. Run them in order if you want a full sweep: general first, post-migration second.
