@echo off
rem ── DateApp — youandinotai.com (frontend :3200 + tunnel) ──────────────────
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
title dateapp (:3200 + tunnel)
cd /d E:\ANTIGRAVITY\frontend\react-app

if not exist "dist\index.html" (
  echo [dateapp] no production build found - building first...
  call npm run build
)

echo [dateapp] starting cloudflared tunnel for youandinotai.com...
start "cloudflared-dateapp" /min cmd /c ""C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate run --token-file "C:\Users\joshl\.cloudflared\t5500-dateapp.token""

echo [dateapp] serving production build on http://127.0.0.1:3200
set "NODE_ENV=production"
set "PORT=3200"
npx tsx server.ts
