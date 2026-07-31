@echo off
cd /d E:\ANTIGRAVITY
rem ?? ANTIGRAVITY stack launcher ????????????????????????????????????????????
rem Opens ONE Windows Terminal window with every stack service as a VISIBLE,
rem controllable tab. No hidden watchdogs, no browser spam ? you see and own
rem every process. Close a tab to stop that service.
rem
rem Tabs:
rem   1. omniroute      ? OmniRoute gateway :20128 (the real command:
rem                       `omniroute serve`; dashboard http://localhost:20128/home)
rem   2. fcc-server     ? Free Claude Code proxy :8082 (separate tool;
rem                       Admin UI http://127.0.0.1:8082/admin)
rem   3. fcc-claude     ? Claude Code CLI through the FCC proxy
rem                       (waits until :8082 answers)
rem   4. hermes-dash    ? Hermes web GUI :9119
rem   5. openclaw-tui   ? OpenClaw TUI via the ClawX-bundled CLI
rem                       (ClawX auto-starts the gateway itself on :18789)
rem
rem Runs at logon via the Startup folder entry ANTIGRAVITY-Stack-Terminal.cmd.
rem Delete that Startup entry to stop auto-launching.

set "SCRIPTS=%~dp0"

wt -w antigravity ^
  new-tab --title "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd" ; ^
  new-tab --title "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd" ; ^
  new-tab --title "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd" ; ^
  new-tab --title "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd" ; ^
  new-tab --title "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd"

if errorlevel 1 (
  rem Windows Terminal missing/failed ? fall back to plain windows.
  start "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd"
  start "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd"
  start "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd"
  start "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd"
  start "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd"
)
