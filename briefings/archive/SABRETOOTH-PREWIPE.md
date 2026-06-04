# Sabretooth Pre-Wipe Checklist

**Authored:** 2026-05-11 from 9020 by orchestrator Claude Code.
**Audience:** Claude / opencode CLI running on Sabretooth (or Josh manually).
**Goal:** Get every load-bearing artifact off Sabretooth into either `origin/main` or `origin/<safety-branch>` BEFORE Josh factory-resets Sabretooth.

## Background

- Sabretooth was the previous push-to-main node for `Trollz1004/ANTIGRAVITY`.
- After T5500 is confirmed working (see `T5500-CONSOLIDATION.md`), push authority moves to T5500 and Sabretooth retires.
- 9020 is being preserved via branch `9020-preserve-20260511` (already pushed).
- Sabretooth needs its own preserve branch: `sabretooth-preserve-20260511`.

## Step order

### 1. Verify clean origin state
```
cd C:\Antigravity
git fetch origin
git status -sb
```
- If working tree has local commits ahead of `origin/main`, list them: `git log origin/main..HEAD --oneline`
- Push any unpushed main commits NOW (before any further work)

### 2. Inventory Sabretooth-only assets
Things likely to exist only on Sabretooth, not in repo:
- **Paperclip company data** at the Paperclip install dir (usually `C:\paperclip\instances\default\companies\` or similar — find with `Get-ChildItem -Recurse -Filter "companies" -Directory`). Four UUIDs:
  - `09c1449b-3a44-44b8-b58b-ecb78549a069` (TRA - Trash Or Treasure Online Recycler LLC)
  - `6e266cc8-d103-4e93-ab04-4737433cdd9d` (AIS - ai-solutions.store)
  - `a62f4971-5523-461f-b8b3-828c371f1be7` (YOU - youandinotai.com)
  - `ea74e033-1e8e-4a74-a59b-62d1b563b808` (MAR - marketing)
- **Hermes config / credentials** (`hermes-config/`, `.hermes/`, or similar)
- **Local .env files** with API keys (Anthropic, OpenAI, Ollama, OpenRouter)
- **OneDrive sync state** — confirm `C:\Users\joshl\OneDrive\.claude\projects\` is current. Memory there will reach T5500 automatically.
- **briefings/** subdir if it has Sabretooth-authored docs not in main
- Any uncommitted `C:\Antigravity\` working-tree files

### 3. Scan EVERYTHING for secrets before pushing
GitHub secret scanning will block any commit containing `gho_*`, `ghp_*`, `github_pat_*`, `sk-ant-*`, `sk-or-v1-*`, `OLLAMA_API_KEY=<hex>`, etc.

```powershell
# from C:\Antigravity (or wherever you stage):
Select-String -Path .\**\* -Pattern "gho_|ghp_|github_pat_|sk-ant-|sk-or-v1-|OLLAMA_API_KEY="  -ErrorAction SilentlyContinue
```
Strip every match from the staged content BEFORE `git add`. Note any tokens for rotation.

### 4. Build the preserve branch
```
cd C:\Antigravity
git checkout -b sabretooth-preserve-20260511
mkdir _sabretooth-preserve
# copy each load-bearing dir into _sabretooth-preserve/<name>/
git add _sabretooth-preserve/
git commit -m "Preserve Sabretooth-only assets before factory reset"
git push -u origin sabretooth-preserve-20260511
```

### 5. Paperclip company data — special case
If the four companies have valuable internal state (issues filed, agent heartbeat history, attached files), export each company's directory tree into `_sabretooth-preserve/paperclip-companies/<prefix>/`. Naming pattern: use the prefix (TRA/AIS/YOU/MAR) not the UUID — UUIDs will not match on T5500.

If the companies are empty / freshly created with no real history, skip this — recreate by name on T5500.

### 6. Final push checklist
- [ ] `git log origin/main..HEAD` on Sabretooth's local `main` shows nothing (all main commits pushed)
- [ ] `git ls-remote origin sabretooth-preserve-20260511` returns a hash (preserve branch landed)
- [ ] `Get-Process OneDrive` shows OneDrive running and sync icon is green
- [ ] No `.env*` files staged with live keys
- [ ] Hermes config (if any) inside `_sabretooth-preserve/hermes-config/`

### 7. Hand off
After all four checkboxes green, post here:
> Sabretooth preserve branch landed at <commit-sha>. Ready for wipe.

Then Josh wipes.

## After wipe

Push authority for `Trollz1004/ANTIGRAVITY/main` is T5500 only. Update memory on T5500 to reflect:
- Old: "Push-to-main authority = Sabretooth (192.168.0.8)"
- New: "Push-to-main authority = T5500 (192.168.0.15)"

## Do NOT

- Do not delete any branch on `origin` — `9020-preserve-20260511` and `sabretooth-preserve-20260511` stay as permanent archives.
- Do not create new GitHub accounts. Trollz1004 only.
- Do not push files containing live API keys/tokens — secret scanning will reject and we already lost a day to one leaked token this week.
- Do not touch 9020 from Sabretooth. 9020 handles its own preserve (done — see `9020-preserve-20260511` branch).
