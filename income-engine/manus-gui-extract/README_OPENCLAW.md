# OpenClaw - AI Workspace with Paperclip & Ollama Cloud Integration

A professional dark-themed AI workspace featuring multi-provider chat, Paperclip business OS integration, Ollama Cloud support, and intelligent lead hunting automation.

## 🚀 Features

### Core Chat Interface
- **Multi-Provider Support**: Seamlessly switch between Ollama (local), Ollama Cloud, OpenRouter, and OpenAI-compatible endpoints
- **Persistent Sessions**: Create, rename, delete, and organize chat conversations
- **Provider Badges**: Each message displays which provider and model generated it
- **Streaming Responses**: Real-time markdown rendering with full formatting support
- **Dark Cyberpunk Aesthetic**: Professional UI with neon green accents (#00ff88)

### Paperclip Business OS Integration
- **Agent Coordination**: Register OpenClaw as an agent in your Paperclip company
- **Task Delegation**: Send and receive tasks between OpenClaw and other agents
- **Budget Tracking**: Monitor token usage and enforce spending limits
- **Org Chart**: Visualize your autonomous team structure
- **Company Goals**: Align all agents toward shared objectives
- **Heartbeat Monitoring**: Real-time agent status and performance tracking

### Ollama Cloud
- **100+ Models**: Access hosted models without local GPU
- **Pay-as-You-Go**: Transparent pricing ($0.001-$0.10 per 1K tokens)
- **Auto-Scaling**: Infrastructure scales with demand
- **Model Variety**: Llama, Mistral, Orca, Zephyr, and more

### FETCHER Agent Module
- **Automated Lead Hunting**: Scans Reddit, Upwork, and Fiverr for freelance opportunities
- **Smart Qualification**: Filters leads by budget (≥$50) and recency (≤4 hours)
- **Owner Notifications**: Alerts when 3+ qualified leads found with top pick details
- **Comprehensive Logging**: All leads stored in database for analysis
- **Multi-Source Tracking**: Unified dashboard for all lead sources

### Image Generation
- **Inline Image Creation**: Generate images directly within chat conversations
- **Style Control**: Realistic, artistic, abstract, or cyberpunk styles
- **Image Editing**: Modify existing images with new prompts
- **Batch Generation**: Create multiple image variations for comparison

### Manus API Integration
- **Task Creation**: Programmatically create Manus tasks from OpenClaw
- **Status Monitoring**: Track task lifecycle in real-time
- **Message Sending**: Send messages to agents for orchestration
- **Result Tracking**: View task results and metadata

## 🛠️ Setup & Configuration

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.15.1+
- MySQL/TiDB database
- API keys for desired providers (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openclaw.git
cd openclaw

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/openclaw

# Authentication
JWT_SECRET=your_jwt_secret_here
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# Manus APIs
BUILT_IN_FORGE_API_KEY=your_forge_api_key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge

# Optional: Provider Keys (configure in UI)
# OLLAMA_API_KEY=sk-...
# OPENROUTER_API_KEY=sk-...
# PAPERCLIP_API_KEY=pk-...
```

## 📖 Usage Guide

### Starting a Chat

1. Click "New Chat" in the sidebar
2. Select a provider (Ollama, OpenRouter, OpenAI, Manus)
3. Choose a model from the dropdown
4. Type your message and press Enter

### Connecting to Paperclip

1. Go to Settings → Paperclip Integration
2. Enter your Paperclip instance URL
3. Provide API key and Company ID
4. Click "Connect to Paperclip"
5. View agents and tasks in real-time

### Using Ollama Cloud

1. Get API key from [ollama.com](https://ollama.com)
2. Go to Settings → Ollama
3. Enter API key and endpoint (https://ollama.com/v1)
4. Models automatically load
5. Select desired model and start chatting

### Running FETCHER Scan

1. Go to Settings → FETCHER
2. (Optional) Add Upwork/Fiverr API keys
3. Click "Scan for Leads"
4. View results in Lead Dashboard
5. Receive notifications when 3+ leads qualify

### Generating Images

In chat, type:
```
Generate image of a cyberpunk city at night
Generate image of a mountain landscape, artistic style
Create a realistic portrait of a woman
```

Images appear inline in the conversation with metadata.

## 🏗️ Architecture

### Frontend (React 19 + Tailwind 4)
- `client/src/pages/Workspace.tsx` - Main chat interface
- `client/src/pages/Settings.tsx` - Configuration panel
- `client/src/pages/PaperclipIntegration.tsx` - Paperclip UI
- `client/src/index.css` - Dark cyberpunk theme

### Backend (Express + tRPC)
- `server/routers.ts` - All tRPC procedures
- `server/modelProvider.ts` - Multi-provider chat logic
- `server/paperclipIntegration.ts` - Paperclip API client
- `server/ollamaCloud.ts` - Ollama Cloud integration
- `server/fetcherAgent.ts` - Lead hunting automation
- `server/imageGeneration.ts` - Image generation service

### Database (Drizzle ORM)
- `drizzle/schema.ts` - Database schema
- Tables: users, chatSessions, chatMessages, providerConfigs, manusTasks, fetcherLogs

## 🔌 API Reference

### Chat Procedures

```typescript
// Create new chat session
trpc.chat.createSession.mutate({ title: "My Chat" })

// Send message and get response
trpc.models.sendMessage.mutate({
  provider: "ollama",
  model: "llama2",
  messages: [{ role: "user", content: "Hello!" }],
  sessionId: 1
})

// Get chat history
trpc.chat.getMessages.query({ sessionId: 1 })
```

### Paperclip Procedures

```typescript
// Connect to Paperclip
trpc.paperclip.connect.mutate({
  apiUrl: "https://paperclip.example.com",
  apiKey: "pk_...",
  companyId: "comp_..."
})

// Get agents
trpc.paperclip.getAgents.query({ companyId: "comp_..." })

// Delegate task
trpc.paperclip.delegateTask.mutate({
  companyId: "comp_...",
  taskId: "task_...",
  agentId: "agent_..."
})
```

### FETCHER Procedures

```typescript
// Scan for leads
trpc.fetcher.scanForLeads.mutate()

// Get qualified leads
trpc.fetcher.getQualifiedLeads.query({ hoursAgo: 24 })

// Log a lead
trpc.fetcher.logLead.mutate({
  source: "reddit_forhire",
  title: "Build a website",
  url: "https://reddit.com/...",
  budget: 500,
  qualified: true
})
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/auth.logout.test.ts

# Watch mode
pnpm test --watch
```

## 📊 Database Schema

### chatSessions
- `id` - Primary key
- `userId` - User who owns the session
- `title` - Session name
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### chatMessages
- `id` - Primary key
- `sessionId` - Associated session
- `role` - "user" or "assistant"
- `content` - Message text
- `provider` - Model provider (ollama, openrouter, openai, etc.)
- `model` - Model name
- `metadata` - Additional data (tokens, cost, etc.)
- `createdAt` - Timestamp

### providerConfigs
- `id` - Primary key
- `userId` - User who configured it
- `provider` - Provider name
- `apiKey` - Encrypted API key
- `baseUrl` - API endpoint
- `createdAt` - Configuration date

### fetcherLogs
- `id` - Primary key
- `userId` - User who scanned
- `source` - Lead source (reddit_forhire, upwork, fiverr)
- `title` - Lead title
- `url` - Lead URL
- `budget` - Quoted budget
- `postedAt` - When lead was posted
- `qualified` - Whether it meets criteria
- `createdAt` - When logged

## 🚀 Deployment

### Using Manus Hosting

1. Create checkpoint: `webdev_save_checkpoint`
2. Click "Publish" in Management UI
3. Configure custom domain (optional)
4. Enable SSL (automatic)

### Using External Hosting

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔐 Security

- All API keys encrypted at rest
- OAuth 2.0 authentication via Manus
- Database connections use SSL
- No sensitive data in logs
- CORS properly configured
- Input validation on all endpoints

## 🐛 Troubleshooting

### Models not loading
- Verify API key is valid
- Check internet connection
- Ensure endpoint URL is correct
- Check rate limits

### Paperclip connection failed
- Verify API URL is accessible
- Check API key validity
- Ensure firewall allows connection
- Review webhook configuration

### FETCHER not finding leads
- Check Reddit/Upwork/Fiverr are accessible
- Verify budget threshold ($50 minimum)
- Ensure posts are within 4 hours
- Check database for logged leads

### Image generation timeout
- Try shorter, simpler prompts
- Check available credits/budget
- Verify internet connection
- Review API rate limits

## 📚 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Paperclip & Ollama Cloud setup
- [API Reference](./server/routers.ts) - Complete tRPC procedures
- [Database Schema](./drizzle/schema.ts) - Table definitions
- [Frontend Components](./client/src/components/) - React components

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 💬 Support

- Issues: [GitHub Issues](https://github.com/yourusername/openclaw/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/openclaw/discussions)
- Email: support@openclaw.ai

## 🎯 Roadmap

- [ ] Voice input/output support
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Browser extension
- [ ] Slack/Discord integration
- [ ] Webhook support
- [ ] Advanced prompt templates

## 🙏 Acknowledgments

- [Paperclip](https://paperclip.ing/) - Business OS for autonomous AI companies
- [Ollama](https://ollama.ai/) - Local LLM infrastructure
- [OpenRouter](https://openrouter.ai/) - Model aggregation platform
- [Manus](https://manus.im/) - AI workspace platform

---

## 🙌 Credits & Attribution

**OpenClaw** was designed and built by **[Manus](https://manus.im/)** — an AI workspace platform for autonomous teams.

### Built With
- **Manus AI Workspace Platform** - Core infrastructure, OAuth, LLM APIs, image generation, and data management
- **Paperclip** - Open-source business OS for autonomous AI companies
- **Ollama** - Local and cloud LLM infrastructure
- **React 19 & Tailwind CSS 4** - Frontend framework and styling
- **Express & tRPC** - Backend framework and type-safe APIs
- **Drizzle ORM** - Database layer

### Special Thanks
- Paperclip team for the open-source business OS architecture
- Ollama team for accessible LLM infrastructure
- OpenRouter for model aggregation
- All open-source contributors

### Design & Development
**Designed and built by Manus** — Making autonomous AI teams possible.

---

**Built with ❤️ by Manus for autonomous teams**
