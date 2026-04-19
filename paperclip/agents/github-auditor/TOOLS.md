# TOOLS.md — GitHub Auditor

## Runtime

This auditor is implemented as GitHub Actions workflow code and shell scripts.

## Authorized Tooling

- GitHub Actions (`actions/checkout`, `actions/github-script`)
- Repository shell execution via `scripts/paperclip/agent-audit.sh`
- Git operations limited to audit log commits and protected-file auto-reverts
