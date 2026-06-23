# Cloudflare Tunnel Migration: Sabretooth → T5500

**Date:** 2026-05-12
**Authority:** Opus + Josh dual-approval before execution
**Status:** RUNBOOK — not yet executed

---

## Why this runbook exists

The current Cloudflare Tunnel named **`sabretooth`** carries 5 routes that all terminate at `localhost:<port>` on the Sabretooth node:

| Hostname | Origin (sabretooth-local) | Public exposure |
|---|---|---|
| `mcp.youandinotai.com` | `http://localhost:3100` | MCP server |
| `paperclip.youandinotai.com` | `http://localhost:3100` | Legacy paperclip — OK to retire |
| `hermes.youandinotai.com` | `http://localhost:8000` | Hermes router |
| `openclaw-gw.youandinotai.com` | `http://localhost:18789` | OpenClaw gateway |
| `dashboard.aidoesitall.website` | `http://localhost:3100` | Public dashboard |

When Sabretooth is factory-reset, **all 5 routes return Cloudflare error 1033 (tunnel offline)**. Two of these are public-facing (`dashboard.aidoesitall.website`, `hermes.youandinotai.com`) — that's real downtime if not migrated first.

The DNS records (CNAMEs to `<tunnel-id>.cfargotunnel.com`) continue to resolve, but the tunnel daemon serving them is dead. This is uglier than NXDOMAIN — users see a Cloudflare error page.

---

## Migration strategy: re-create tunnel on T5500

We do NOT try to "transfer" the existing tunnel — Cloudflare tunnels are bound to the daemon credentials on the originating node. Clean approach:

1. **Create a new tunnel** named `t5500` (or similar) on T5500
2. **Re-publish the routes** under the new tunnel (same hostnames, same origin ports on T5500)
3. **Cloudflare auto-updates the CNAME records** to point at the new tunnel's UUID
4. **Verify each hostname resolves + serves** before touching Sabretooth
5. **Then** Sabretooth-side cleanup (or just wipe)

The hostnames don't change. Public users see no change. Behind the curtain, the tunnel daemon moves nodes.

**Prerequisite:** the services on Sabretooth's ports `3100`, `8000`, `18789` need to exist on T5500 first. Otherwise the migration just relocates the broken state. See §"Service readiness check" below.

---

## Phase 0 — Pre-flight on T5500

### 0.1 — Service readiness check

These services currently serve traffic via the Sabretooth tunnel. They need to be running on T5500 at the matching ports before migration.

