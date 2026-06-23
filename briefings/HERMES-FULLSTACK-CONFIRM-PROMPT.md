# Hermes — Confirm the full ANTIGRAVITY stack on Sabretooth

You are Hermes Agent running in WSL Ubuntu inside Sabretooth (192.168.0.8). Your job: verify every component of the live stack and report exactly what is up, what is down, and what needs human action. Joshua will paste your response back to Opus.

You can call `terminal` to run `curl`, `bash`, and `ps` in WSL, and `powershell.exe -Command "<cmd>"` to reach Windows-side state when needed (paths look like `/mnt/c/...` from your side).

## The full stack you are confirming

### Layer 1 — Local services on Sabretooth

| Component | Where | Probe |
|---|---|---|
| Paperclip API | Windows, port 3100 | `curl -s http://127.0.0.1:3100/api/health` → `status:ok` |
| Paperclip embedded Postgres | Windows, port 54329 | TCP listening |
| Hermes Router (LLM, FastAPI) | WSL, port 11435 | `curl -s http://127.0.0.1:11435/healthz` → 200 |
| Ollama | Windows, port 11434 | `curl -s http://127.0.0.1:11434/` → `Ollama is running` |
| OpenClaw Gateway (HTTP) | Windows, port 18789 | `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18789/__openclaw__/canvas/` → 200 |
| OpenClaw Browser Control | Windows, port 18791 | TCP listening (auth=membership record, no public probe) |
| Hermes Agent CLI (you) | WSL, `/home/josh/.local/bin/hermes` | self-evident — you are running |

### Layer 2 — Public surfaces (Cloudflare tunnels)

| Hostname | Origin | Tunnel host node |
|---|---|---|
| `paperclip-hq.youandinotai.com` | Sabretooth `:3100` | Sabretooth `cloudflared.exe` (tunnel `c7bc9665-3923-4977-acd7-2033838cd56e`) |
| `mcp.youandinotai.com` | T5500 brain-mcp `:3099` | T5500 docker-compose tunnel (membership record-based, separate ID) |

T5500 is at `192.168.0.15`. If `mcp.youandinotai.com` returns 1033, T5500's brain-mcp tunnel is the issue — not Sabretooth's auth.

### Layer 3 — Resilience (autostart + watchdogs)

| File | Role |
|---|---|
| `C:\Antigravity\scripts\autostart-mission.ps1` | Login-time orchestrator: starts Docker, Hermes Router, watchdogs, opens Claude Code window, opens you (Hermes Agent), waits for OpenClaw and opens its dashboard |
| `C:\Antigravity\scripts\paperclip-watchdog.ps1` | Polls `:3100` + cloudflared every 30s, restarts silently |
| `C:\Antigravity\scripts\hermes-watchdog.ps1` | Polls `:11435` every 30s, restarts via WSL |
| `…\Startup\Antigravity Mission Stack.cmd` | Fires the orchestrator at login |
| `…\Startup\OpenClaw Gateway.cmd` | Fires OpenClaw gateway at login |

Sabretooth runs in passwordless mode (PIN-only). After power loss, the stack waits for Joshua to PIN in, then the Startup folder fires and watchdogs hold the line.

## Step 1 — Probe every component

Run all of these. Capture status codes / output. Do not stop on a failure — collect everything first.

