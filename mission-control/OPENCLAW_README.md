# OpenClaw AI Workspace

A professional, self-hosted AI workspace with a dark cyberpunk aesthetic. OpenClaw provides unified multi-provider chat (Ollama, OpenRouter, OpenAI-compatible), persistent sessions, Manus API integration, and an automated FETCHER agent for freelance lead hunting.

## Features

### Core Chat Interface
- **Multi-Provider Support**: Seamlessly switch between Ollama (local), OpenRouter (cloud), OpenAI-compatible endpoints, and Manus agents
- **Persistent Sessions**: Create, rename, delete, and organize conversation threads with full history
- **Provider Badges**: Each message displays the provider and model used for transparency
- **Markdown Rendering**: Full support for code blocks, tables, and formatted responses
- **Dark Cyberpunk Theme**: Professional workspace with neon green accents and immersive UI

### Model Integration

#### Ollama (Local)
- Run LLMs locally without cloud dependencies
- Configure custom base URL and optional API key
- Access all installed Ollama models

#### OpenRouter (Cloud)
- Access 100+ models from various providers
- Single API key for unified model access
- Cost-effective routing across providers

#### OpenAI-Compatible
- Support for OpenAI API and compatible endpoints
- Custom base URL configuration
- Works with Azure OpenAI, local vLLM, and others

#### Manus API
- Orchestrate complex tasks with Manus agents
- Monitor task lifecycle in real-time
- Integrate AI-powered automation

### FETCHER Agent Module
Automated freelance lead hunting with strict qualification criteria:
- **Sources**: Reddit r/forhire, Reddit r/websiteservices, Upwork, Fiverr
- **Qualification Thresholds**: Budget ≥ $50, Posted ≤ 4 hours ago
- **Notifications**: Owner receives alerts when 3+ leads found, including top pick title and budget
- **Lead Logging**: All results stored in database for historical tracking

### Settings & Configuration
- API key management for all providers
- Custom endpoint configuration
- Provider activation/deactivation
- Secure credential storage

## Setup Instructions

