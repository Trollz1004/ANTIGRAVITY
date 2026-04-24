# paperclip-mcp

Stdio MCP server that exposes the existing `paperclip-adapters/*.cmd`
launchers and the local LiteLLM gateway (port 4000) as MCP tools.

One server, three clients (Codex, Claude Code, Gemini CLI) — same binary,
different config entries. Every node that has `C:\ANTIGRAVITY` cloned will
resolve identical paths.

## Tools

| Tool | Purpose |
|---|---|
| `list_backends()` | Enumerate `.cmd` adapters on disk |
| `launch_backend(backend, extra_args?)` | Open a new console window running the adapter in `C:\ANTIGRAVITY` (interactive sessions: codex, claude, gemini, opencode, hermes, ollama-glm, ...) |
| `health_check(backend)` | Verify adapter file + report its exec line |
| `swap_default(backend)` | Persist a default backend to disk |
| `get_default()` | Read the persisted default |
| `list_models()` | Models exposed by LiteLLM (`/v1/models`) |
| `complete(prompt, model?, system?)` | One-shot chat completion via LiteLLM (`/v1/chat/completions`) |

Facts-only: failures return the literal error. No silent fallbacks.

## Install (per node)

From `C:\ANTIGRAVITY`:

```cmd
python -m pip install -r paperclip-mcp\requirements.txt
```

Verify the launcher resolves Python and the script:

```cmd
paperclip-mcp\paperclip-mcp.cmd --help
```
(Will hang on stdio waiting for an MCP client — Ctrl+C to exit. That's correct.)

## Wire into Codex (`%USERPROFILE%\.codex\config.toml`)

```toml
[mcp_servers.paperclip]
command = "C:\\ANTIGRAVITY\\paperclip-mcp\\paperclip-mcp.cmd"
args = []
cwd = "C:\\ANTIGRAVITY"
env_passthrough = ["PATH", "USERPROFILE", "HOME", "OPENCODE_API_KEY", "GEMINI_API_KEY", "GITHUB_TOKEN"]

[mcp_servers.paperclip.env]
ANTIGRAVITY_ROOT = "C:\\ANTIGRAVITY"
LITELLM_BASE_URL = "http://127.0.0.1:4000"
```

## Wire into Claude Code

Already added to repo `.mcp.json` — Claude Code picks it up automatically when
opened in `C:\ANTIGRAVITY`. For user-scope (every project on a node):

```cmd
claude mcp add paperclip C:\ANTIGRAVITY\paperclip-mcp\paperclip-mcp.cmd --scope user
```

## Wire into Gemini CLI (`%USERPROFILE%\.gemini\settings.json`)

```json
{
  "mcpServers": {
    "paperclip": {
      "command": "C:\\ANTIGRAVITY\\paperclip-mcp\\paperclip-mcp.cmd",
      "env": {
        "ANTIGRAVITY_ROOT": "C:\\ANTIGRAVITY",
        "LITELLM_BASE_URL": "http://127.0.0.1:4000"
      }
    }
  }
}
```

## Trust boundary

Stdio transport — only locally-configured clients (Codex, Claude Code, Gemini
CLI on this node) can reach it. No network listener. The `complete` tool
proxies through LiteLLM, which has its own model_list whitelist in
`litellm-config.yaml`.
