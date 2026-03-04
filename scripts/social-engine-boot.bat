@echo off
:: Social Engine 24x7 — Boot script for Windows Task Scheduler
:: Runs the daemon in the ANTIGRAVITY venv
cd /d C:\ANTIGRAVITY
call .venv\Scripts\activate.bat
set PYTHONIOENCODING=utf-8
python scripts\social-engine-24x7.py --daemon >> logs\social-engine-daemon.log 2>&1
