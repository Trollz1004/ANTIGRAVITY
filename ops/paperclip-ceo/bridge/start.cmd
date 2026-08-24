@echo off
REM Freebuff CEO bridge launcher.
REM start.js loads ops\paperclip-ceo\bridge\.env (gitignored, NOT committed).
REM Required vars: PAPERCLIP_CEO_BRIDGE_TOKEN, PAPERCLIP_CEO_AGENT_KEY
setlocal
node "%~dp0start.js"
