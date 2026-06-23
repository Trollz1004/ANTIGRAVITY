# OpenClaw Integration Guide

## Paperclip Business OS Integration

OpenClaw seamlessly integrates with **Paperclip**, the open-source business OS for autonomous AI companies. This integration enables you to:

- **Coordinate Multiple Agents**: Manage OpenClaw alongside other agents (Claude Code, Codex, Cursor, etc.) in a unified org chart
- **Delegate Tasks**: Assign work from Paperclip directly to OpenClaw or vice versa
- **Track Budgets**: Monitor membership record usage and enforce spending limits per agent
- **Align Goals**: Ensure all agents work toward company-wide objectives
- **Monitor Performance**: Track agent status, task completion, and costs in real-time

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Paperclip Company                        │
│  (Org Chart, Goals, Budgets, Task Queue, Governance)        │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─ OpenClaw Agent (AI Workspace)
             ├─ Claude Code Agent (Coding)
             ├─ Marketing Agent (Content)
             └─ Support Agent (Customer Service)
```

### Setup Instructions

#### 1. Deploy Paperclip

```bash
# Clone Paperclip repository
git clone https://github.com/paperclipai/paperclip.git
cd paperclip

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start Paperclip
pnpm dev
```

#### 2. Create a Paperclip Company

1. Access Paperclip UI (default: http://localhost:3000)
2. Create a new company with:
   - **Mission**: e.g., "Build the #1 AI-powered business automation platform"
   - **Initial Budget**: e.g., $10,000/month
   - **Agents**: Start with OpenClaw as your first agent

#### 3. Register OpenClaw as Agent

In OpenClaw Settings → Paperclip:

1. Enter Paperclip API URL: `http://localhost:8000/api` (or your instance)
2. Enter Paperclip API Key: Get from Paperclip dashboard
3. Enter Company ID: Found in Paperclip company settings
4. Click "Connect to Paperclip"

#### 4. Configure Agent Details

Once connected, OpenClaw will appear in your Paperclip org chart with:
- **Role**: "AI Workspace & Chat Interface"
- **Capabilities**: Multi-provider chat, task execution, lead hunting
- **Budget**: Set monthly membership record budget (e.g., $500)
- **Heartbeat**: Automatic status updates every 5 minutes

### Features

#### Task Delegation

**From Paperclip to OpenClaw:**
1. Create task in Paperclip
2. Assign to OpenClaw agent
3. Task appears in OpenClaw as new chat session
4. OpenClaw executes task and reports results back to Paperclip

**From OpenClaw to Other Agents:**
1. Create task in OpenClaw chat
2. Delegate to specific Paperclip agent
3. Other agent receives task via heartbeat
4. Results sync back to OpenClaw

#### Budget Control

- **Monthly Budget**: Set spending limit per agent
- **membership record Tracking**: Real-time membership record usage monitoring
- **Alerts**: Notifications when budget reaches 80%, 95%, 100%
- **Auto-Pause**: Agents pause when budget exhausted

#### Goal Alignment

- **Company Mission**: All tasks trace back to company goals
- **Context Flow**: Agents receive goal context with each task
- **Progress Tracking**: Dashboard shows goal completion percentage
- **Reporting**: Weekly reports on goal progress and agent contributions

#### Org Chart

Visualize your autonomous team:
- **Hierarchies**: CEO, CTOs, Engineers, Marketers, Support
- **Reporting Lines**: Clear delegation chains
- **Roles**: Job descriptions and responsibilities
- **Status**: Real-time agent status and availability

### API Reference

#### Heartbeat Endpoint

OpenClaw sends heartbeats to Paperclip every 5 minutes:

```bash
POST /api/paperclip/heartbeat
{
  "agentId": "openclaw-001",
  "status": "active|idle|working",
  "currentTask": "task-123",
  "tasksCompleted": 42,
  "tokensUsed": 15000,
  "timestamp": "2026-05-07T19:00:00Z"
}
```

#### Task Webhook

Paperclip sends task updates to OpenClaw:

```bash
POST /api/paperclip/webhook/task-update
{
  "taskId": "task-123",
  "status": "pending|in_progress|completed|failed",
  "assignedTo": "openclaw-001",
  "result": "...",
  "metadata": {...}
}
```

#### Agent Status

Get agent status from Paperclip:

```bash
GET /api/paperclip/agents/openclaw-001
{
  "id": "openclaw-001",
  "name": "OpenClaw",
  "status": "active",
  "budget": 500,
  "spent": 245.67,
  "lastHeartbeat": "2026-05-07T19:05:00Z"
}
```

---

## Ollama Cloud Integration

OpenClaw integrates with **Ollama Cloud** for hosted, scalable model access without running local infrastructure.

### What is Ollama Cloud?

Ollama Cloud provides:
- **100+ Models**: Access to latest open-source and commercial models
- **Scalable Infrastructure**: Auto-scaling based on demand
- **No Local Setup**: No GPU required on your machine
- **Pay-as-You-Go**: Only pay for what you use
- **API-Compatible**: Drop-in replacement for local Ollama

### Setup Instructions

#### 1. Get Ollama Cloud API Key

