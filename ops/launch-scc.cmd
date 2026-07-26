@echo off
REM Launch the ANTIGRAVITY Social Command Center (SCC) locally.
REM Run this on a machine where git + node work (T5500 desktop or 9020).
REM After it starts, open http://localhost:3000 in your REAL browser,
REM sign in to each platform as compose tabs open, and publish the landing link.
setlocal
set SCC_DIR=%USERPROFILE%\scc_local
if not exist "%SCC_DIR%" (
  git clone --depth 1 https://github.com/Trollz1004/command-center.git "%SCC_DIR%"
)
cd /d "%SCC_DIR%"
call npm install
call npm run dev
REM SCC serves at http://localhost:3000
REM Default post target: https://trollz1004.github.io/youandinotai-links/ (ref=clean-repo)
endlocal
