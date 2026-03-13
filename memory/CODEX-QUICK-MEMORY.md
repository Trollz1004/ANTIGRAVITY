# CODEX QUICK MEMORY

Updated: 2026-03-13

## Hard Truth

- Canonical workspace is `C:\ANTIGRAVITY` on `origin/main`
- One real branch: `main`
- Authority order: Josh -> Codex -> all other agents
- Square is the live payment rail
- Protocol Omega live split remains `60 / 30 / 10`
- Clean baseline was re-established across Sabretooth, 9020, and T5500 on 2026-03-13 after Codex cleaned remote drift and re-synced all nodes

## Team Reality

- Codex is final repo truth and push closeout owner
- Gemini and Claude are bounded collaborators
- Comet is research-only
- Grok is now available as a Sabretooth-local OpenClaw-backed agent under Codex routing
- OpenClaw Telegram ownership stays on Sabretooth only

## OpenClaw Runtime

- Sabretooth local gateway: `ws://127.0.0.1:18789`
- OpenClaw model baseline on Sabretooth, 9020, and T5500: `xai/grok-4`
- Use `openclaw status` as the runtime truth check
- `octui` opens the OpenClaw TUI
- `claudelive` launches Claude Code CLI in bypass-permissions mode
- `gemini` in the ANTIGRAVITY startup shell launches via the clean wrapper script because Gemini CLI fails if it inherits the Codex terminal `\\?\` provider path
- 9020 and T5500 are not yet approved as live OpenClaw sub-agent runtime nodes

## Node Baseline

- Sabretooth: clean on `main`
- 9020: clean on `main`; pre-clean drift preserved in `stash@{0}` with label `codex-preclean-20260313-baseline`
- 9020 offloaded leftover dir: `C:\Users\joshl\Documents\ANTIGRAVITY-preclean-20260313\ClawX-main`
- T5500: clean on `main`

## Guardrails

- Do not let recovery docs override repo truth
- Do not claim multi-node OpenClaw is live until remotes are verified
- Do not re-enable Telegram polling on remote nodes
- After every push on Sabretooth, immediately check and fast-forward `C:\ANTIGRAVITY` on 9020 and T5500 if those worktrees are clean
- Do not leave finished work unpushed
- If any temp branch/worktree exists, merge/push/delete before closeout
- Grok/OpenClaw may update a Personal Vault continuity note only when Josh explicitly asks; the vault never overrides repo truth