1. Visit [ollama.com](https://ollama.com)
2. Sign up or log in
3. Go to API Keys section
4. Create new API key
5. Copy the key (format: `sk-...`)

#### 2. Configure in OpenClaw

In OpenClaw Settings → Ollama:

1. **Base URL**: `https://ollama.com/v1`
2. **API Key**: Paste your Ollama Cloud API key
3. Click "Save Configuration"

#### 3. Select Ollama Cloud Models

In Workspace:

1. Change Provider to "Ollama"
2. Models automatically load from Ollama Cloud
3. Select desired model from dropdown
4. Start chatting!

### Available Models

Ollama Cloud hosts models including:

- **Llama 2**: 7B, 13B, 70B variants
- **Mistral**: 7B, 8x7B MoE
- **Neural Chat**: 7B optimized for conversation
- **Orca**: 13B, 70B reasoning models
- **Zephyr**: 7B, 13B instruction-tuned
- **OpenHermes**: 2.5 7B, 13B, 34B
- **Dolphin**: 2.1 7B, 13B, 70B
- **Nous Hermes**: 2 7B, 13B, 70B
- **Starling**: 7B LM optimized
- **Falcon**: 7B, 40B, 180B
- **Baichuan**: 7B, 13B, 65B
- **Yi**: 6B, 34B, 200B
- **Qwen**: 7B, 14B, 72B
- **Deepseek**: 7B, 33B, 67B
- **Mixtral**: 8x7B, 8x22B

### Pricing

- **Pay-as-you-go**: $0.001 - $0.10 per 1K membership records (varies by model)
- **No minimum**: Start small, scale as needed
- **Transparent**: See costs in real-time dashboard

### API Reference

#### List Models

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://ollama.com/v1/models
```

#### Chat Completion

```bash
curl -X POST https://ollama.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

#### Streaming

```bash
curl -X POST https://ollama.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### Cost Optimization

1. **Use Smaller Models**: 7B models are 10x cheaper than 70B
2. **Batch Requests**: Group multiple requests together
3. **Cache Responses**: Reuse common responses
4. **Monitor Usage**: Check dashboard for cost trends
5. **Set Budgets**: Limit spending with API keys

---

## Multi-Provider Strategy

### When to Use Each Provider

| Provider | Best For | Cost | Speed | Privacy |
|----------|----------|------|-------|---------|
| **Ollama Local** | Development, privacy-critical | $0 | Fast | Maximum |
| **Ollama Cloud** | Production, scalability | Low | Medium | High |
| **OpenRouter** | Model variety, cost optimization | Medium | Medium | High |
| **OpenAI** | Advanced capabilities, reliability | High | Fast | Medium |
| **Manus** | Complex orchestration, automation | Variable | Slow | High |

### Recommended Setup

**Development:**
- Ollama Local for fast iteration
- OpenRouter for testing multiple models

**Production:**
- Ollama Cloud for general tasks
- OpenAI for critical operations
- Manus for complex workflows

**Enterprise:**
- All providers for redundancy
- Automatic failover between providers
- Cost optimization across all services

---

## Troubleshooting

### Paperclip Connection Issues

**Problem**: "Failed to connect to Paperclip"
- **Solution**: Verify API URL is accessible, check API key validity, ensure firewall allows connection

**Problem**: "Agent not appearing in org chart"
- **Solution**: Wait 5 minutes for heartbeat, check agent status in OpenClaw settings

**Problem**: "Tasks not syncing"
- **Solution**: Check webhook URL is correct, verify Paperclip can reach OpenClaw, review logs

### Ollama Cloud Issues

**Problem**: "Models not loading"
- **Solution**: Verify API key is valid, check internet connection, ensure endpoint is correct

**Problem**: "Slow responses"
- **Solution**: Try smaller model, check API rate limits, verify network connection

**Problem**: "High costs"
- **Solution**: Use smaller models, batch requests, set budget limits, monitor usage

---

## Advanced Configuration

### Custom Paperclip Agents

Create specialized agents for specific tasks:

```typescript
// Example: Create a coding agent
const codingAgent = {
  name: "Code Wizard",
  role: "Senior Engineer",
  capabilities: ["code_generation", "debugging", "testing"],
  budget: 1000,
  model: "claude-code",
};
```

### Multi-Model Fallback

Configure fallback chain for reliability:

```typescript
const modelChain = [
  { provider: "ollama", model: "llama2" },
  { provider: "openrouter", model: "mistral" },
  { provider: "openai", model: "gpt-4" },
];
```

### Cost Tracking Dashboard

Monitor spending across all providers:

```typescript
const costReport = {
  ollama: { spent: 0, budget: 0 },
  openrouter: { spent: 125.50, budget: 500 },
  openai: { spent: 234.75, budget: 1000 },
  manus: { spent: 50.00, budget: 100 },
};
```

---

## Next Steps

1. **Deploy Paperclip**: Set up your autonomous company
2. **Connect OpenClaw**: Register as first agent
3. **Add More Agents**: Bring in Claude Code, Cursor, etc.
4. **Set Company Goals**: Define mission and objectives
5. **Monitor Dashboard**: Track progress and costs
6. **Scale Gradually**: Add more agents and tasks over time

For more information:
- [Paperclip Documentation](https://paperclip.ing/docs)
- [Ollama Cloud Docs](https://ollama.com/docs)
- [OpenClaw GitHub](https://github.com/yourusername/openclaw)
