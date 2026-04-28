@echo off
setlocal
title Hermes Router - localhost:11435
wsl.exe -d Ubuntu bash -lc "chmod +x /mnt/c/Antigravity/scripts/start-hermes-router.sh && /mnt/c/Antigravity/scripts/start-hermes-router.sh"
