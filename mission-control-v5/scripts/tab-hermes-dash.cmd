@echo off
title hermes-dashboard (:9119)
cd /d E:\ANTIGRAVITY
set "HOME=C:\Users\joshl"
echo [hermes-dash] Hermes web GUI on http://127.0.0.1:9119 ? Ctrl+C to stop.
"C:\Users\joshl\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe" dashboard --host 127.0.0.1 --port 9119 --no-open --skip-build
