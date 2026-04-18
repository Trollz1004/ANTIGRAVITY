# OpenCode Memory File

## System Configuration

- Primary Model: opencode/glm-5.1
- Cloud Models:
  - ollama/qwen3-coder:480b-cloud
  - ollama/joshlcoleman/dateapp
- Fallback Chain: Automatic switching when API caps are hit

## Available Skills

- agent-browser (installed globally)
- find-skills (installed globally)

## Launchers

- Windows: C:\ANTIGRAVITY\paperclip-adapters\opencode-unified.cmd
- WSL: C:\ANTIGRAVITY\scripts\opencode-unified-launcher-wsl.sh
- Desktop Shortcut: Paperclip-CEO-OpenCode-Unified.bat

## Environment

- Environment file: C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
- Loads all necessary API keys for cloud models

## Recent Changes

- Added unified launcher with automatic fallback between cloud models
- Updated WSL bootstrap script to use unified launcher
- Created desktop shortcuts for easy access
- All changes committed to main branch

## Purpose

This memory file tracks the OpenCode configuration and setup for the Paperclip CEO agent, ensuring continuity and documenting the fallback mechanism for API usage caps.
