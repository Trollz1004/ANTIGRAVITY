@echo off
title OPUS CLI — Claude Code
cls
echo.
echo  ========================================
echo   OPUS AI — CLAUDE CODE CLI
echo   Node: 9020 (DESKTOP-UPSJEVG)
echo   Mode: BYPASS PERMISSIONS
echo  ========================================
echo.
echo  MEMORY SYSTEM:
echo   - MCP opus-memory: C:\OPUS\mcp-server (port 3100 + Cloudflare tunnel)
echo   - MCP filesystem: C:\OPUS, C:\CUPID-DATING-APP, C:\Users\joshl
echo   - Persistent memory: C:\OPUS\memory\
echo   - Config: C:\OPUS\config\
echo   - Secrets: C:\OPUS\.vault\ADMIN-KEY-9020.env
echo.
echo  MEMORY FILES (auto-loaded via CLAUDE.md):
echo   - OPUS-STATUS.md    = universal status (no secrets)
echo   - activeContext.md   = current session state
echo   - projectState.md    = what's deployed where
echo   - decisions.md       = architecture decisions log
echo   - credentials-map.md = which keys live where
echo.
echo  LIVE DEPLOYMENTS:
echo   - youandinotai.com (thunderous-sawine-9753d5.netlify.app)
echo   - revenue-core-9020.netlify.app
echo.
echo  MISSION: $19,990 pre-orders by April 4, 2026
echo  USP: $1 Bot-Shield. $14.99/mo Founding Member.
echo  ========================================
echo.
cd /d C:\OPUS
"C:\Program Files\PowerShell\7\pwsh.exe" -NoExit -Command "claude --dangerously-skip-permissions"
