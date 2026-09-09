# Hermes / Pi / FCC-Claude CLI Reference

Verified on T5500, `E:\ANTIGRAVITY` runtime. Commands are exact, no paraphrasing.

## Hermes

- Hermes is the orchestrator. Default active lead when no lane is explicitly assigned.
- Hermes connects to OpenClaw via `http://127.0.0.1:18789`.
- Hermes fallback provider: OpenCode/Ollama local `ornith:9b` at `127.0.0.1:11434`.
- Paperclip external: `https://paperclip-clean.youandinotai.com`
- Paperclip local: `http://127.0.0.1:3120`
- Public landing: `https://trollz1004.github.io/youandinotai-links/`
- Paperclip API token: `pcp_512d3544a84a957156c1fba92782dc5899c6a4ebba770670`
- Paperclip company: `95bb6cb0-76aa-498b-b173-641028078d27`

## Pi

Installed: `C:\Users\joshl\AppData\Roaming\npm\pi`
Config: `C:\Users\joshl\.pi\agent\models.json` + `settings.json`
Default provider/model: `ollama / ornith:9b`

Exact CLI commands:

```bash
pi "your task" --provider ollama --model ornith:9b --session-dir "%USERPROFILE%\.pi\sessions"
pi --list-models
pi --help
```

Notes:

- Pi fails early if the runtime cannot resolve `npm root -g`. If you see `Failed to run npm root -g`, fix PATH/system PATH and rerun.
- Noninteractive mode works via command args; config TUI is interactive only.

## FCC-Claude (Claude Code CLI)

Binary: `C:\Users\joshl\.claude\claude.exe`
Docs path: `E:\ANTIGRAVITY\briefings\CLAUDE-DOCTRINE.md`

Exact CLI commands:

```bash
"C:\Users\joshl\.claude\claude.exe" --version
"C:\Users\joshl\.claude\claude.exe" -p "your prompt"
```

Notes:

- Use `-p` for noninteractive/scripted runs; use no flag for interactive TUI.
- Hermes may summon Claude Code CLI as last-resort execution lane.

## Paperclip verification

```bash
curl -sS -o nul -w "%{http_code}\n" http://127.0.0.1:3120/api/health
curl -sS -o nul -w "%{http_code}\n" https://paperclip-clean.youandinotai.com/api/health
```

## Agent-Reach

Binary: `C:\Users\joshl\AppData\Roaming\Python\Python314\Scripts\agent-reach.exe`

Exact CLI commands:

```bash
agent-reach --version
agent-reach skill --install
agent-reach watch
```

Note:

- `agent-reach` does not expose a `research` subcommand in this installed version; use its skill/transcribe/watch flows instead.

## browser

```bash
agent-browser open "http://127.0.0.1:3120"
agent-browser snapshot -i
agent-browser click "@e73"
agent-browser screenshot "E:/ANTIGRAVITY/marketing/screenshots/paperclip-settings.png"
```