### Prerequisites
- Node.js 22+
- MySQL/TiDB database
- (Optional) Ollama running locally for local model support

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd /home/ubuntu/openclaw
   pnpm install
   ```

2. **Configure Environment Variables**
   The following are automatically injected:
   - `DATABASE_URL`: MySQL connection string
   - `JWT_SECRET`: Session signing secret
   - `VITE_APP_ID`: Manus OAuth app ID
   - `OAUTH_SERVER_URL`: Manus OAuth backend
   - `BUILT_IN_FORGE_API_KEY`: Manus API key
   - `BUILT_IN_FORGE_API_URL`: Manus API endpoint

3. **Set Up Provider Credentials**
   - Navigate to Settings page after login
   - Configure each provider's API keys and endpoints:
     - **Ollama**: `http://localhost:11434` (default)
     - **OpenRouter**: Get API key from [openrouter.ai](https://openrouter.ai)
     - **OpenAI**: API key from [openai.com](https://openai.com)
     - **Manus**: API key from Manus dashboard

4. **Start Development Server**
   ```bash
   pnpm dev
   ```
   Server runs on `http://localhost:3000`

## Usage Guide

### Creating a Chat Session
1. Click **"+ New Chat"** in the sidebar
2. A new conversation thread is created
3. Select a provider and model from the dropdowns
4. Start typing your message

### Switching Providers
1. Use the **Provider** dropdown in the sidebar
2. Available models for that provider load automatically
3. Select a model from the **Model** dropdown
4. Send a message to use that provider

### Managing Sessions
- **Rename**: Right-click session → Edit title
- **Delete**: Right-click session → Delete (confirmation required)
- **Switch**: Click any session in the sidebar to open it

### Configuring Providers

#### Ollama
1. Ensure Ollama is running: `ollama serve`
2. Go to Settings → Ollama
3. Enter base URL (default: `http://localhost:11434`)
4. Save configuration
5. Models automatically load from your Ollama installation

#### OpenRouter
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key from the dashboard
3. Go to Settings → OpenRouter
4. Paste your API key
5. Save configuration

#### OpenAI-Compatible
1. Get your API key from your provider
2. Note the base URL (e.g., `https://api.openai.com/v1`)
3. Go to Settings → OpenAI
4. Enter base URL and API key
5. Save configuration

#### Manus
1. Get your API key from the Manus dashboard
2. Go to Settings → Manus
3. Paste your API key
4. Save configuration
5. Use Manus models for complex task orchestration

### Using FETCHER Agent
The FETCHER agent runs automatically and scans for freelance opportunities:

1. **Automatic Scanning**: Runs on a schedule (configurable)
2. **Qualification**: Only leads with budget ≥ $50 and posted ≤ 4 hours ago qualify
3. **Notifications**: When 3+ leads found, owner receives notification with:
   - Total number of qualified leads
   - Top pick title
   - Top pick budget
4. **Lead History**: View all scanned leads in the database

## Architecture

### Frontend (React 19 + Tailwind 4)
- **Workspace.tsx**: Main chat interface with sidebar
- **Settings.tsx**: Provider configuration page
- **Components**: Reusable UI components with shadcn/ui

### Backend (Express + tRPC)
- **routers.ts**: tRPC procedures for all features
- **db.ts**: Database query helpers
- **modelProvider.ts**: Model provider abstraction layer
- **drizzle/schema.ts**: Database schema definitions

### Database (MySQL)
- `chatSessions`: Conversation threads
- `chatMessages`: Message history with provider metadata
- `providerConfigs`: API keys and endpoints (encrypted)
- `manusTasks`: Manus task tracking
- `fetcherLogs`: Freelance lead records

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Database Migrations
```bash
pnpm drizzle-kit generate
# Review generated SQL, then apply via webdev_execute_sql
```

## API Reference

### Chat Procedures
- `chat.createSession(title)`: Create new conversation
- `chat.listSessions()`: Get all user sessions
- `chat.getMessages(sessionId)`: Get messages in session
- `chat.addMessage(...)`: Add message to session
- `chat.updateSession(sessionId, title)`: Rename session
- `chat.deleteSession(sessionId)`: Delete session

### Model Procedures
- `models.getAvailable(provider)`: List available models
- `models.sendMessage(provider, model, messages, sessionId)`: Send message to model

### Settings Procedures
- `settings.getProviderConfigs()`: Get all provider configs
- `settings.updateProviderConfig(provider, apiKey, baseUrl)`: Update config

### Manus Procedures
- `manus.createTask(taskId, prompt)`: Create task
- `manus.updateTaskStatus(taskId, status, result)`: Update task
- `manus.getTask(taskId)`: Get task details
- `manus.listTasks()`: Get all user tasks

### FETCHER Procedures
- `fetcher.getQualifiedLeads(hoursAgo)`: Get recent qualified leads
- `fetcher.logLead(...)`: Log a new lead

## Troubleshooting

### Models Not Loading
- Verify provider credentials in Settings
- Check that provider service is running/accessible
- Review browser console for error messages

### Messages Not Sending
- Ensure model is selected
- Check provider configuration is saved
- Verify API key is valid
- Review server logs for detailed errors

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Ensure MySQL/TiDB is running
- Check database credentials and permissions

## Performance Considerations

- **Local Models (Ollama)**: Faster, no API costs, requires local GPU
- **Cloud Models (OpenRouter/OpenAI)**: Slower, API costs, no local resources
- **Manus**: Best for complex multi-step tasks, higher latency

## Security Notes

- API keys are stored in the database (encrypted in production)
- All API communication uses HTTPS
- Session cookies are HTTP-only and secure
- User authentication via Manus OAuth

## Future Enhancements

- [ ] Streaming response support for real-time output
- [ ] Image generation within chat
- [ ] Voice input/output
- [ ] Conversation branching and forking
- [ ] Advanced FETCHER filtering and custom sources
- [ ] Team collaboration features
- [ ] Usage analytics and cost tracking

## License

MIT

## Support

For issues, feature requests, or questions, please refer to the Manus documentation or contact support at https://help.manus.im
