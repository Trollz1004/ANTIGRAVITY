@echo off
rem ── Mission Control v6 — stack health monitor (:8787) ─────────────────────
rem
rem THIS IS NOT THE AGENT SWARM. v6 is a Python/FastAPI monitor - checks.py,
rem monitor.py, remediation.py. It watches ports and pages you when something
rem that should be up goes down. It has no agents, no executors, no graph.
rem The agent swarm is v5, on :3151 (tab-mission-control.cmd).
rem
rem PORT 8787 IS v6'S OWN DEFAULT - its launcher and config both say so
rem ("Mission Control :8787"). It was running on :3151 only because MC_PORT was
rem overridden by hand, which took the port v5 needs and broke Hermes's MCP
rem endpoint at 127.0.0.1:3151/api/mcp (v6 answered 404 to everything).
rem Restored 2026-08-09: v5 on 3151, v6 on 8787.
rem
rem A red on this board means "go verify", not "broken" - it has already shown
rem false reds from checks aimed at dead ports.
title mission-control-v6 (:8787)
cd /d F:\ANTIGRAVITY\mission-control-v6

rem Scope MC_PORT to this window only, so nothing else on the machine inherits
rem it. A leaked PORT variable is what caused the 2026-07-31 crash-loop.
set "MC_PORT=8787"
call START-MISSION-CONTROL.cmd
