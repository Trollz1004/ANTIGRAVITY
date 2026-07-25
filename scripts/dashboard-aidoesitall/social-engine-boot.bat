@echo off
:: Safe node automation bootstrap
:: Generates draft packs instead of live posting to third-party platforms
cd /d E:\ANTIGRAVITY
call .venv\Scripts\activate.bat
set PYTHONIOENCODING=utf-8
where uv >nul 2>nul
if %errorlevel%==0 (
  uv run python scripts\generate-safe-marketing-drafts.py --profile 9020-content >> logs\safe-node-automation.log 2>&1
) else (
  python scripts\generate-safe-marketing-drafts.py --profile 9020-content >> logs\safe-node-automation.log 2>&1
)
