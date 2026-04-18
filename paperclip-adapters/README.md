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
- `gemini-ceo-backup.cmd`
- `ollama-ceo-failsafe.cmd`
- `opencode-unified.cmd` - Unified launcher with automatic fallback between cloud models

These wrappers delegate to the currently installed machine-local CLIs under
`C:\Users\joshl`.

The unified launcher (`opencode-unified.cmd`) provides automatic fallback between:

1. Primary: opencode/glm-5.1
2. Cloud models: ollama/qwen3-coder:480b-cloud, ollama/joshlcoleman/dateapp
3. Falls back to default OpenCode if all models fail

This ensures resilience against API usage caps.
