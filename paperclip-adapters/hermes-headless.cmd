@echo off
setlocal
set "NO_COLOR=1"
set "TERM=dumb"
set "FORCE_COLOR=0"
set "PYTHONIOENCODING=utf-8"
set "PYTHONUNBUFFERED=1"
"C:\Users\joshl\.local\hermes-venv\Scripts\hermes.exe" %*
