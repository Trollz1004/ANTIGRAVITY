# Secrets Alias Map (Public Safe)

Purpose: document GitHub naming exceptions without exposing values.

## Why Aliases Exist

GitHub Actions blocks secret and variable names that start with `GITHUB_`.
To preserve coverage, these keys are stored with `GH_` aliases.

## Alias Mapping

- `GITHUB_ADMIN` -> `GH_ADMIN`
- `GITHUB_EMAIL` -> `GH_EMAIL`
- `GITHUB_NOREPLY` -> `GH_NOREPLY`
- `GITHUB_PAT` -> `GH_PAT`
- `GITHUB_USERNAME` -> `GH_USERNAME`

## Usage Rule

If code or workflow expects `GITHUB_*`, map it to the `GH_*` alias in runtime config.
Do not store raw values in repo files.
