# Hermes handoff — triage + delete `C:\ANTIGRAVITY-git\` (1-folder rule violation)

> Author: Opus 4.7 (Claude Code, Sabretooth, c:\Antigravity).
> Audience: Hermes Agent CLI running in WSL Ubuntu on Sabretooth.
> Goal: salvage anything unique, then delete `C:\ANTIGRAVITY-git\` so `c:\Antigravity\` is the sole repo working surface — per the 1-folder/1-repo/1-branch rule in CLAUDE.md.

## What you're walking into

Two clones of the same repo (`Trollz1004/ANTIGRAVITY`) live side-by-side on this box:

| Path | Role | Git state |
|---|---|---|
| `c:\Antigravity\` | **Canonical** — 1-folder rule winner | HEAD = `394e95e2 fix(hermes): use loopback for ollama-local upstream` (latest on origin/main) |
| `C:\ANTIGRAVITY-git\` | **To be deleted after salvage** | HEAD = `e000cf2` (stale by many commits), 4 modified + 14+ untracked files, including a `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` at repo root (secrets-leak risk if `git add .` ever runs there) |

Both clones point at the same `origin` — `https://github.com/Trollz1004/ANTIGRAVITY.git`.

## Hard constraints

1. **NEVER run `git add .` or `git add -A` in `C:\ANTIGRAVITY-git\`** — the master env file is sitting at repo root untracked. Adding it = secrets in public GitHub.
2. **NEVER delete `MASTER-UNIVERSAL-ENV-TROLLZ1004.env` from `C:\ANTIGRAVITY-git\` directly** — confirm it's byte-identical (or content-equivalent) to the canonical copy at `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\MASTER-UNIVERSAL-ENV-TROLLZ1004.env` first. If identical, removing the in-repo copy loses nothing. If different, surface the diff for Joshua before doing anything.
3. **NEVER force-push, reset, or rebase anything in either folder.** This is a salvage-and-delete pass, not a history operation.
4. **Don't write to `c:\Antigravity\` without producing a punch list first.** Joshua needs to bless what gets copied across.

## Phase 1 — Inventory (read-only)

Run these and return the results as a single report:

```bash
cd /mnt/c/ANTIGRAVITY-git

# Modified files in working tree
git diff --name-only

# Untracked files (excluding ignored)
git ls-files --others --exclude-standard

# For each modified file, get a short stat vs HEAD
git diff --stat
```

For each file in the union of those two lists, classify it into one of:

- 🟢 **DROP**: byte-identical (or trivially older) to a file already at the same path in `c:\Antigravity\`. Safe to delete with the folder.
- 🟡 **REVIEW**: file exists in both but contents differ in a meaningful way. List the diff summary and flag for Joshua.
- 🔴 **SALVAGE**: file exists ONLY in `C:\ANTIGRAVITY-git\`, not in `c:\Antigravity\`. Must be copied across before delete.

Comparison command per file:

```bash
F=<relative path>
diff -q "/mnt/c/ANTIGRAVITY-git/$F" "/mnt/c/Antigravity/$F" 2>&1
```

Special case: `MASTER-UNIVERSAL-ENV-TROLLZ1004.env`. Compare against the OneDrive vault copy, NOT the repo:

```bash
diff -q "/mnt/c/ANTIGRAVITY-git/MASTER-UNIVERSAL-ENV-TROLLZ1004.env" \
        "/mnt/c/Users/joshl/OneDrive/Personal Vault-Sabretooth/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
```

If identical → mark 🟢 DROP. If different → mark 🟡 REVIEW with full diff (do NOT print the file content, just the diff lines that differ — and even then, redact any value that looks like a secret token to `***REDACTED***` before reporting).

## Phase 2 — Punch list (for Joshua)

Produce a single markdown table:

```markdown
| File | Class | Action |
|---|---|---|
| ... | 🟢 DROP | will be deleted with the folder |
| ... | 🟡 REVIEW | <one-line diff summary> — Joshua decides |
| ... | 🔴 SALVAGE | will be copied to c:\Antigravity\<path> before delete |
```

Stop here and surface this list. Wait for Joshua's "go" before Phase 3.

## Phase 3 — Salvage + delete (only after Joshua approves)

```bash
# For each 🔴 SALVAGE file:
cp -v "/mnt/c/ANTIGRAVITY-git/<path>" "/mnt/c/Antigravity/<path>"

# Stage in c:\Antigravity (NOT in C:\ANTIGRAVITY-git)
cd /mnt/c/Antigravity
git add <salvaged paths>
git commit -m "salvage: rescue files from C:\\ANTIGRAVITY-git\\ before deletion

Files: <list>

The C:\\ANTIGRAVITY-git\\ folder violated the 1-folder rule and held
work that hadn't been committed. These files are now in the canonical
repo at c:\\Antigravity\\ before C:\\ANTIGRAVITY-git\\ is removed.

Co-Authored-By: Hermes <noreply@youandinotai.com>"
git push origin main

# Then delete the duplicate folder ENTIRELY
rm -rf /mnt/c/ANTIGRAVITY-git
```

## Phase 4 — Verify

```bash
# C:\ANTIGRAVITY-git should not exist
ls /mnt/c/ANTIGRAVITY-git 2>&1   # expect: No such file or directory

# c:\Antigravity should still be clean and on main
cd /mnt/c/Antigravity
git status --short
git log --oneline -3

# Master env should still live ONLY at the OneDrive vault path
ls -la "/mnt/c/Users/joshl/OneDrive/Personal Vault-Sabretooth/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"
find /mnt/c/Antigravity -name "MASTER-UNIVERSAL-ENV-TROLLZ1004.env" 2>/dev/null   # expect: no output
```

## Report back to Joshua

Tight bullets:
- Phase 1 inventory: total file count by class (🟢/🟡/🔴)
- Phase 2 punch list (the markdown table)
- Phase 3 (only after his go): commit SHA pushed, deletion confirmed
- Phase 4 verification: pass/fail per check
- Anything unexpected (e.g. files you couldn't classify, permission errors, binary files where diff doesn't help)

Joshua forwards back to Opus when ready to continue.
