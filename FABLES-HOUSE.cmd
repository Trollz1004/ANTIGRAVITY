@echo off
rem ═══════════════════════════════════════════════════════════════════════
rem  FABLE'S HOUSE — one command brings up and guards the entire Sabretooth
rem  stack: Postgres → Redis → OmniRoute → Frontend → API → Tunnel → Board.
rem  Validation-gated, self-healing, and this window NEVER closes on error —
rem  cmd /k guarantees you always see what happened.
rem ═══════════════════════════════════════════════════════════════════════
title FABLE'S HOUSE
cmd /k powershell -NoProfile -ExecutionPolicy Bypass -File "C:\ANTIGRAVITY\scripts\fables-house\FABLES-HOUSE.ps1"
