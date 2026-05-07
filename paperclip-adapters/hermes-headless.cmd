@echo off
setlocal
set "NO_COLOR=1"
set "TERM=dumb"
set "FORCE_COLOR=0"
set "PYTHONIOENCODING=utf-8"
set "PYTHONUNBUFFERED=1"
set "ANTIGRAVITY_ROOT=C:\ANTIGRAVITY"
cd /d "%ANTIGRAVITY_ROOT%"
call "C:\Users\joshl\AppData\Local\hermes\hermes.cmd" %*
