# Hermes Agent - Auto Start Setup

## Installation (Run in WSL)

```bash
# 1. Install Hermes Agent
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 2. Reload shell
source ~/.bashrc

# 3. Setup API keys and configuration
hermes setup

# 4. Configure default model (e.g., openrouter:anthropic/claude-sonnet-4)
hermes model
```

## Auto-Start on Boot (WSL systemd)

Create `/etc/systemd/system/hermes-agent.service`:

```ini
[Unit]
Description=Hermes Agent - Nous Research AI Agent
After=network.target

[Service]
Type=simple
User=joshl
WorkingDirectory=/home/joshl
ExecStart=/home/joshl/.local/bin/hermes
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable:
```bash
sudo systemctl enable hermes-agent
sudo systemctl start hermes-agent
```

## Auto-Start via Windows Task Scheduler (Alternative)

Create a PowerShell script `C:\Antigravity\start-hermes.ps1`:

```powershell
# Start WSL and run Hermes in background
wsl -d Ubuntu -- hermes &
```

Schedule with Task Scheduler to run on login and on power event.

## Model Selection for Hermes

Hermes supports 8 inference providers:

### Ollama Cloud (Free/Trial)
```bash
hermes model set openrouter:kimi/k2.6
hermes model set openrouter:anthropic/claude-sonnet-4
```

### Self-Hosted Ollama
```bash
# Connect to local Ollama
hermes model set ollama:llama3
hermes model set ollama:mistral
hermes model set ollama:codellama
```

### Google Gemini (API)
```bash
hermes model set gemini:gemini-1.5-flash
hermes model set gemini:gemini-1.5-pro
```

### OpenRouter (200+ models)
```bash
hermes model set openrouter:openai/gpt-4o
hermes model set openrouter:anthropic/claude-sonnet-4
hermes model set openrouter:mistralai/mistral-7b-instruct
```

## Port Configuration

Hermes Gateway ports (for Telegram, Discord, etc.):
- CLI: `hermes` (local terminal)
- Gateway default: `http://localhost:3000`

Ollama: `http://localhost:11434`

Paperclip: `http://localhost:3100`

## 24/7 Uptime Tips

1. **Use tmux/screen** for session persistence:
   ```bash
   tmux new -s hermes
   hermes
   # Ctrl+B, D to detach
   ```

2. **Use Modal/Daytona** for serverless (costs near-zero when idle)

3. **Monitor with healthchecks** service