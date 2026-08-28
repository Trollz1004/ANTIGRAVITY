@echo off
rem ═══════════════════════════════════════════════════════════════════════
rem  FABLE'S SENTRY — the easy button.
rem
rem  Starts the wall display and opens it. Put this on the Asus mini PC or a
rem  spare monitor: every port, URL, MCP and harness, green or red, with a
rem  FIX button on anything that is down.
rem
rem  It binds 0.0.0.0, so any machine on the LAN can watch the same board at
rem  http://<this-machine>:9140  — the mini PC does not need its own copy.
rem ═══════════════════════════════════════════════════════════════════════
title FABLE'S SENTRY
cd /d C:\ANTIGRAVITY

powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 9140 -State Listen -ErrorAction SilentlyContinue)) { Start-Process 'node' -ArgumentList 'apps\fables-sentry\server.mjs' -WorkingDirectory 'C:\ANTIGRAVITY' -WindowStyle Hidden; Start-Sleep -Seconds 3 }"

start "" http://127.0.0.1:9140/
echo.
echo   FABLE'S SENTRY is up.
echo.
echo     this machine : http://127.0.0.1:9140/
echo     on the LAN   : http://%COMPUTERNAME%:9140/
echo.
echo   Leave this window closed if you like - the server keeps running.
timeout /t 6 >nul
