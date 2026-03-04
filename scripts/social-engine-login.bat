@echo off
:: Social Engine — One-time login setup
:: Opens the daemon browser for Josh to log in to all platforms
:: Sessions persist permanently — only need to do this once
cd /d C:\ANTIGRAVITY
call .venv\Scripts\activate.bat
set PYTHONIOENCODING=utf-8
python scripts\social-engine-24x7.py --login-all
