# CLAUDE's Antigravity — Paperclip Company Bootstrap

**Port:** 3101 (NOT 3100 — that's Sabretooth)
**Node:** 9020 (192.168.0.5)
**Owner:** Joshua Coleman (aiforyoullc@gmail.com)
**Repo:** AidoesitAll/income-engine

## Agents to Register
| Agent ID     | Model           | Provider   | Heartbeat |
|-------------|-----------------|------------|-----------|
| ceo-income  | claude-sonnet-4-6 | anthropic | 5 min     |
| fetcher     | qwen2.5:7b      | ollama     | 5 min     |

## Skills Path
`C:/income-engine/paperclip/skills/`

## Env Required
```
PAPERCLIP_URL=http://localhost:3101
PAPERCLIP_API_KEY=<generate-new-on-fresh-install>
PAPERCLIP_COMPANY_ID=<from-fresh-install>
```

## Setup Order
1. Install fresh Paperclip on port 3101
2. Create company "CLAUDE's Antigravity"
3. Register ceo-income and fetcher agents
4. Copy API key + company ID to .env
5. Run `pnpm dev` — OpenClaw will connect automatically

## The Wall
This Paperclip instance has ZERO knowledge of:
- Antigravity (Trollz1004)
- Sabretooth Paperclip (port 3100)
- YouAndINotAI
- Any other project

It only knows income-engine.
