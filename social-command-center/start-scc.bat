@echo off
REM ═══════════════════════════════════════════════════════
REM  Social Command Center MCP — Windows Startup Script
REM  
REM  Add to Task Scheduler or shell:startup folder:
REM    Win+R → shell:startup → paste shortcut to this .bat
REM
REM  Or create a Scheduled Task:
REM    Trigger: At log on
REM    Action: Start a program → this .bat file
REM    Start in: C:\ANTIGRAVITY\social-command-center
REM ═══════════════════════════════════════════════════════

cd /d C:\ANTIGRAVITY\social-command-center
node dist/index.js
