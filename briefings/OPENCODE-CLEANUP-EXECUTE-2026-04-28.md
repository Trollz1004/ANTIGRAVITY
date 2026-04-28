# OpenCode Execute Prompt — Approved Cleanup (glm-5.1:cloud)

**Use:** Paste the block between `=== PROMPT ===` markers into OpenCode running `glm-5.1:cloud`. Single shot. Executes Opus's redlined approval of the post-migration cleanup manifest. Commit lands; no push.

**Companion to:** `briefings/POST-MIGRATION-CLEANUP-MANIFEST-2026-04-28.md` (the manifest), `briefings/DESKTOP-COMMANDER-POST-MIGRATION-CLEANUP-2026-04-28.md` (the original cleanup brief).

---

## === PROMPT ===

You are OpenCode running glm-5.1:cloud on Joshua Coleman's Sabretooth workstation. Working directory must be `c:\Antigravity` (verify with `pwd` before starting).

Your job: execute the 13 cleanup actions Opus pre-approved from the post-migration manifest. No inference, no improvisation, no scope expansion. Run the commands, verify, commit, stop. Do NOT push.

## Hard rules

1. NEVER touch `D:\` — separate triage pass needed for 15 non-flagship folders there.
2. NEVER `git push`.
3. NEVER edit, move, or delete anything not in the approved list below.
4. NEVER touch `c:\Antigravity\Antigravity\` (nested duplicate, gitignored).
5. NEVER touch `*.env` files (secrets in OneDrive vault, not the repo).
6. If any command fails, working tree is unexpected, or a listed file is missing, STOP and report.

## Step 1 — Verify starting state

```bash
pwd
git status --porcelain
git log --oneline -5
```

Expected: `pwd` = `/c/Antigravity`. `git status` clean (zero entries). Last 4 commits include `35d6e02f`, `123d9f68`, `e979c7df`, `465174b1`. If any wrong, STOP.

## Step 2 — Delete 3 untracked artifacts (all gitignored, safe to remove from disk)

```bash
rm "hermes-paperclip-adapter-main.zip"
rm "joshuaclaw-flagship-beta-testing.zip"
rm "Import-Module"
```

## Step 3 — Move 9 briefing artifacts (tracked) into briefings/ via `git mv`

```bash
git mv "BOOTSTRAP.md" "briefings/"
git mv "CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md" "briefings/"
git mv "OPENCLAW-DAILY-ORDERS.md" "briefings/"
git mv "REVENUE-BLITZ-2026-04-27.md" "briefings/"
git mv "DEPLOY-PAPERCLoudflare.md" "briefings/"
git mv "hermes-auto-start-setup.md" "briefings/"
git mv "paperclip-cloudflare-deploy.md" "briefings/"
git mv "UNIVERSAL-SYNC-2026-03-23.md" "briefings/"
git mv "UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md" "briefings/"
```

Note the exact case on `DEPLOY-PAPERCLoudflare.md` (lowercase `l` in PAPERCLoudflare) — that's the actual filename, preserve it.

## Step 4 — Move 1 setup script (tracked) into scripts/

```bash
git mv "setup-anythingllm-brain-bridge.ps1" "scripts/"
```

## Step 5 — Verify

```bash
# Deletes confirmed
ls hermes-paperclip-adapter-main.zip 2>&1 | head -3   # expect "No such file"
ls joshuaclaw-flagship-beta-testing.zip 2>&1 | head -3   # expect "No such file"
ls Import-Module 2>&1 | head -3   # expect "No such file"

# Moves confirmed
ls briefings/BOOTSTRAP.md briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md briefings/UNIVERSAL-SYNC-2026-03-23.md   # all exist
ls scripts/setup-anythingllm-brain-bridge.ps1   # exists

# Git sees the renames + deletes
git status --porcelain
```

`git status --porcelain` should show ~10 staged entries (9 renames `R  ` + 1 rename `R  `, with the 3 untracked-file deletes already gone since they were gitignored). If you see anything else staged, STOP.

## Step 6 — Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(cleanup): post-migration C:\ root cleanup

Removes 2 superseded zips and 1 empty stray; relocates 10 root-level
artifacts to canonical homes (briefings/ and scripts/). Approved by
Opus per briefings/POST-MIGRATION-CLEANUP-MANIFEST-2026-04-28.md.

Deletes (untracked, gitignored):
- hermes-paperclip-adapter-main.zip (worker deployed; source in repo)
- joshuaclaw-flagship-beta-testing.zip (flagship migrated to apps/)
- Import-Module (empty 0-byte stray from a PowerShell redirect)

Moves to briefings/:
- BOOTSTRAP.md
- CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md
- OPENCLAW-DAILY-ORDERS.md
- REVENUE-BLITZ-2026-04-27.md
- DEPLOY-PAPERCLoudflare.md
- hermes-auto-start-setup.md
- paperclip-cloudflare-deploy.md
- UNIVERSAL-SYNC-2026-03-23.md
- UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md

Moves to scripts/:
- setup-anythingllm-brain-bridge.ps1

D:\ wipe deferred — 15 non-flagship folders on D:\Antigravity require
folder-by-folder triage in a separate pass before any deletion.
EOF
)"
```

## Step 7 — Report

```bash
git log --oneline -5
git show --stat HEAD | head -20
git status --porcelain
```

Report back to Joshua:
- new commit hash
- file count moved/deleted (should be 13 ops total: 3 deletes + 10 moves)
- working tree state (should be 0 entries / fully clean)

Then STOP. Do not push. Do not run additional commands. Do not modify other files.

## === END PROMPT ===

---

## What happens after OpenCode reports

1. Opus verifies the commit hash and the diff stat match expectations.
2. If clean, Joshua decides when to push (`git push origin main` — outside this prompt's scope).
3. D:\Antigravity\ folder triage is the next ticket. Not tonight.

## Note on the executor swap

This prompt was originally scoped for `ollama launch codex` per the trust hierarchy (Opus #1, Codex #2). Codex hit usage caps tonight, so OpenCode with `glm-5.1:cloud` is the situational fallback. Both execute the same prompt the same way — the change is which model interprets it. Trust hierarchy memory unchanged; "other launchers situational only" already covers this case.
