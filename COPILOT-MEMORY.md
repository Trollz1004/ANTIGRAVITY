# Copilot Memory (Personal Vault)
Last updated: 2026-04-19
Owner: Joshua Coleman
Purpose: Persistent restore + operating memory for Copilot after factory reset

---

## Core Intent
- Keep Hermes as CEO orchestration layer.
- Keep Paperclip as active control plane for restart-safe operations.
- Prevent workflow drift after reset by restoring from this vault first.

## Non-Negotiables
- Do not edit AI platform memory files unless explicitly directed by Joshua.
- Keep this vault file out of git/repo.
- Treat this file as source-of-truth for post-reset Copilot context.

## Recovery Priority Order
1. Restore Hermes files from Personal Vault.
2. Restore master env file to ANTIGRAVITY briefings.
3. Clone ANTIGRAVITY fresh.
4. Verify Paperclip connectivity and CEO workflow.
5. Run bootstrap installer script only if needed.

## Required Restore Files (Vault)
- MASTER-UNIVERSAL-ENV-TROLLZ1004.env
- hermes-config.yaml
- hermes-SOUL.md
- hermes.cmd
- paperclip-ceo/AGENTS.md
- paperclip-ceo/TOOLS.md

## Environment Notes
- OpenClaw gateway port: 18789
- OpenClaw mode: local + token auth
- Default model target: ollama/glm-5.1:cloud
- Primary goal: stable restart behavior with Paperclip already working

## Copilot Working Preferences
- Prefer direct execution over planning when task is clear.
- Keep scripts self-healing and non-terminating on error.
- Keep local backup copies in Personal Vault before risky operations.
- Avoid changing governance or memory ownership boundaries.

## Validation Checklist (Post-Reset)
- Hermes command works.
- Paperclip status is healthy.
- CEO files present.
- Master env restored.
- OpenClaw endpoint responds on configured port.

## Quick Rehydrate Notes
- If anything is missing, restore from Personal Vault first.
- If behavior drifts, verify Hermes config and Paperclip CEO files before any other change.

## Change Log
- 2026-04-19: Initial Copilot memory file created in Personal Vault.