| Port | Service | T5500 status to verify |
|---|---|---|
| `3100` | MCP server (`mcp-server`, sentry) AND `dashboard.aidoesitall.website` static (shared port via reverse-proxy on Sabretooth?) | Run `node C:\Antigravity\mcp-server\dist\index.js` or equivalent; confirm `curl http://localhost:3100/health` |
| `8000` | Hermes router | Per Gemini's audit, port 8000 was reporting connection-refused — verify Hermes router exists on T5500; if not, **DO NOT migrate this route**, decommission it. |
| `18789` | OpenClaw gateway | Verify OpenClaw container or binary on T5500; if not present and OpenClaw is meant to be retired (per `feedback_no_paperclip_ever.md` it's scoped to dating-app support), confirm with Josh before migrating |

**Decommission candidates (do NOT migrate, just remove route):**
- `paperclip.youandinotai.com` — paperclip is retired per doctrine. Remove route at migration time; let DNS go NXDOMAIN.

### 0.2 — Install cloudflared on T5500

If not already installed:

```powershell
# Option A: winget
winget install --id Cloudflare.cloudflared --silent

# Option B: direct MSI from https://github.com/cloudflare/cloudflared/releases/latest
#   cloudflared-windows-amd64.msi
```

Verify:
```powershell
cloudflared --version
```

### 0.3 — Authenticate cloudflared to Cloudflare

```powershell
cloudflared tunnel login
```

This opens a browser window. Approve the `Trollz1004`-owned domains. Saves cert to `%USERPROFILE%\.cloudflared\cert.pem`.

### 0.4 — Confirm `CLOUDFLARE_API_TOKEN` is live

Per `briefings/PLATFORM-LIVENESS-2026-05-12.md`, the Cloudflare membership record was DEAD as of 2026-05-12. **Josh must mint a fresh membership record** at https://dash.cloudflare.com/profile/api-membership records before this migration runs. membership record needs at minimum:
- Zone:Zone:Read
- Zone:DNS:Edit
- Account:Cloudflare Tunnel:Edit

Save updated membership record to vault and load into shell:
```powershell
$env:CLOUDFLARE_API_TOKEN = (gc 'C:\Users\joshl\OneDrive\Personal Vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env' | sls '^CLOUDFLARE_API_TOKEN=' | %{ ($_ -split '=', 2)[1] })
```

---

## Phase 1 — Create new tunnel on T5500

```powershell
# Create the tunnel (gives you a UUID + credentials file)
cloudflared tunnel create t5500
# Output: "Created tunnel t5500 with id <UUID>"
# Credentials saved to: %USERPROFILE%\.cloudflared\<UUID>.json
```

Note the UUID — needed for routes config.

---

## Phase 2 — Route config

Create config file at `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <UUID-FROM-PHASE-1>
credentials-file: C:\Users\joshl\.cloudflared\<UUID>.json

ingress:
  - hostname: mcp.youandinotai.com
    service: http://localhost:3100
  - hostname: hermes.youandinotai.com
    service: http://localhost:8000
  - hostname: openclaw-gw.youandinotai.com
    service: http://localhost:18789
  - hostname: dashboard.aidoesitall.website
    service: http://localhost:3100
  # paperclip.youandinotai.com — INTENTIONALLY NOT MIGRATED (retire)
  - service: http_status:404
```

The trailing `http_status:404` catch-all is required.

---

## Phase 3 — DNS rebind

For each hostname, re-route its CNAME to the new tunnel:

```powershell
cloudflared tunnel route dns t5500 mcp.youandinotai.com
cloudflared tunnel route dns t5500 hermes.youandinotai.com
cloudflared tunnel route dns t5500 openclaw-gw.youandinotai.com
cloudflared tunnel route dns t5500 dashboard.aidoesitall.website
```

This updates the CNAME records under the hood from `<sabretooth-tunnel-uuid>.cfargotunnel.com` to `<t5500-uuid>.cfargotunnel.com`. **Propagation: typically <60 seconds.** Cloudflare is anycast.

For `paperclip.youandinotai.com` — delete the DNS record manually via Cloudflare dashboard so it returns NXDOMAIN cleanly. Don't migrate.

---

## Phase 4 — Start the tunnel as a Windows service

```powershell
# Install as service (auto-starts on boot)
cloudflared service install

# Start now
Start-Service cloudflared
Get-Service cloudflared  # confirm "Running"
```

Logs go to `%PROGRAMDATA%\Cloudflare\cloudflared\cloudflared.log`.

---

## Phase 5 — Verify before Sabretooth wipe

For each migrated hostname, confirm it serves from T5500:

```powershell
foreach ($host in @(
    "mcp.youandinotai.com",
    "hermes.youandinotai.com",
    "openclaw-gw.youandinotai.com",
    "dashboard.aidoesitall.website"
)) {
    $r = Invoke-WebRequest -Uri "https://$host/" -SkipHttpErrorCheck -UseBasicParsing
    Write-Host "$host : HTTP $($r.StatusCode)"
}
```

**Expected:** each returns whatever the T5500 service serves (200, 404 from the service, redirect — anything that isn't "522 origin connection refused" or "1033 tunnel offline").

If any fails: do NOT wipe Sabretooth yet. Diagnose the T5500 service first.

---

## Phase 6 — Optional pre-wipe: stop Sabretooth tunnel daemon

This is a defensive step — once the DNS rebinds in Phase 3 propagate (~1 min), the old Sabretooth tunnel daemon stops getting any traffic. So technically nothing happens if you leave it running. But for cleanliness:

```
# On Sabretooth (before wipe):
sudo systemctl stop cloudflared
# Linux
# OR
Stop-Service cloudflared
# Windows
```

Or just let the wipe handle it.

---

## Phase 7 — Post-wipe verification

After Sabretooth is wiped:

```powershell
# Confirm tunnel is healthy from T5500
cloudflared tunnel info t5500
cloudflared tunnel list  # should show only t5500 (or t5500 + old sabretooth if not deleted)

# Delete the old sabretooth tunnel record from Cloudflare (housekeeping)
cloudflared tunnel delete sabretooth
```

---

## Rollback plan (if migration goes wrong)

The migration is reversible at the DNS layer (the safest place to roll back from):

1. Get the old sabretooth tunnel UUID: `cloudflared tunnel list` (from Cloudflare dashboard if local tunnel data is gone)
2. Re-route the affected hostnames back: `cloudflared tunnel route dns sabretooth <hostname>` — though this requires the sabretooth tunnel daemon to still be alive on Sabretooth. If Sabretooth was already wiped, rollback path is "spin up a temporary tunnel on T5500 named sabretooth pointing at the right services" or just fix forward.

**Best safety: don't wipe Sabretooth until Phase 5 verification all-green.**

---

## What this runbook does NOT cover

- Migrating the actual services (MCP server, Hermes router, OpenClaw gateway) from Sabretooth to T5500. That's a separate task — likely already partially done since most code is in the ANTIGRAVITY repo and on T5500's filesystem, but the running processes need to actually be running on T5500.
- The youandinotai.com apex Cloudflare Pages binding (that's the 27K-view bleed fix Gemini described — done via Pages → Custom domains UI, separate from this tunnel work).
- Re-issuing the Cloudflare API membership record (currently dead per platform liveness audit).

---

## Approval gate

This runbook is a draft. Do not execute Phase 1+ without:
1. Josh's go on the migration timing
2. Verification that services are running on T5500 (Phase 0.1)
3. Fresh Cloudflare API membership record in vault (Phase 0.4)
4. Opus + Josh dual sign-off if any phase changes scope

Per the Financial Protection Rule + Officially Unofficial doctrine: this touches DNS for live revenue-adjacent domains. Treat as a production change.