```bash
echo "--- Layer 1 (local) ---"
curl -s -o /dev/null -w "paperclip-3100:    %{http_code}\n" http://127.0.0.1:3100/api/health
curl -s -o /dev/null -w "openclaw-18789:    %{http_code}\n" http://127.0.0.1:18789/__openclaw__/canvas/
curl -s -o /dev/null -w "hermes-router-11435: %{http_code}\n" http://127.0.0.1:11435/healthz
curl -s -o /dev/null -w "ollama-11434:      %{http_code}\n" http://127.0.0.1:11434/
echo "postgres-54329:    $(powershell.exe -Command "(Test-NetConnection 127.0.0.1 -Port 54329 -WarningAction SilentlyContinue).TcpTestSucceeded" 2>/dev/null | tr -d '\r')"
echo "browser-ctl-18791: $(powershell.exe -Command "(Test-NetConnection 127.0.0.1 -Port 18791 -WarningAction SilentlyContinue).TcpTestSucceeded" 2>/dev/null | tr -d '\r')"

echo
echo "--- Layer 2 (public tunnels) ---"
curl -s -o /dev/null -w "paperclip-hq-public: %{http_code}\n" https://paperclip-hq.youandinotai.com/api/health
curl -s -o /dev/null -w "mcp-public:          %{http_code}\n" https://mcp.youandinotai.com/health

echo
echo "--- Layer 3 (resilience) ---"
powershell.exe -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'paperclip-watchdog' } | Select-Object -First 1 ProcessId | ForEach-Object { 'paperclip-watchdog: PID ' + \$_.ProcessId } ; if (-not (Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'paperclip-watchdog' })) { 'paperclip-watchdog: NOT RUNNING' }"
powershell.exe -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'hermes-watchdog' } | Select-Object -First 1 ProcessId | ForEach-Object { 'hermes-watchdog: PID ' + \$_.ProcessId } ; if (-not (Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'hermes-watchdog' })) { 'hermes-watchdog: NOT RUNNING' }"
powershell.exe -Command "if (Get-Process cloudflared -ErrorAction SilentlyContinue) { 'cloudflared: RUNNING' } else { 'cloudflared: NOT RUNNING' }"

echo
echo "--- Today's autostart log ---"
powershell.exe -Command "Get-Content C:\Antigravity\logs\autostart-$(date +%Y-%m-%d).log -ErrorAction SilentlyContinue | Select-Object -Last 12"
```

## Step 2 — Glance at recent errors in key logs

```bash
echo "--- paperclip-watchdog tail ---"
powershell.exe -Command "Get-Content C:\Antigravity\logs\paperclip-watchdog.log -Tail 8"
echo
echo "--- hermes-watchdog tail ---"
powershell.exe -Command "Get-Content C:\Antigravity\logs\hermes-watchdog.log -Tail 8"
echo
echo "--- cloudflared stderr tail ---"
powershell.exe -Command "Get-Content C:\Antigravity\logs\cloudflared.stderr.log -Tail 8"
```

## Step 3 — Report

Fill in this exact template and reply with it. Do not add commentary outside the template:

```
=== ANTIGRAVITY STACK CONFIRM ===
Time: <ISO timestamp>
Node: SABRETOOTH

LAYER 1 — LOCAL SERVICES
  paperclip-3100:        <code or note>
  openclaw-18789:        <code>
  hermes-router-11435:   <code>
  ollama-11434:          <code>
  postgres-54329:        <True/False>
  browser-ctl-18791:     <True/False>

LAYER 2 — PUBLIC TUNNELS
  paperclip-hq.youandinotai.com:  <code>
  mcp.youandinotai.com:           <code>

LAYER 3 — RESILIENCE
  paperclip-watchdog:  <PID or NOT RUNNING>
  hermes-watchdog:     <PID or NOT RUNNING>
  cloudflared:         <RUNNING / NOT RUNNING>
  Autostart log last lines: <paste last 3-5 lines verbatim>

ERRORS WORTH REPORTING
  <bullet list — only include actual errors, not info-level noise>
  <if none, write "none">

OUTSTANDING — NEEDS JOSH
  <bullet list — anything that requires Joshua's hands>
  <e.g. T5500 power-on, browser auth click, file move>
  <if none, write "none">

VERDICT
  <one of: ALL GREEN | DEGRADED (mcp tunnel only) | DEGRADED (other) | BROKEN>
=== END ===
```

## Rules

- Do not restart anything yet. Confirm-only on this pass.
- Do not edit `paperclip-hq.yml` or any autostart script — Joshua reviews changes before they ship.
- If a probe hangs >10s, mark it `TIMEOUT` and move on.
- Keep the report compact. Joshua pastes it whole back to Opus.
