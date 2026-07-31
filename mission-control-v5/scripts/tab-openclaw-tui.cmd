@echo off
title openclaw-tui
cd /d E:\ANTIGRAVITY
echo [openclaw-tui] TUI via the ClawX-bundled CLI (gateway :18789 is ClawX's job).
if exist "C:\Program Files\ClawX\resources\cli\openclaw.cmd" (
  call "C:\Program Files\ClawX\resources\cli\openclaw.cmd" tui
) else (
  echo ClawX CLI not found ? falling back to global openclaw.
  call openclaw tui
)
