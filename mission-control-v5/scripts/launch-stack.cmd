@echo off
cd /d F:\ANTIGRAVITY
rem ANTIGRAVITY stack launcher
rem
rem Opens ONE Windows Terminal window with every stack service as a VISIBLE,
rem controllable tab. No hidden watchdogs, no browser spam - you see and own
rem every process. Close a tab to stop that service.
rem
rem Tabs, in dependency order:
rem   1. omniroute       - gateway :20128, dashboard http://localhost:20128/home
rem                        Everything else routes through it, so it starts first.
rem   2. dateapp-3200    - youandinotai.com production build. Second because it
rem                        is the only public product. The TUNNEL is not here:
rem                        the Windows service "Cloudflared" (Auto) owns it and
rem                        starts before logon. Two connectors split traffic.
rem   3. mission-control - v5 AGENT SWARM on :3151 - Graphy, executors, kanban,
rem                        and the MCP server Hermes talks to at /api/mcp.
rem                        LOCAL ONLY, this server has no auth.
rem   4. stack-health    - the HEALTH MONITOR on :8787 (dir: mission-control-v6).
rem                        NOT a Mission Control - renamed Stack Health so the two
rem                        stop sounding like versions of the same program.
rem   5. fcc-server      - Free Claude Code proxy :8082, admin UI at /admin
rem   6. fcc-claude      - Claude Code CLI through that proxy (waits for :8082)
rem   7. hermes-dash     - Hermes web GUI :9119
rem
rem OPENCLAW HAS NO TAB, DELIBERATELY. ClawX auto-starts both the gateway
rem (:18789) and its own TUI at logon, and it reads the OpenClaw config either
rem way. A tab here launched a SECOND TUI - measured 2026-08-04 at 8:47:24
rem (this launcher) against 8:47:36 (ClawX) - and the two contending for the one
rem gateway is what ClawX reports as "gateway error | port: 18789". Probing for
rem an existing TUI does NOT help: this launcher wins the race by ~12s, finds
rem nothing, and starts one anyway. Not opening it is the only fix.
rem Run scripts\tab-openclaw-tui.cmd by hand if you ever want a second client.
rem
rem Runs at logon via the Startup entry ANTIGRAVITY-Stack-Terminal.cmd.
rem Delete that file to stop auto-launching.

set "SCRIPTS=%~dp0"

rem OmniRoute goes first - every other lane routes through it. DateApp is next
rem because it is the only public-facing product; if the machine reboots and
rem nothing else comes back, youandinotai.com still should.
wt -w antigravity ^
  new-tab --title "ollama" cmd /k "%SCRIPTS%tab-ollama.cmd" ; ^
  new-tab --title "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd" ; ^
  new-tab --title "dateapp-3200" cmd /k "%SCRIPTS%tab-dateapp.cmd" ; ^
  new-tab --title "mission-control-3151" cmd /k "%SCRIPTS%tab-mission-control.cmd" ; ^
  new-tab --title "stack-health-8787" cmd /k "%SCRIPTS%tab-mission-control-v6.cmd" ; ^
  new-tab --title "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd" ; ^
  new-tab --title "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd" ; ^
  new-tab --title "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd"

if errorlevel 1 (
  rem Windows Terminal missing/failed - fall back to plain windows.
  start "ollama" cmd /k "%SCRIPTS%tab-ollama.cmd"
  start "omniroute" cmd /k "%SCRIPTS%tab-omniroute.cmd"
  start "dateapp-3200" cmd /k "%SCRIPTS%tab-dateapp.cmd"
  start "mission-control-3151" cmd /k "%SCRIPTS%tab-mission-control.cmd"
  start "stack-health-8787" cmd /k "%SCRIPTS%tab-mission-control-v6.cmd"
  start "fcc-server" cmd /k "%SCRIPTS%tab-fcc-serve.cmd"
  start "fcc-claude" cmd /k "%SCRIPTS%tab-fcc-claude.cmd"
  start "hermes-dash-9119" cmd /k "%SCRIPTS%tab-hermes-dash.cmd"
)
