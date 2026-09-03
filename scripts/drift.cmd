@echo off
rem ═══════════════════════════════════════════════════════════════════════
rem  drift — Joshua's one way in.                      updated 2026-09-03
rem
rem  Brings the whole Sabretooth stack up AND opens Claude. The bring-up runs
rem  in its own minimized window so it never blocks the conversation: Claude
rem  opens immediately and the House converges behind it.
rem
rem  DO NOT RENAME THIS FILE. Standing rule.
rem  Tracked copy: C:\ANTIGRAVITY\scripts\drift.cmd (this file is the live one
rem  on PATH at %USERPROFILE%\.local\bin; keep the two identical).
rem
rem  Usage:
rem    drift            bring the stack up, then open Claude        (default)
rem    drift bare       open Claude only, touch nothing
rem    drift house      bring the stack up only, no Claude
rem    drift audit      probe every FABLE'S SENTRY target with identity checks
rem                     (npm run fable -- audit) and print the table; no Claude
rem    drift wall       open FABLE'S SENTRY (http://192.168.0.8:9140/) in the browser
rem    drift ledger     last 30 lines of the cross-node ledger (ops/buzz)
rem    drift dns        current nameservers for the 14 project domains
rem
rem  What "the stack" means today (FABLES-HOUSE.ps1 stages, in order):
rem    PostgreSQL 5432 · Redis 6379 · OmniRoute 20128 (identity+latency probe)
rem    Paperclip 3100 = Mission Control · Date App 3200/8000 · cloudflared tunnel
rem    MC5 3151 (vote engine, legacy) · MC6 8787 (uptime) · Ollama 11434 (fail-safe)
rem    Hermes 9119 · OpenClaw 18789 · CEO bridge 3140 · Hermes gateway 8642
rem    vote service 9134 · FABLE'S SENTRY 9140 (the wall) · Obsidian REST 27123 (report only)
rem  Not started here, watched by the wall: Buzz relay, Open Collective, the
rem  public sites. Claude is the judge lane; it never routes through OmniRoute.
rem ═══════════════════════════════════════════════════════════════════════
title ANTIGRAVITY drift
cd /d C:\ANTIGRAVITY

set "HOUSE=C:\ANTIGRAVITY\scripts\fables-house\FABLES-HOUSE.ps1"

if /I "%~1"=="bare"   goto :claude
if /I "%~1"=="audit"  goto :audit
if /I "%~1"=="wall"   goto :wall
if /I "%~1"=="ledger" goto :ledger
if /I "%~1"=="dns"    goto :dns

if not exist "%HOUSE%" (
  echo [drift] FABLE'S HOUSE script not found at %HOUSE%
  echo [drift] Opening Claude anyway - the stack was NOT started.
  goto :claude
)

rem Minimized so it never steals focus or the cursor. No -Watchdog here on
rem purpose: fables-house-watchdog.cmd already runs from Startup and guards
rem the stack silently, file-log only. Starting a second one would double
rem every heal and break the no-spam rule.
echo [drift] Bringing FABLE'S HOUSE up in the background...
start "FABLE'S HOUSE - bring-up" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%HOUSE%"

if /I "%~1"=="house" (
  echo [drift] Stack bring-up launched. Not opening Claude ^(house mode^).
  exit /b 0
)

:claude
claude --continue --dangerously-skip-permissions
exit /b %ERRORLEVEL%

:audit
echo [drift] Probing every Sentry target with identity checks...
call npm run -s fable -- audit
exit /b %ERRORLEVEL%

:wall
start "" http://192.168.0.8:9140/
exit /b 0

:ledger
call npm run -s fable -- ledger --tail 30
exit /b %ERRORLEVEL%

:dns
call npm run -s fable -- dns
exit /b %ERRORLEVEL%
