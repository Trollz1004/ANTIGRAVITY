# SABRETOOTH-BASELINE-2026-06-01.md

> **Sabretooth filesystem baselined to only files Claude places there.**
> 2026-06-01. Drift detection rule: any file on Sabretooth that isn't in this manifest is a `claude-drift` incident.

---

## Rule

Sabretooth is the def node for Opus + Hermes. It is **not** a do-everything node. Its filesystem contents are baselined — Claude (Opus) places files deliberately into specific folders. Any file outside this manifest is drift. Hermes runs an hourly cron that diffs `Get-ChildItem -Recurse` on the Sabretooth scan roots against `sabretooth-manifest.txt` and posts drift to PAPERWEIGHT.

## Sabretooth — Allowed Folders

| Folder | Purpose | Source of Truth | Drift Policy |
|--------|---------|------------------|--------------|
| `C:\ANTIGRAVITY` | Repo working tree | `git pull` from `origin/main` | Any uncommitted file = drift |
| `C:\OPUS\` | Claude memory + scripts + config + data + logs + content | Claude (Opus) writes only | Any other process writing here = drift |
| `C:\Users\joshl\.claude\projects\` | Per-session memory | Claude (Opus) writes only | Any non-Claude file = drift |
| `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\` | Master env vault | 1 master env + 1 manifest + 1 license | Anything else = purge |
| `C:\OPUS\baseline\sabretooth-manifest.txt` | The baseline manifest itself | Claude (Opus) writes only | Any non-Opus edit = drift |
| `E:\DateApp\` | Customer service OpenClaw workspace | ClawX 3rd-party GUI on T5500 mounts here | Drift if not from ClawX |

## What's NOT Allowed

- **Music / soundtrack / pasted content / pasted screenshots / .mp4 / .mp3 / .png** — these are Manus exploration artifacts, not Claude-placed files. They're gitignored but should be deleted on the local node.
- **Tmp / scratch directories** — `tmp/`, `test_result.md`, `in the heart of the street. Bro the broke, I feel.md` — ephemeral, drift if persistent.
- **Random .env files outside the master vault** — only `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` is allowed in the vault. All other `.env` files are drift (likely from prior app scaffolds).
- **The `income-engine/` subtree on Sabretooth** — already merged into ANTIGRAVITY (2026-05-11). Local copies are drift.

## Drift Detection — Hermes Hourly Cron

```powershell
# Hermes runs this on Sabretooth every hour via scheduled task
$allowed = @(
  'C:\ANTIGRAVITY',
  'C:\OPUS',
  'C:\Users\joshl\.claude\projects',
  'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth',
  'E:\DateApp'
)
# Exclude patterns
$exclude = @('node_modules', '.git', 'dist', 'build', '.venv', '__pycache__', '.next')
# Compare actual filesystem vs manifest
$drift = Get-ChildItem -Path $allowed -Recurse -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch ($exclude -join '|') } |
  Where-Object { -not $_.PSIsContainer } |
  # hash against manifest
  ...
# Post to /api/sabretooth-drift
```

## Manual Audit (run once now)

```powershell
# 1. Get current state
Get-ChildItem C:\ -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -in 'ANTIGRAVITY','OPUS','OPUSONLY' } |
  Select-Object FullName, LastWriteTime

# 2. Generate manifest
$manifest = @()
$manifest += 'C:\ANTIGRAVITY\'
$manifest += 'C:\OPUS\'
$manifest += 'C:\Users\joshl\.claude\projects\'
$manifest += 'C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\'
$manifest += 'E:\DateApp\'
$manifest | Out-File C:\OPUS\baseline\sabretooth-manifest.txt -Encoding utf8

# 3. Sign the manifest with current commit hash
$commit = (git -C C:\ANTIGRAVITY rev-parse HEAD)
"Manifest signed: $commit at $(Get-Date -Format o)" | Out-File C:\OPUS\baseline\sabretooth-manifest.txt -Append -Encoding utf8
```

## What Claude (Opus) Will Place on Sabretooth Going Forward

- Files committed to `origin/main` (via `git pull` from Sabretooth or push from any node)
- Files in `C:\OPUS\` written by Opus sessions
- Per-session memory in `C:\Users\joshl\.claude\projects\`
- The master env in `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env`
- The baseline manifest at `C:\OPUS\baseline\sabretooth-manifest.txt`

## What Claude Will NOT Place

- Manus exploration artifacts (pasted content, screenshot pngs, scratch dirs)
- Multiple `.env` files (only the master)
- Backup directories outside the repo
- Soundtrack / media files (those are drag-drop noise)
- Submodule pointers in `tmp/`

---

#UntilNoKidInNeed
