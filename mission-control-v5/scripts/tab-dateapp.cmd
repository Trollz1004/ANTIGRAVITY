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
cd /d F:\ANTIGRAVITY\frontend\react-app

if not exist "dist\index.html" (
  echo [dateapp] no production build found - building first...
  call npm run build
)

rem THE TUNNEL IS NOT STARTED HERE. The Windows service "Cloudflared"
rem (StartMode=Auto) already runs this tunnel and comes up at boot without
rem anyone logging on - which is what a public site should depend on. This tab
rem used to launch a second connector for the SAME tunnel; two connectors
rem silently split public traffic, so a broken one only breaks half the
rem requests, which is the worst kind of failure to diagnose.
rem   Check it:  Get-Service Cloudflared
rem   Restart:   Restart-Service Cloudflared
echo [dateapp] tunnel is owned by the Cloudflared service (not this tab).

echo [dateapp] serving production build on http://127.0.0.1:3200
set "NODE_ENV=production"
set "PORT=3200"
npx tsx server.ts
