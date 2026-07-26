# Secrets on Trollz1004/clean

GitHub **cannot read secret values back**. Values were loaded from local vault
files on this machine and written with `gh secret set` (stdin). Cause-related
secret **names** from the old repo were intentionally **not** copied.

## Copied (names only in git)

See `ops/secrets-migrated-names.json` for the exact name list that succeeded.

## Explicitly excluded

- Any old cause-routing / percentage-allocation secret names
- Non-product treasury labels from the legacy repo
- Mission slogan variables

## Still missing locally (set later if needed)

Names that existed on ANTIGRAVITY but had no trusted local value during migrate
are listed under `missing_local_names` in the JSON report.

## Rule

Never commit secret values. Repo secrets only via `gh secret set`.
