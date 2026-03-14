# Perplexity Computer - eBay Task Brief

Workspace truth:
- Canonical repo: `C:\ANTIGRAVITY`
- Canonical branch: `main`
- Authority order: `AGENTS.md`, `briefings/`, `memory/`, `origin/main`

Use this brief when Perplexity Computer is helping with `eBay` and `onlinerecycle.org` tasks.

## Hard Rules

- Do not use `E:\ANTIGRAVITY`, OneDrive copies, or stale uploaded exports as source truth.
- Do not ask for or use the full master env vault.
- Use only a narrow task-scoped env derived from `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env`.
- Do not print secrets back into chat or files.
- Do not claim repo truth unless Codex verifies it on Sabretooth.
- Do not touch OMEGA repos.
- Respect the Iron Wall between ENIGMA and OMEGA.

## Minimal Env for Perplexity Computer

Required for eBay production work:
- `EBAY_APP_ID`
- `EBAY_CERT_ID`
- `EBAY_DEV_ID`
- `EBAY_AUTH_TOKEN`
- `EBAY_ENVIRONMENT=production`

Optional only if the exact task needs them:
- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `GITHUB_PAT`

Perplexity Computer itself does not need a separate `PERPLEXITY_API_KEY` if the operator is already signed into Perplexity Enterprise in the browser.

## Files to Attach

Minimum useful set:
- `CodeX/env/perplexity-computer-ebay.env.template`
- `AGENTS.md`
- `briefings/TASK-ROUTING.md`
- the exact eBay CSV or task file being worked

Add more only if the task truly requires them.

## Safe Task Types

- eBay bulk pricing analysis
- sold-comp research
- marketplace lead scans
- draft proposals and summaries
- bounded web research

## Do Not Assume

- Windows paths exist inside the Perplexity workspace unless you attached the files
- old chat summaries are still accurate
- repo state is current unless Codex verified it from `C:\ANTIGRAVITY`
