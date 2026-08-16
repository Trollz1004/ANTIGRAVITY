# ANTIGRAVITY Docker Stack

Full Docker Compose setup for ANTIGRAVITY: Hermes Agent + Workspace + existing services (Redis, Qdrant, OpenClaw, etc.).

## What's Included

### Core Services (Always Start)

- **hermes-agent** (port 8642) — Nous's Hermes Agent gateway with API server enabled
- **hermes-dashboard** (port 9119) — Dashboard for sessions, skills, config, MCP, jobs
- **hermes-workspace** (port 3000) — Web UI (built from `./hermes/Dockerfile`)
- **redis** (port 6379) — Cache and message queue
- **qdrant** (ports 6333, 6334) — Vector database
- **openclaw** (port 3200) — WhatsApp/messaging service
- **whatsapp-bridge** — Bridge service for OpenClaw
- **date-service** (port 8888) — Simple timestamp API

### Optional Services (Profiles)

- **cloudflare-tunnel** — Expose services via Cloudflare Tunnel (use `--profile cloudflare`)
- **wrangler-dev** (port 8787) — Cloudflare Workers dev server (use `--profile wrangler`)

---

## Quick Start

### 1. Configure Environment

Copy the template:

```bash
cp .env.docker .env.docker  # Already created; edit if needed
```

Add **at least one** LLM provider key to `.env.docker`:

```env
OPENAI_API_KEY=sk-...              # OR
OPENROUTER_API_KEY=sk-or-v1-...   # OR
GOOGLE_API_KEY=AIza...             # OR any provider
```

### 2. Start Services

**Core stack only** (Hermes, Redis, Qdrant, OpenClaw, Date):

```bash
docker-compose up -d
```

**Or use the batch script** (Windows):

```bash
START-DOCKER-STACK.bat
```

**With Cloudflare tunnel** (requires `CLOUDFLARE_TUNNEL_TOKEN` in `.env.docker`):

```bash
docker-compose --profile cloudflare up -d
```

**With Wrangler dev**:

```bash
docker-compose --profile wrangler up -d
```

**Everything** (core + cloudflare + wrangler):

```bash
docker-compose --profile cloudflare --profile wrangler up -d
```

### 3. Access the Workspace

Open **http://localhost:3000** in your browser.

**First time?** Complete the onboarding:

1. Wait for "Hermes Agent connected" status
2. Check Dashboard visibility
3. Chat with your configured LLM

Default password: `antigravity` (changeable in `.env.docker` via `HERMES_PASSWORD`)

---

## Verify Services Are Running

```bash
# Check all containers
docker ps

# Check specific service health
docker-compose ps

# View logs
docker-compose logs -f hermes-workspace    # Workspace
docker-compose logs -f hermes-agent        # Agent gateway
docker-compose logs -f hermes-dashboard    # Dashboard

# Verify API endpoints
curl http://127.0.0.1:8642/health          # Agent gateway
curl http://127.0.0.1:9119/api/status      # Dashboard
curl http://127.0.0.1:8888/                # Date service
```

---

## Port Map

| Service              | Port      | Access                | Purpose                                |
| -------------------- | --------- | --------------------- | -------------------------------------- |
| Hermes Workspace     | 3000      | http://localhost:3000 | Web UI                                 |
| Hermes Agent Gateway | 8642      | localhost only        | Core APIs (chat, models, jobs)         |
| Hermes Dashboard     | 9119      | localhost only        | Sessions, skills, config, MCP          |
| Redis                | 6379      | localhost only        | Cache                                  |
| Qdrant               | 6333/6334 | localhost only        | Vector DB                              |
| OpenClaw             | 3200      | localhost only        | WhatsApp bridge                        |
| Date Service         | 8888      | localhost only        | Timestamp API                          |
| Wrangler Dev         | 8787      | localhost only        | Cloudflare Workers (profile: wrangler) |

**Note:** Most services bind to `127.0.0.1` for security. To access from other devices:

1. Modify port mappings (remove `127.0.0.1:`)
2. Set `HERMES_PASSWORD` in `.env.docker`
3. Set `COOKIE_SECURE=0` for HTTP-only deployments

---

## Troubleshooting

### Workspace shows "Offline" or "Disconnected"

**Check Hermes Agent:**

```bash
curl http://127.0.0.1:8642/health
# Should return: {"status":"ok"}
```

**Check Dashboard:**

```bash
curl http://127.0.0.1:9119/api/status
# Should return: {"status":"ok", ...}
```

**Restart both:**

```bash
docker-compose restart hermes-agent hermes-dashboard
docker-compose logs -f hermes-workspace
```

### No LLM provider configured

**Error:** Chat returns empty or "No model available"

**Fix:** Edit `.env.docker` and add an API key for at least one provider:

```env
OPENAI_API_KEY=sk-your-key-here
```

Then restart the agent:

```bash
docker-compose restart hermes-agent
```

### Permission denied on volumes

On Linux, if you get permission errors:

```bash
sudo chown -R $USER:$USER hermes-data
```

