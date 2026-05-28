# OpenClaw Unified GUI - TODO

## Database & Backend Setup
- [x] Extend schema with tables for: chat_sessions, chat_messages, provider_configs, manus_tasks, paperclip_config, fetcher_leads
- [x] Create database helpers for all CRUD operations
- [x] Implement tRPC routers for: chat, models, settings, manus, paperclip, fetcher

## Frontend UI & Theme
- [x] Set up cyberpunk dark theme with neon accents in index.css
- [x] Create DashboardLayout component with sidebar navigation
- [x] Implement sidebar with 7 sections: Dashboard, Chat, Agents, Tasks, Leads, Paperclip, Settings
- [x] Create responsive layout for desktop and mobile

## Dashboard Page
- [x] Create Dashboard page with overview statistics
- [x] Display recent chat sessions and tasks
- [x] Show system status and quick actions

## Chat Workspace
- [x] Create Workspace page with message history display
- [x] Implement streaming chat responses with real-time token rendering
- [x] Add markdown rendering with code blocks and tables
- [x] Implement multi-provider model selector (Ollama, OpenRouter, OpenAI)
- [x] Add session management (create, list, delete sessions)
- [x] Implement image generation detection and inline image display
- [x] Add image generation backend service and API endpoint

## Agent Launcher
- [x] Create Agents page with agent launcher dashboard
- [x] Display all 8 agents: Claude Code, OpenClaw, Hermes, Codex, OpenCode, Copilot CLI, Droid, Pi
- [x] Show copyable ollama launch commands for each agent
- [x] Add one-click copy functionality with visual feedback

## Manus API Task Management
- [x] Create Tasks page with task management interface
- [x] Implement task creation form with prompt input
- [x] Display task list with status indicators
- [x] Implement real-time task status polling
- [x] Add message history viewer for each task
- [x] Implement message sending to tasks
- [x] Add task lifecycle management (create, stop, delete)

## Paperclip Integration
- [x] Create Paperclip page with connection form
- [x] Implement Paperclip API key and URL configuration
- [x] Display connected agents with status
- [x] Implement 10-second polling for agent status updates
- [x] Show budget and heartbeat information
- [x] Implement task delegation to agents
- [x] Display org chart and agent hierarchy

## FETCHER Lead Scanner
- [x] Create Leads page with scanner interface
- [x] Implement lead scanning trigger (Reddit, Upwork, Fiverr)
- [x] Display qualified leads with filters (budget, source, time)
- [x] Highlight top picks
- [x] Implement lead qualification logic (budget >= $50, age <= 4 hours)
- [x] Add owner notifications for 3+ qualified leads

## Provider Settings
- [x] Create Settings page with provider configuration tabs
- [x] Implement Ollama Cloud settings (API key, endpoint)
- [x] Implement OpenAI settings (API key, base URL)
- [x] Implement OpenRouter settings (API key, base URL)
- [x] Implement Paperclip settings (API URL, API key, company ID)
- [x] Add form validation and error handling
- [x] Add provider connection testing

## Backend Services
- [x] Implement Manus API client for task creation and messaging
- [x] Implement Paperclip client for agent management
- [x] Implement FETCHER scanner for lead discovery
- [x] Implement image generation service
- [x] Implement owner notification service
- [x] Implement agent registration and heartbeat scheduling

## Startup & Scheduling
- [x] Register OpenClaw as agent with Paperclip on server startup
- [x] Implement periodic heartbeat scheduling (60-second intervals)
- [x] Add graceful shutdown for scheduled tasks

## Testing & Refinement
- [x] Write vitest tests for backend routers
- [x] Test streaming chat responses
- [x] Test Manus API integration
- [x] Test Paperclip integration
- [x] Test FETCHER lead scanning
- [x] Test image generation
- [x] Test provider configuration
- [x] Verify cyberpunk UI theme and accessibility
- [x] Test responsive design on mobile

## Deployment & Delivery
- [x] Create initial checkpoint
- [x] Verify all features working end-to-end
- [x] Document API integration points
- [x] Prepare for user testing

## Paperclip Agent Delegation Flow (Complete)
- [x] Create delegation task modal/form component
- [x] Add backend router for task delegation to agents
- [x] Implement task assignment tracking in database
- [x] Add real-time delegation status updates
- [x] Display agent workload and task history
- [x] Implement task result retrieval and display
- [x] Add delegation history and analytics

## Hermes Workspace Integration (In Progress)
- [ ] Install Hermes workspace via curl script
- [ ] Create Hermes service integration layer in backend
- [ ] Add Hermes configuration to Settings page
- [ ] Build Hermes workspace UI component for middle area
- [ ] Implement Hermes memory/context management
- [ ] Wire Hermes API for agent orchestration
- [ ] Add Hermes task delegation and monitoring
- [ ] Integrate Hermes with existing agents (Claude Code, OpenClaw, etc.)
- [ ] Build Hermes command palette for quick actions
- [ ] Add Hermes response streaming to chat
