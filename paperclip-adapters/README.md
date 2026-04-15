This directory is the canonical launcher layer for PaperClip local adapters on
Sabretooth.

Every wrapper here forces the CLI to start from `C:\ANTIGRAVITY`, so local
agent runs inspect and operate on the same workspace used in the Codex desktop
app.

Wrappers provided:

- `codex.cmd` / `codex.ps1`
- `claude.cmd` / `claude.ps1`
- `opencode.cmd` / `opencode.ps1`
- `hermes.cmd` / `hermes.ps1`
- `gemini.cmd` / `gemini.ps1`

These wrappers delegate to the currently installed machine-local CLIs under
`C:\Users\joshl`.
