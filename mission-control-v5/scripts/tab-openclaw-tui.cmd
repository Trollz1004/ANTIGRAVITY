@echo off
rem ── OpenClaw TUI — client only, ClawX owns the gateway on :18789 ──────────
rem
rem WHY THE PROBE: this tab used to run "openclaw tui" unconditionally. ClawX
rem auto-starts its OWN TUI at logon, so the tab produced a SECOND one - two
rem clients contending for the single gateway, which ClawX reports in its
rem status line as "gateway error | port: 18789". Observed 2026-08-04 with
rem both node openclaw.mjs tui processes alive at once.
rem
rem So: if a TUI is already running, this tab stays out of the way. It never
rem starts a gateway of its own - a second gateway clobbers openclaw.json.
title openclaw-tui
cd /d F:\ANTIGRAVITY

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "exit ((Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'openclaw\.mjs.+tui' } | Measure-Object).Count)"

if errorlevel 1 (
  echo [openclaw-tui] a TUI is already running - ClawX started it at logon.
  echo.
  echo Starting a second one makes both fight over the gateway on :18789,
  echo which is what "gateway error" in the ClawX status line means.
  echo Use the TUI ClawX already opened. This tab is idle on purpose.
  echo.
  echo Close this tab any time.
  pause >nul
) else (
  echo [openclaw-tui] no TUI running - starting one. Gateway :18789 stays ClawX's job.
  if exist "C:\Program Files\ClawX\resources\cli\openclaw.cmd" (
    call "C:\Program Files\ClawX\resources\cli\openclaw.cmd" tui
  ) else (
    echo ClawX CLI not found - falling back to global openclaw.
    call openclaw tui
  )
)
