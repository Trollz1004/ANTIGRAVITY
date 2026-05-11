# About OpenClaw

## 🎯 What is OpenClaw?

**OpenClaw** is a professional AI workspace designed and built by **[Manus](https://manus.im/)** that enables autonomous teams to work together seamlessly. It combines multi-provider LLM access, intelligent lead hunting, and integration with open-source business automation tools.

## 🏢 Built by Manus

**[Manus](https://manus.im/)** is an AI workspace platform that makes it possible for autonomous AI teams to coordinate, execute tasks, and achieve goals together.

### Why Manus Built OpenClaw

Manus created OpenClaw to demonstrate how modern AI teams can:

1. **Access Multiple Models** - Use the best LLM for each task without vendor lock-in
2. **Coordinate Autonomously** - Work together through unified task management
3. **Optimize Costs** - Intelligently route work to the most cost-effective provider
4. **Scale Intelligently** - Handle complex workflows with multiple specialized agents
5. **Maintain Transparency** - Track every decision, cost, and outcome

## 🔗 Core Integrations

### Paperclip - Autonomous Team Coordination

OpenClaw integrates with **[Paperclip](https://paperclip.ing/)**, an open-source business OS for autonomous companies. This enables:

- **Agent Registration** - OpenClaw appears as an agent in your Paperclip company
- **Task Delegation** - Receive work from other agents or delegate to them
- **Budget Control** - Monitor spending and enforce limits per agent
- **Org Chart** - Visualize your autonomous team structure
- **Goal Alignment** - Ensure all agents work toward company objectives

### Ollama - Local & Cloud LLMs

OpenClaw supports both **[Ollama Local](https://ollama.ai/)** and **Ollama Cloud**:

- **Local Models** - Run models on your own hardware for maximum privacy
- **Cloud Models** - Access 100+ hosted models without local infrastructure
- **Cost Optimization** - Choose the right model for each task's budget
- **No Vendor Lock-in** - Switch between providers seamlessly

### OpenRouter - Model Aggregation

OpenClaw integrates **[OpenRouter](https://openrouter.ai/)** for:

- **Model Variety** - Access models from multiple providers through one API
- **Unified Pricing** - Compare costs across providers
- **Automatic Failover** - Switch to backup models if primary fails
- **Cost Tracking** - Monitor spending across all models

## 🛠️ Technology Stack

OpenClaw is built on modern, open-source technologies:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Tailwind CSS 4, TypeScript | Modern, responsive UI with type safety |
| **Backend** | Express.js, tRPC, TypeScript | Type-safe APIs with automatic validation |
| **Database** | Drizzle ORM, MySQL/TiDB | Reliable data persistence |
| **Authentication** | Manus OAuth | Secure user management |
| **Infrastructure** | Node.js, Vite, Docker | Production-ready deployment |

## 💡 Key Features

### 1. Multi-Provider Chat Interface
Switch between Ollama, Ollama Cloud, OpenRouter, and OpenAI-compatible endpoints. Each message shows which provider and model generated it.

### 2. Persistent Chat Sessions
Create, organize, and manage multiple conversation threads. All messages are stored and searchable.

### 3. Paperclip Integration
Register as an agent in your Paperclip company. Receive tasks, delegate work, and coordinate with other agents.

### 4. FETCHER Agent Module
Automatically scan Reddit, Upwork, and Fiverr for freelance opportunities. Get notified when 3+ qualified leads are found.

### 5. Image Generation
Generate images directly within conversations using Manus's built-in image generation capabilities.

### 6. Manus API Integration
Create and monitor Manus tasks, send messages to agents, and orchestrate complex workflows.

### 7. Settings & Configuration
Configure API keys, endpoints, and preferences for all integrated services in one place.

## 🎨 Design Philosophy

OpenClaw embodies Manus's design principles:

### Professional & Powerful
The dark cyberpunk aesthetic conveys sophistication and capability. Neon accents highlight important actions without overwhelming the interface.

### Type-Safe & Reliable
Full TypeScript throughout ensures correctness. tRPC provides end-to-end type safety from database to UI.

### Open & Extensible
Built on open standards and open-source tools. Easy to extend with new providers, agents, or features.

### User-Centric
Intuitive workflows, clear feedback, and helpful error messages. Designed for both technical and non-technical users.

### Privacy-First
Support for local models ensures sensitive work never leaves your infrastructure.

## 🚀 Use Cases

### 1. Autonomous Freelance Team
Use FETCHER to find leads, delegate to specialized agents, and coordinate through Paperclip.

### 2. AI Research
Experiment with multiple models simultaneously. Compare outputs, costs, and performance.

### 3. Content Generation
Generate text, images, and code using the best model for each task type.

### 4. Business Automation
Integrate with Paperclip to automate business processes with autonomous agents.

### 5. Cost Optimization
Route work to the most cost-effective provider while maintaining quality.

### 6. Multi-Agent Coordination
Manage teams of specialized agents working together on complex projects.

## 📊 Manus Platform Integration

OpenClaw leverages Manus's core platform capabilities:

| Capability | Purpose | Benefit |
|-----------|---------|---------|
| **OAuth Authentication** | Secure user login | No password management needed |
| **LLM APIs** | Access to multiple models | Unified interface for all providers |
| **Image Generation** | AI-powered image creation | Professional visual content |
| **Data Management** | Secure storage & retrieval | Reliable data persistence |
| **Notifications** | Owner alerts & updates | Real-time information flow |
| **API Gateway** | Request routing & rate limiting | Reliable, scalable infrastructure |
| **Deployment** | Cloud hosting & auto-scaling | Production-ready infrastructure |

## 🌟 Why Choose OpenClaw?

### Compared to ChatGPT
- **Multi-provider** - Not locked into one model
- **Private** - Can run locally with Ollama
- **Integrated** - Works with Paperclip for team coordination
- **Extensible** - Add custom providers and agents
- **Cost-controlled** - Monitor and optimize spending

### Compared to Local Ollama
- **Cloud Option** - Scale without local hardware
- **Multi-provider** - Access more models
- **Team Coordination** - Built-in agent management
- **Professional UI** - Enterprise-grade interface
- **Lead Hunting** - Automated opportunity discovery

### Compared to Generic AI Platforms
- **Autonomous Teams** - Built for agent coordination
- **Open Integration** - Works with open-source tools
- **Transparent Costs** - See exactly what you're spending
- **Privacy Options** - Local model support
- **Extensible** - Easy to customize and extend

## 🤝 Community & Contribution

OpenClaw is part of a larger ecosystem:

- **Manus** - AI workspace platform
- **Paperclip** - Open-source business OS
- **Ollama** - Open-source LLM infrastructure
- **OpenRouter** - Model aggregation platform

We welcome contributions, feedback, and ideas from the community.

## 📚 Documentation

- **[README](./README_OPENCLAW.md)** - Quick start and feature overview
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Detailed setup for Paperclip & Ollama Cloud
- **[Credits](./CREDITS.md)** - Attribution and acknowledgments
- **[API Reference](./server/routers.ts)** - Complete tRPC procedures

## 🔗 Links

- **Manus**: https://manus.im
- **Paperclip**: https://paperclip.ing
- **Ollama**: https://ollama.ai
- **OpenRouter**: https://openrouter.ai
- **GitHub**: https://github.com/yourusername/openclaw

## 📝 License

OpenClaw is released under the MIT License. See [LICENSE](./LICENSE) for details.

---

**OpenClaw: Designed and built by Manus for autonomous teams.**

*Making it possible for AI agents to work together, coordinate tasks, and achieve goals seamlessly.*
