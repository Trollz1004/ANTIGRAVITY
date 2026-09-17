@echo off
rem ═══════════════════════════════════════════════════════════════════════
rem  drift — Joshua's one way in.                      updated 2026-09-10
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
rem    drift health     run the 30-min deterministic health probe now and print
rem                     the table (ops/heartbeat/sabretooth-health.ps1 -Verbose)
rem    drift wall       open FABLE'S SENTRY (http://192.168.0.8:9140/) in the browser
rem    drift ledger     last 30 lines of the cross-node ledger (ops/buzz)
rem    drift dns        current nameservers for the 14 project domains
rem    drift mc         open JARVIS / Mission Control (http://192.168.0.8:9150/)
rem    drift jarvis     same as drift mc
rem    drift avatar     open JARVIS (http://192.168.0.8:9150/): agents, vault
rem                     graph, avatar, OmniRoute widgets, Mission Control embedded, Claude CLI
rem    drift fable      talk to Joshua's house model joshlcoleman/Fable on the
rem                     local Ollama (the mandatory Date App voice model,
rem                     ruled 2026-09-06; Modelfile ops/fable-model/)
rem
rem  What "the stack" means today (FABLES-HOUSE.ps1 stages, in order):
rem    PostgreSQL 5432 · Redis 6379 · OmniRoute 20128 (identity+latency probe)
rem    JARVIS (Mission Control) 9150 (the one hub, ruled 2026-09-17; AIRI retired,
rem    Paperclip PARKED 2026-09-10) · Date App 3200/8000 · cloudflared tunnel ·
rem    Mission Control v5 3151 (optional; embedded data source for JARVIS) ·
rem    MC6 8787 (uptime) · Ollama 11434 (fail-safe;
rem    identity = joshlcoleman/Fable present) · OmniRoute is 3.8.50 since 2026-09-06
rem    Hermes dashboard 9119 · OpenClaw 18789 · Hermes API 8642
rem    vote service 9134 · FABLE'S SENTRY 9140 (the wall) · Obsidian REST 27123 (report only)
rem  Not started here, watched by the wall: Buzz relay, Open Collective, the
rem  public sites. Claude is the judge lane; it never routes through OmniRoute.
rem ═══════════════════════════════════════════════════════════════════════
title ANTIGRAVITY drift
cd /d C:\ANTIGRAVITY

set "HOUSE=C:\ANTIGRAVITY\scripts\fables-house\FABLES-HOUSE.ps1"
set "HEALTH=C:\ANTIGRAVITY\ops\heartbeat\sabretooth-health.ps1"

if /I "%~1"=="bare"   goto :claude
if /I "%~1"=="audit"  goto :audit
if /I "%~1"=="health" goto :health
if /I "%~1"=="wall"   goto :wall
if /I "%~1"=="ledger" goto :ledger
if /I "%~1"=="dns"    goto :dns
if /I "%~1"=="mc"     goto :mc
if /I "%~1"=="jarvis" goto :mc
if /I "%~1"=="avatar" goto :avatar
if /I "%~1"=="fable"  goto :fable

if not exist "%HOUSE%" (
  echo [drift] FABLE'S HOUSE script not found at %HOUSE%
  echo [drift] Opening Claude anyway - the stack was NOT started.
  goto :claude
)

rem Minimized so it never steals focus or the cursor. No -Watchdog here on
rem purpose: the bring-up spawns the silent watchdog itself (2026-09-10; the
rem Startup-folder launcher is retired, the logon task runs the House elevated).
rem The House keeps ONE watchdog alive; a second would double every heal.
echo [drift] Bringing FABLE'S HOUSE up in the background...
start "FABLE'S HOUSE - bring-up" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%HOUSE%"

if /I "%~1"=="house" (
  echo [drift] Stack bring-up launched. Not opening Claude ^(house mode^).
  exit /b 0
)

:claude
claude --continue --dangerously-skip-permissions "/sabretooth-node"
exit /b %ERRORLEVEL%

:audit
echo [drift] Probing every Sentry target with identity checks...
call npm run -s fable -- audit
exit /b %ERRORLEVEL%

:health
powershell -NoProfile -ExecutionPolicy Bypass -File "%HEALTH%" -Verbose
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

:mc
start "" http://192.168.0.8:9150/
exit /b 0

:avatar
start "" http://192.168.0.8:9150/
exit /b 0

:fable
rem Joshua's own model, private on ollama.com, built from opsable-model\Modelfile.
rem Ollama stays the fail-safe route for harnesses; this is the drafting voice.
ollama run joshlcoleman/Fable %2 %3 %4 %5 %6 %7 %8 %9
exit /b %ERRORLEVEL%
