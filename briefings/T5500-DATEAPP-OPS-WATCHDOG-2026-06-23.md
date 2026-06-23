# T5500 Date App Ops Watchdog - 2026-06-23

## Purpose

Keep the basic production surface stable after reboot, power loss, or tunnel drift:

- Cloudflare Pages public hosts for `youandinotai.com` and `app.youandinotai.com`
- T5500 local date-app static service on `127.0.0.1:3200`
- T5500 Paperclip on `127.0.0.1:3100`
- T5500 Paperclip private auth proxy on `127.0.0.1:3110`
- Paperclip embedded Postgres on `127.0.0.1:54329`
- Cloudflared public Paperclip tunnel hosts
- Wrangler auth and Cloudflare Pages deployment reachability
- DNS resolution for active date-app and Paperclip hosts

## Installed task

Task name:

```text
ANTIGRAVITY-T5500-DateApp-OpsWatchdog
```

Schedule:

```text
At startup
Every 30 minutes
```

Installer:

```powershell
C:\antigravity\scripts\t5500\Install-DateAppOpsWatchdog.ps1
```

Watchdog:

```powershell
C:\antigravity\scripts\t5500\Invoke-DateAppOpsWatchdog.ps1
```

Logs:

```text
C:\antigravity\logs\ops-watchdog\dateapp-ops-watchdog.jsonl
```

SYSTEM Cloudflare/Wrangler env cache:

```text
C:\ProgramData\Antigravity\secrets\cloudflare-wrangler.env
```

The installer creates this local machine cache from the approved runtime env authority when that source is available. The cache is outside the repo and ACL-limited to `SYSTEM` and `Administrators` so the startup watchdog can run Wrangler after reboot without printing or committing secrets.

## Repair rules

The watchdog uses small named ops agents:

- `system-agent`: records memory/process pressure.
- `dateapp-local-agent`: checks and repairs local static/API tasks.
- `paperclip-agent`: checks Paperclip, proxy, and embedded Postgres.
- `cloudflared-agent`: checks cloudflared and repairs the public Paperclip tunnel.
- `dns-agent`: checks DNS resolution for active hosts.
- `wrangler-pages-agent`: verifies Wrangler and Cloudflare Pages deployment access.
- `public-dateapp-agent`: verifies public Pages URLs and can redeploy committed static output with Wrangler if the public Pages hosts are down.

Important guardrail:

```text
The watchdog never runs Paperclip directly as SYSTEM.
It starts or restarts the existing Paperclip scheduled task so embedded Postgres stays out of the SYSTEM/admin launch path.
```

## Manual commands

Install or refresh the task:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Install-DateAppOpsWatchdog.ps1
```

Run one repair pass now:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Invoke-DateAppOpsWatchdog.ps1 -DeployPagesOnPublicDown
```

Run one read-only pass:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\t5500\Invoke-DateAppOpsWatchdog.ps1 -NoRepair
```
