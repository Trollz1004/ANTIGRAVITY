@echo off
title fcc-claude (Claude Code via FCC proxy :8082)
cd /d E:\ANTIGRAVITY
echo [fcc-claude] waiting for fcc-server on :8082...
:wait
curl -s -o nul --max-time 2 http://127.0.0.1:8082/ && goto up
timeout /t 3 /nobreak >nul
goto wait
:up
"C:\Users\joshl\.local\bin\fcc-claude.exe"
