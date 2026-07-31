@echo off
rem ── ANTIGRAVITY stack launcher ────────────────────────────────────────────
rem Opens ONE Windows Terminal window with every stack service as a VISIBLE,
rem controllable tab. No hidden watchdogs, no browser spam — you see and own
rem every process. Close a tab to stop that service.
rem
rem Tabs:
rem   1. fcc-serve      — OmniRoute gateway :20128 (Free Claude Code server)
rem   2. hermes-dash    — Hermes web GUI :9119
rem   3. openclaw-tui   — OpenClaw TUI via the ClawX-bundled CLI
rem                       (ClawX auto-starts the gateway itself on :18789)
rem   4. fcc-claude     — Claude Code CLI through the OmniRoute gateway
rem                       (waits 10s so fcc-serve is up first)
rem
rem Runs at logon via the Startup folder entry ANTIGRAVITY-Stack-Terminal.cmd.
rem Delete that Startup entry to stop auto-launching.

set "SCRIPTS=%~dp0"

wt -w antigravity ^
  new-tab --title "fcc-serve" cmd /k "%SCRIPTS%tab-fcc-serve.cmd" ; ^
  new-tab --title "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd" ; ^
  new-tab --title "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd" ; ^
  new-tab --title "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd"

if errorlevel 1 (
  rem Windows Terminal missing/failed — fall back to four plain windows.
  start "fcc-serve" cmd /k "%SCRIPTS%tab-fcc-serve.cmd"
  start "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd"
  start "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd"
  start "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd"
)
