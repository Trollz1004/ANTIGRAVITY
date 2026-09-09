# BRAIN MCP

BRAIN MCP is the ANTIGRAVITY sidecar for shared operational truth, lane awareness, and session audit visibility.

It does not replace `AGENTS.md`, git, or platform-specific memory.

## What It Provides

- MCP tools for session check-in, heartbeat, action logging, exit, and repo truth reads
- MCP resources for canonical repo files and recent audit state
- SQLite-backed session and action history
- append-only JSONL audit logs
- lane and trust-tier awareness
- optional HTTP bearer-token auth for LAN use

## What It Does Not Do

- does not return secret values
- does not proxy LLM inference
- does not auto-pull, auto-reset, or auto-revert
- does not grant authority over Josh or `AGENTS.md`

## Install

```powershell
cd C:\ANTIGRAVITY\brain-mcp
npm install
npm run build
```

## Run Locally Over stdio

```powershell
cd C:\ANTIGRAVITY\brain-mcp
npm start
```

## Run As LAN HTTP Sidecar

PowerShell:

```powershell
$env:BRAIN_TRANSPORT = "http"
$env:BRAIN_HTTP_HOST = "127.0.0.1"
$env:BRAIN_HTTP_PORT = "3900"
$env:BRAIN_PLATFORM_CONFIG = "C:\BRAIN-MCP\platform-registry.json"
$env:BRAIN_REQUIRE_AUTH = "true"
npm start
```

Health check:

- `http://127.0.0.1:3900/health`
- `http://127.0.0.1:3900/mcp`

## Registry File

Point `BRAIN_PLATFORM_CONFIG` to a JSON file outside git.

See:

- `C:\ANTIGRAVITY\brain-mcp\config\platform-registry.example.json`

Only token hashes belong there, never raw tokens.

Generate a token hash after build:

```powershell
cd C:\ANTIGRAVITY\brain-mcp
npm run token:hash -- "replace-with-real-token"
```

## Local MCP Wiring Example

If you want a local process-spawned MCP entry, add a local `.mcp.json` entry similar to:

```json
{
  "mcpServers": {
    "brain-mcp": {
      "command": "node",
      "args": ["C:\\ANTIGRAVITY\\brain-mcp\\dist\\index.js"]
    }
  }
}
```

Keep that file local. The repo ignores `.mcp.json`.