Or run docker-compose with `sudo`.

### Out of memory

If containers are exiting with 137 or OOM errors:

```bash
docker stats    # Check memory usage
```

Increase Docker Desktop memory (Settings → Resources → Memory).

### Cloudflare tunnel won't start

**Error:** `CLOUDFLARE_TUNNEL_TOKEN is not set`

**Fix:** Get your token from [Cloudflare Tunnel dashboard](https://dash.cloudflare.com/), then:

```bash
echo "CLOUDFLARE_TUNNEL_TOKEN=your-token-here" >> .env.docker
docker-compose --profile cloudflare restart cloudflare-tunnel
```

---

## Environment Variables Reference

All `.env.docker` keys:

| Key                       | Default       | Purpose                             |
| ------------------------- | ------------- | ----------------------------------- |
| `OPENAI_API_KEY`          | (none)        | OpenAI API key for GPT models       |
| `OPENROUTER_API_KEY`      | (none)        | OpenRouter API key (multi-provider) |
| `GOOGLE_API_KEY`          | (none)        | Google Gemini API key               |
| `ANTHROPIC_API_KEY`       | (none)        | Anthropic Claude API key            |
| `HERMES_PASSWORD`         | `antigravity` | Web UI password                     |
| `CLOUDFLARE_TUNNEL_TOKEN` | (none)        | Cloudflare Tunnel auth token        |

Only `OPENAI_API_KEY` (or one other provider key) is strictly required. Others are optional.

---

## Hermes Agent Configuration

Hermes Agent reads from Docker volumes mounted to `/root/.hermes`. To configure models, skills, MCP, or API authentication:

**Inside Hermes Workspace:**
Settings → Connection → (manage)

**Or via shell:**

```bash
docker-compose exec hermes-agent hermes setup
docker-compose exec hermes-agent hermes model select
```

**Or edit config directly:**

```bash
docker-compose exec -it hermes-agent sh
vi ~/.hermes/config.yaml
exit
docker-compose restart hermes-agent
```

---

## Stopping Services

```bash
# Stop all containers (keep volumes)
docker-compose down

# Stop and remove volumes (WARNING: loses persisted data)
docker-compose down -v

# Stop just one service
docker-compose stop hermes-workspace
docker-compose stop redis

# Restart all
docker-compose restart
```

---

## Logs & Debugging

```bash
# Tail all logs
docker-compose logs -f

# Follow a specific service
docker-compose logs -f hermes-workspace
docker-compose logs -f hermes-agent
docker-compose logs -f openclaw

# View last 100 lines of workspace logs
docker-compose logs --tail=100 hermes-workspace

# See startup errors
docker-compose logs hermes-agent 2>&1 | grep -i error
```

---

## Next Steps

1. **Configure your model:** In Hermes Workspace, go to Settings and select a model/provider
2. **Enable MCP (optional):** Add MCP servers in Settings → MCP
3. **Set up Cloudflare tunnel:** If you want remote access, add your tunnel token to `.env.docker` and restart with `--profile cloudflare`
4. **Configure OpenClaw:** Ensure `.env.docker` includes WhatsApp bridge credentials if needed
5. **Explore Swarm mode:** Use Conductor in Hermes Workspace for multi-agent orchestration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             ANTIGRAVITY Docker Compose Stack                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌───────────────────┐           │
│  │  Workspace UI   │◄────────┤  Hermes Gateway   │           │
│  │   :3000         │         │      :8642        │           │
│  └─────────────────┘         ├───────────────────┤           │
│          ▲                    │  Hermes Dashboard │           │
│          │                    │      :9119        │           │
│          └────────────────────┤  (Sessions/Skills)│           │
│                               └───────────────────┘           │
│                                     │                         │
│                  ┌──────────────────┼──────────────────┐      │
│                  │                  │                  │      │
│          ┌──────▼────┐      ┌──────▼────┐      ┌──────▼────┐ │
│          │   Redis   │      │  Qdrant   │      │ OpenClaw  │ │
│          │  :6379    │      │ :6333/34  │      │  :3200    │ │
│          └───────────┘      └───────────┘      └───────────┘ │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Date Service │  │  Cloudflare  │  │  Wrangler    │        │
│  │    :8888     │  │   Tunnel     │  │   :8787      │        │
│  │ (always)     │  │ (--profile)  │  │ (--profile)  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Commands

```bash
# Full restart
docker-compose down && docker-compose up -d

# View resource usage
docker stats

# Check container details
docker-compose ps
docker inspect hermes-workspace
docker inspect hermes-agent

# Execute command in running container
docker-compose exec hermes-workspace curl http://localhost:3000/

# Pull latest images
docker-compose pull
docker-compose up -d

# Rebuild local images
docker-compose build --no-cache
docker-compose up -d

# Clean up unused volumes/networks
docker system prune
```

---

## Support

For Hermes Agent issues: [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
For Hermes Workspace issues: [github.com/outsourc-e/hermes-workspace](https://github.com/outsourc-e/hermes-workspace)
