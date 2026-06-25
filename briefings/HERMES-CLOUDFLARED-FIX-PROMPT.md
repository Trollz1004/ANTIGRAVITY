# Hermes — Fix Cloudflared (mcp + paperclip-hq) and harden for login

You are Hermes, running in WSL Ubuntu inside Sabretooth. Goal: get **both** Cloudflare-fronted hostnames returning 200 and surviving every reboot.

## Hostnames in scope

| Hostname | Origin | Tunnel ID | Config file |
|---|---|---|---|
| `paperclip-hq.youandinotai.com` | `http://127.0.0.1:3100` (Sabretooth) | `c7bc9665-3923-4977-acd7-2033838cd56e` | `C:\Antigravity\infra\cloudflare\paperclip-hq.yml` |
| `mcp.youandinotai.com` | `brain-mcp:3099` on **T5500** (192.168.0.15) | (separate, token-based) | `C:\Antigravity\brain-mcp\docker-compose.t5500.yml` |

Sabretooth's cloudflared serves only paperclip-hq. T5500's docker-compose serves mcp via a token-style tunnel (`${CLOUDFLARE_TUNNEL_TOKEN}` in `~/.env` on T5500).

## Step 1 — Diagnose (do this first, do not skip)

Run these and capture exit codes / output:

```bash
# Sabretooth tunnel — should already work
curl -sS -o /dev/null -w "paperclip-hq: %{http_code}\n" https://paperclip-hq.youandinotai.com/api/health

# T5500 tunnel — this is the suspected 1033
curl -sS -o /dev/null -w "mcp: %{http_code}\n" https://mcp.youandinotai.com/health

# Sabretooth-local origin behind paperclip-hq
curl -sS -o /dev/null -w "local-3100: %{http_code}\n" http://127.0.0.1:3100/api/health

# T5500 reachability over LAN
ping -c 2 192.168.0.15 || true
ssh -i ~/.ssh/id_ed25519 -o ConnectTimeout=4 -o BatchMode=yes joshl@192.168.0.15 'echo t5500_ok' 2>&1 | head -3
```

Decide which scenario you are in:

- **A.** paperclip-hq=200, mcp=1033 → T5500 tunnel down. Skip Step 2 (auth is fine on Sabretooth). Go to Step 3.
- **B.** paperclip-hq=5xx/timeout, mcp=any → Sabretooth tunnel auth or origin issue. Go to Step 2.
- **C.** Both 200 → nothing to fix. Go to Step 4 (verify autostart only).

## Step 2 — Browser auth for Sabretooth cloudflared (only if Scenario B)

Run **from Windows PowerShell** (not WSL — cloudflared.exe and cert.pem live on Windows side):

```powershell
& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel login
```

This opens a browser to dash.cloudflare.com. Tell Joshua:

> "Pick the **youandinotai.com** zone, click **Authorize**. The browser will redirect to a localhost page and close itself. cert.pem will land at `C:\Users\joshl\.cloudflared\cert.pem`."

Wait for him to confirm. Then verify:

```powershell
Get-Item C:\Users\joshl\.cloudflared\cert.pem | Format-List Name, Length, LastWriteTime
```

Restart cloudflared so it picks up fresh creds:

```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
# paperclip-watchdog.ps1 will respawn it within 30s
```

## Step 3 — Bring T5500's brain-mcp tunnel back up

T5500 is at 192.168.0.15, user `joshl`, Windows shell. The brain-mcp stack is a Docker-Compose:

```bash
ssh joshl@192.168.0.15 "cd C:\\Antigravity\\brain-mcp && docker compose -f docker-compose.t5500.yml ps"
```

If the cloudflared container is stopped/crashed, restart it:

```bash
ssh joshl@192.168.0.15 "cd C:\\Antigravity\\brain-mcp && docker compose -f docker-compose.t5500.yml up -d"
```

If `${CLOUDFLARE_TUNNEL_TOKEN}` is missing on T5500, ask Joshua: "T5500's `.env` is missing CLOUDFLARE_TUNNEL_TOKEN. Get the brain-mcp tunnel token from Cloudflare Zero Trust → Access → Tunnels → brain-mcp → Connector token. Paste it here." Then write it to T5500's `.env` via SSH.

If T5500 is unreachable (machine off / disconnected), report that and stop — do not try to migrate the tunnel to Sabretooth without explicit approval. mcp.youandinotai.com staying down until Joshua wakes T5500 is acceptable; mis-routing it from Sabretooth is not.

After bringing it up, verify:

```bash
curl -sS -o /dev/null -w "mcp: %{http_code}\n" https://mcp.youandinotai.com/health
```

Expect 200 within 60s (tunnel handshake takes a few seconds).

## Step 4 — Confirm autostart already covers this

Sabretooth side is already wired:

- Startup folder shortcut: `Antigravity Mission Stack.cmd` → `C:\Antigravity\scripts\autostart-mission.ps1`
- `paperclip-watchdog.ps1` polls cloudflared every 30s; respawns if dead
- Tunnel config: `C:\Antigravity\infra\cloudflare\paperclip-hq.yml`

Verify watchdog is alive:

```powershell
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'paperclip-watchdog' } |
  Select-Object ProcessId, CommandLine
```

If empty, the watchdog crashed — restart it manually:

```powershell
Start-Process powershell -ArgumentList '-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File','C:\Antigravity\scripts\paperclip-watchdog.ps1'
```

T5500 side: the docker-compose has `restart: unless-stopped`, so the tunnel container survives Docker daemon restart but **not** machine power loss unless Docker Desktop is set to start on boot. If T5500's brain-mcp does not return after a T5500 power-cycle, that is the gap to fix.

## Success criteria

- `curl https://paperclip-hq.youandinotai.com/api/health` → 200 with `{"status":"ok",...}`
- `curl https://mcp.youandinotai.com/health` → 200 (or T5500 confirmed off, with that explicitly reported)
- Both watchdogs running (Sabretooth side)
- T5500 docker-compose has `restart: unless-stopped` (already does)

## Report back

Reply in this format:

```
TUNNEL STATE
- paperclip-hq: <code> (<note>)
- mcp:          <code> (<note>)

ACTIONS TAKEN
- <bullet list of what you actually did>

OUTSTANDING
- <anything that needs Joshua to do something — especially T5500 power-on or browser clicks>
```
