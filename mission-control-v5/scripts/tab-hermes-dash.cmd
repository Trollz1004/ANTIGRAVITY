@echo off
if /I not "%MISSION_CONTROL_RUNTIME_GATE%"=="LANDED_BY_JUDGE" (
  echo Mission Control runtime is BLOCKED pending the S1 judge-lane gate.
  exit /b 0
)
if "%HERMES_EXECUTABLE%"=="" (
  echo HERMES_EXECUTABLE is not configured.
  exit /b 1
)
title hermes-dashboard (:9119)
cd /d C:\ANTIGRAVITY
echo [hermes-dash] Hermes web GUI on http://127.0.0.1:9119 ? Ctrl+C to stop.
"%HERMES_EXECUTABLE%" dashboard --host 127.0.0.1 --port 9119 --no-open --skip-build
