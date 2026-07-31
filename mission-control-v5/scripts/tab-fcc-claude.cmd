@echo off
title fcc-claude (Claude Code via OmniRoute)
echo [fcc-claude] waiting 10s for fcc-serve to come up...
timeout /t 10 /nobreak >nul
call fcc-claude
