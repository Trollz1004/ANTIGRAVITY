# ANTIGRAVITY Deploy Package
**Built by Claude · April 21, 2026 · #ForTheKids #UntilNoKidInNeed**

---

## What This Is

A complete fix-validate-push package for the ANTIGRAVITY production repo.
Hand this folder to Claude CLI or Codex CLI. Everything is scripted. Nothing is guessed.

## How To Use

### Option A — Claude CLI (recommended)
```
cd C:\ANTIGRAVITY
# Paste contents of MASTER-PROMPT.md as your first message
# Then let it run 00-run-all.ps1 end to end
```

### Option B — Run scripts directly (PowerShell Admin)
```powershell
cd C:\ANTIGRAVITY
pwsh -NoProfile -ExecutionPolicy Bypass -File "path\to\this\package\scripts\00-run-all.ps1"
```

### Option C — Step by step
Run each numbered script in order. Each one is safe to re-run.

---

## Package Contents

```
antigravity-deploy-package/
├── README.md                          ← you are here
├── MASTER-PROMPT.md                   ← paste this to Claude CLI / Codex CLI
├── scripts/
│   ├── 00-run-all.ps1                 ← runs everything in order
│   ├── 01-inspect-state.ps1           ← git + service status snapshot
│   ├── 02-fix-hermes-config.ps1       ← detect config path, validate model, sync TOOLS.md
│   ├── 03-fix-watchdog.ps1            ← correct watchdog workflow paths (I-03)
│   ├── 04-resolve-audit.ps1           ← reconcile HEARTBEAT.md + close security issue
│   ├── 05-validate-all.ps1            ← full pre-push validation suite
│   └── 06-commit-and-push.ps1         ← stage, commit, push (only if all green)
├── workflows/
│   └── hermes-integrity-watchdog-FIXED.yml  ← drop-in replacement for the broken one
└── docs/
    └── AGRAVCLIP-VISION.md            ← architecture spec for the custom platform build
```

---

## Issues This Package Fixes

| ID | Issue | Script |
|----|-------|--------|
| I-01 | Hermes config path ambiguity (two docs, two paths) | 02-fix-hermes-config.ps1 |
| I-02 | TOOLS.md model doesn't match live config.yaml | 02-fix-hermes-config.ps1 |
| I-03 | Watchdog monitors nonexistent paperclip-9020/ path | 03-fix-watchdog.ps1 |
| I-04 | Audit FAIL + HEARTBEAT.md revert loop | 04-resolve-audit.ps1 |

---

## Non-Negotiables (enforced by 06-commit-and-push.ps1)

- Will NOT push if any validation fails
- Will NOT push if secrets are detected in diff
- Will NOT push if not on branch `main`
- Will NOT push if Paperclip local health fails
- Will NOT push if public HQ is unreachable

---

## After Push

Confirm GitHub Actions pass:
https://github.com/Trollz1004/ANTIGRAVITY/actions

Then return to Claude to build the next floor. #UntilNoKidInNeed
