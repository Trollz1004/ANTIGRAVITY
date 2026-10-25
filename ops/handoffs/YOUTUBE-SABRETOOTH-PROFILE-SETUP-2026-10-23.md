# Sabretooth YouTube Hermes Profile Configuration

## Node Details
- **Host**: joshl (Sabretooth)
- **IP**: 192.168.0.8
- **GPU**: 16GB (moved from Alienware)
- **Status**: ACTIVE 

## Profile Location
`~/.hermes/profiles/youtube-sabretooth/`

## MCP Servers Required
- `brain-mcp`
- `mission-mcp`  
- `antigravity-files`
- `playwright`
- `agy-gemini` (via agy cmd)

## Primary Gateway
**AGY/cmd Gemini** (NOT OmniRoute)
- Command: `C:\ANTIGRAVITY\ops\paperclip\agy-gemini.cmd`
- Model: `gemini-4-argon-high`
- Auth: OAuth login (Joshua's Google account)

## Fallback Gateways
1. OmniRoute: `http://192.168.0.8:20128/v1` (only if AGY unavailable)
2. Ollama Local: `http://127.0.0.1:11434/v1` with Fable model

## Skills to Load
- `i-have-adhd`
- `hermes-youtube-faceless-news`
- `hermes-youtube-avatar-head`
- `brainstorming`
- `verification-before-completion`
- `systematic-debugging`

## Focus Lane
- Source: `content/yesterday-news/`
- Output: `ops/marketing-inbox/` + `ops/packets/hermes-youtube-<date>/`

## Port Configuration
- Hermes Gateway: `:9119`
- Mission Control: `:3130`
- Paperclip HQ: `:3100`
- Ollama: `:11434`
- Cloudflared Tunnel: `sabretooth-main`

## Next Steps
1. [ ] Install AGY/cmd and OAuth login
2. [ ] Create profile directory
3. [ ] Configure profile YAML
4. [ ] Test MCP connections
5. [ ] Verify YouTube tools work