# Agent Sync Runbook (Opus / Gemini / CodeX / Grok)

Use this every time before doing work.

## 1) Sync Latest `main`

```powershell
Set-Location C:\OPUSONLY
git fetch origin main
git checkout main
git pull --ff-only origin main
git status --short --branch
git log --oneline -3
```

Expected:
- branch is `main`
- no merge commit created by pull
- no unexpected local modifications

## 2) Confirm Repo Policy

```powershell
gh api repos/Trollz1004/ANTIGRAVITY/branches --paginate --jq '.[].name'
```

Expected:
- only `main`

## 3) Confirm Status Files Exist

- `GEMINI-STATUS.md`
- `CODEX-STATUS.md`
- `OPUS-STATUS.md`
- `JULES-STATUS.md`
- `SECRETS-ALIAS-MAP.md`

## 4) Secret Hygiene Rule

- Never commit secret values.
- Keep `.env`, `.env.*`, `.vault/` ignored.
- Use GitHub Secrets/Variables for runtime config.

## 5) Pre-Push Check

```powershell
git status --short --branch
git diff --name-only
```

If output includes secret-bearing files, stop and clean first.
