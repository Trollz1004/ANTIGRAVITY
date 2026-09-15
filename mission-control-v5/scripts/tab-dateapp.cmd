@echo off
rem ── DateApp — youandinotai.com frontend (:3200) ───────────────────────────
rem
rem PORT=3200 is REQUIRED. server.ts defaults to 8080 without it, and 8080 is
rem the OmniRoute inspector's port - that collision is what produced the
rem crash-loop-and-browser-spam on 2026-07-31.
rem
rem NODE_ENV=production is REQUIRED. Without it server.ts mounts the Vite dev
rem middleware and serves an UNBUILT dev server to the public internet.
rem Verified 2026-08-01: that is exactly what youandinotai.com was doing.
rem
rem Both are set here rather than exported globally, so nothing else on the
rem machine inherits PORT.
title dateapp (:3200)
cd /d C:\ANTIGRAVITY\frontend\react-app

if not exist "dist\index.html" (
  echo [dateapp] no production build found - building first...
  call npm run build
)

rem THE TUNNEL IS NOT STARTED HERE. There is no Windows service named
rem "Cloudflared" - FABLES-HOUSE.ps1 owns the tunnel: its Cloudflared tunnel
rem stage starts cloudflared.exe hidden (-WindowStyle Hidden) and heals it if
rem it falls. This tab used to launch a second connector for the SAME tunnel;
rem two connectors silently split public traffic, so a broken one only breaks
rem half the requests, which is the worst kind of failure to diagnose.
rem   Check it:    Get-Process cloudflared
rem   Restart it:  let the House heal it, or rerun FABLES-HOUSE.cmd
echo [dateapp] tunnel is owned by FABLE'S HOUSE (not this tab).

echo [dateapp] serving production build on http://127.0.0.1:3200
set "NODE_ENV=production"
set "PORT=3200"
npx tsx server.ts
