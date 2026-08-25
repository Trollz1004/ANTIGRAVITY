# Git Hooks

This repo uses a local pre-commit hook to block high-confidence secret leaks.

## Enable hooks in this clone

Run:

```bash
git config core.hooksPath .githooks
```

## What is blocked

- GitHub PATs (`ghp_`, `github_pat_`)
- Live Stripe keys (`sk_live_`)
- AWS access key IDs (`AKIA...`)
- Private key headers (`BEGIN ... PRIVATE KEY`)
- Common API token assignment patterns in staged diffs

If a commit is blocked, remove the secret from staged content and use env/vault references instead.

