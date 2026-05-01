# ⚠️ SECURITY FLAG — ACTION REQUIRED BEFORE PUSH
**Generated: 2026-04-25 | Severity: HIGH**

---

## Exposed Credential Found in Uploaded Settings File

**File:** `.claude/settings.local-4b22b8c6.json`

**What was found:**
```
CLOUDFLARE_ACCOUNT_ID=516a3a855f44f5ad8453636d163ae25d
```
This value was hardcoded inline in a Claude Code settings file used for `wrangler` Bash permissions.

---

## Immediate Actions Required

### 1. Check if this file is in git history
```powershell
cd C:\ANTIGRAVITY
git log --all --oneline -- ".claude/settings.local-4b22b8c6.json"
git log --all --oneline -- ".claude/settings.local*.json"
```

**If found in history:** The Account ID is in public git history.
Cloudflare Account IDs are semi-public (they appear in API calls) but combined with
any API token that uses this account → full access. Rotate tokens immediately.

### 2. Rotate any Cloudflare API tokens tied to this account
```
https://dash.cloudflare.com/profile/api-tokens
```
- Rotate the Wrangler deploy token
- Rotate any token that has `pages:deploy` or `pages:edit` permissions
- Confirm new tokens work: `npx wrangler whoami`

### 3. Move the Account ID to .env (never in settings files)
```powershell
# Add to C:\ANTIGRAVITY\.env (already gitignored):
echo "CLOUDFLARE_ACCOUNT_ID=516a3a855f44f5ad8453636d163ae25d" >> C:\ANTIGRAVITY\.env

# Update settings.local-4b22b8c6.json to use env var instead:
# Change:
#   "Bash(CLOUDFLARE_ACCOUNT_ID=516a... npx wrangler pages deploy:*)"
# To:
#   "Bash(npx wrangler pages deploy:*)"
# (wrangler reads CLOUDFLARE_ACCOUNT_ID from .env automatically)
```

### 4. Add to .gitignore
```powershell
# Check if already gitignored:
git check-ignore -v ".claude/settings.local-4b22b8c6.json"

# If not ignored, add it:
Add-Content C:\ANTIGRAVITY\.gitignore "`n# Claude Code local settings (may contain inline env)"
Add-Content C:\ANTIGRAVITY\.gitignore ".claude/settings.local-4b22b8c6.json"
Add-Content C:\ANTIGRAVITY\.gitignore ".claude/settings.local*.json"
```

### 5. If in git history, purge it
```powershell
# Nuclear option — rewrites history (coordinate with team first):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .claude/settings.local-4b22b8c6.json" \
  --prune-empty --tag-name-filter cat -- --all

# Or use git-filter-repo (cleaner):
pip install git-filter-repo
git filter-repo --path .claude/settings.local-4b22b8c6.json --invert-paths
git push origin main --force
```

---

## What Is Safe (Account ID vs API Token)

| Value | Risk | Action |
|-------|------|--------|
| `CLOUDFLARE_ACCOUNT_ID` (the 32-char hex) | Medium — needed to target account but not sufficient alone | Move to .env, remove from settings |
| Cloudflare API Token / Global API Key | HIGH — full account access | Rotate immediately if exposed |
| Wrangler deploy token | HIGH — can deploy to your Pages sites | Rotate if in any committed file |

The Account ID alone cannot deploy or modify anything without a valid API token.
But it should never be in committed files — move it to `.env`.

---

## Correct Pattern for wrangler in Claude Code Settings

```json
{
  "permissions": {
    "allow": [
      "Bash(npx wrangler pages project list:*)",
      "Bash(npx wrangler pages deploy:*)"
    ]
  }
}
```

Wrangler automatically reads `CLOUDFLARE_ACCOUNT_ID` from `.env` when present.
No need to inline it in the settings file.

---

## Do NOT Include This File in the Deploy Package Zip

This SECURITY-FLAG.md is for your eyes only.
The account ID value is not repeated anywhere else in this package.
