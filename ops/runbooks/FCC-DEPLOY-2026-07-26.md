# FCC Deploy — 2026-07-26

Target: T5500 / Laptop repo clone `E:\ANTIGRAVITY`

One-time prep

- `cd E:\ANTIGRAVITY`
- `git pull origin main`
- `npm install -g pi` # if Pi global not installed; otherwise repo uses `bin\pi`
- `npm install -g opencode` # optional, for OpenCode path

Verify installed

- `pi --version` → expect `0.71.1`
- `pi --help | findstr "provider"` → expect provider flag
- `bin\pi.cmd --version` → repo-local wrapper
- `bin\fcc-claude.cmd --help` → OpenRouter free wrapper

Deploy commands

- Hermes free-code task:
  `E:\ANTIGRAVITY\bin\pi.cmd --provider openrouter --model openai/gpt-oss-120b:free -p "<task>"`
- FCC Claude-style on NVIDIA free tier:
  `E:\ANTIGRAVITY\bin\fcc-claude.cmd sonnet "Refactor auth middleware"`
- Hermes fallback default:
  `E:\ANTIGRAVITY\bin\pi.cmd -p "<task>"`

For Paperclip/Hermes verification, wire the wrapper path into `bin\` instead of using network PowerShell semantics.
