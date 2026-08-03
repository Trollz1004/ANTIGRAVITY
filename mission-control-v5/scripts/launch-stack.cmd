@echo off
cd /d E:\ANTIGRAVITY
rem ANTIGRAVITY stack launcher
rem
rem Opens ONE Windows Terminal window with every stack service as a VISIBLE,
rem controllable tab. No hidden watchdogs, no browser spam - you see and own
rem every process. Close a tab to stop that service.
rem
rem Tabs, in dependency order:
rem   1. omniroute       - gateway :20128, dashboard http://localhost:20128/home
rem                        Everything else routes through it, so it starts first.
rem   2. dateapp-3200    - youandinotai.com: production build + cloudflared
rem                        tunnel. Second because it is the only public product.
rem   3. mission-control - :3151 dashboard. LOCAL ONLY, this server has no auth.
rem   4. fcc-server      - Free Claude Code proxy :8082, admin UI at /admin
rem   5. fcc-claude      - Claude Code CLI through that proxy (waits for :8082)
rem   6. hermes-dash     - Hermes web GUI :9119
rem   7. openclaw-tui    - OpenClaw TUI via the ClawX CLI. ClawX runs the
rem                        gateway itself on :18789 - never start a second one.
rem
rem Runs at logon via the Startup entry ANTIGRAVITY-Stack-Terminal.cmd.
rem Delete that file to stop auto-launching.

set "SCRIPTS=%~dp0"

rem OmniRoute goes first - every other lane routes through it. DateApp is next
rem because it is the only public-facing product; if the machine reboots and
rem nothing else comes back, youandinotai.com still should.
wt -w antigravity ^
  new-tab --title "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd" ; ^
  new-tab --title "dateapp-3200" cmd /k "%SCRIPTS%tab-dateapp.cmd" ; ^
  new-tab --title "mission-control-3151" cmd /k "%SCRIPTS%tab-mission-control.cmd" ; ^
  new-tab --title "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd" ; ^
  new-tab --title "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd" ; ^
  new-tab --title "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd" ; ^
  new-tab --title "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd"

if errorlevel 1 (
  rem Windows Terminal missing/failed - fall back to plain windows.
  start "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd"
  start "dateapp-3200" cmd /k "%SCRIPTS%tab-dateapp.cmd"
  start "mission-control-3151" cmd /k "%SCRIPTS%tab-mission-control.cmd"
  start "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd"
  start "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd"
  start "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd"
  start "openclaw-tui" cmd /k "%SCRIPTS%tab-openclaw-tui.cmd"
)
