---
name: hermes-reference
description: External systems and where to find things
type: reference
---

## OPUS Core Systems

| System | Location | Purpose |
|---|---|---|
| OPUS brain | T5500 (192.168.0.15) | THE BRAIN — orchestrator |
| Kraken (I:) | Portable USB | HERMES brain, portable |
| Node 9020 | 192.168.0.5 | Marketing/production, MCP Chrome |
| Sabretooth | 192.168.0.8 | Master orchestrator, vault |

## Social Accounts

| Platform | URL / Handle |
|---|---|
| Twitter/X | @YouAndiNotAi |
| Instagram | youandinotai |
| Facebook | AiCollab4Kids |
| LinkedIn | YouAndINotAI |
| TikTok | @youandinotai |
| Pinterest | YouAndINotAI |
| Snapchat | YouAndiNotAi |
| WhatsApp | 1-352-973-5909 |
| Messenger Community | https://www.messenger.com/c/932140066402724/ |
| Reddit | u/GamersVsCancer (karma: low) |

## Key URLs

| Service | URL |
|---|---|
| YouAndINotAI.com | https://youandinotai.com |
| OnlineRecycle.org | https://onlinerecycle.org |
| Kids OnlineRecycle | https://kids.onlinerecycle.org |
| API | https://api.youandinotai.com |
| Meta Business Suite | business.facebook.com (asset_id=669024872951039) |

## OPUS Memory Files

| File | Path |
|---|---|
| OPUS AGENT-CONTEXT | I:/OPUS/memory/AGENT-CONTEXT.md |
| OPUS MARKETING-RULES | I:/OPUS/memory/MARKETING-RULES.md |
| OPUS PLATFORM-ACCOUNTS | I:/OPUS/memory/PLATFORM-ACCOUNTS.md |
| OPUS COMPETITOR-INTEL | I:/OPUS/memory/COMPETITOR-INTEL.md |
| OPUS CAMPAIGN LOG | I:/OPUS/logs/CAMPAIGN-LOG.md |
| HERMES HERMES.md | I:/HERMES/HERMES.md |
| HERMES MEMORY | I:/HERMES/memory/ |
| HERMES TASK QUEUE | I:/HERMES/tasks/queue.json |
| HERMES INBOX | I:/HERMES/inbox/messages.json |

## Hermes CLI (hermes-agent v0.7.0)

Pre-installed on this node at: `C:\Users\joshl\AppData\Local\hermes\hermes-agent`
Executable: `hermes` (in PATH via npm shim)

**Auth**: OpenAI Codex (via Google OAuth) — already configured, tokens stored at `C:\Users\joshl\AppData\Local\hermes\auth.json`

**Running**: ACP server active (stdio JSON-RPC transport, MCP protocol)
Sessions stored at: `C:\Users\joshl\AppData\Local\hermes\sessions\`

**Useful commands**:
```
hermes chat -q "prompt" --provider openai-codex     # one-shot query
hermes sessions list                                 # list sessions  
hermes acp                                          # run as ACP/MCP server
hermes model                                        # switch model/provider
hermes doctor                                       # check config
```

**Models available through Codex provider**: gpt-5.3-codex, gpt-5.2-codex, gpt-5.1-codex-mini, gpt-5.1-codex-max

**ACP server**: Running as background daemon, connected to Hermes session `20260416_063417_64b3f6`

## Manus AI

- Status: producing content + video
- Output location: `C:/Users/joshl/Downloads/` or Google Sheets
- Check downloads weekly for new Manus content
- Meta compliance doc: `C:/Users/joshl/Downloads/MetaPlatforms-temp/Meta-Compliant Tag and Creative Recommendations for YouAndiNotAi.md`
