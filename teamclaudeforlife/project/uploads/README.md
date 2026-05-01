# OpusPawClaw ⚡️

**OpusPawClaw** is a premium, flagship desktop AI workstation shipped as both a secure Electron desktop client and a responsive web app. It is the core elite platform engineered by **Antigravity Platforms** / **Trash Or Treasure Online Recycler LLC (FL)**. Built by Joshua Coleman ([@Trollz1004](https://github.com/Trollz1004)).

This platform serves as the ultimate developer "Boss Mode" environment. It completely unifies cloud AI, local offline models (Ollama), full file-system management, native Git operations, and code quality checking—all inside an incredibly slick, "elite-tier" interface.

## 🌟 Open Source & Community Mission
This flagship platform and all products associated with **Trollz1004 / Antigravity Platforms** are strictly 100% open-source code. We believe in building in public and are open to suggestions, contributions, and feedback to make this the ultimate workstation. 
**#UntilNoKidInNeed**

---

## 🔥 Epic Elite Features

### Dynamic Multi-Agent Orchestration
*   **Split-Pane Workspaces**: Dynamically add, remove, and manage up to 4 simultaneous AI agent panes side-by-side. 
*   **Global Task Commander**: Shoot a singular "Global Task" command to dispatch workloads to all active AI agents simultaneously via a custom event bus.
*   **Provider Agnostic**: Bring your own keys! Supports **Claude**, **GPT-4o**, **Gemini**, and **Ollama** natively.
*   **Intelligent Response UI**: Real-time markdown rendering with professional `vscDarkPlus` syntax-highlighted code blocks.
*   **One-Click Code Exporting**: Instantly copy or export AI-generated code blocks directly to file.

### Advanced Code Mode & Integrated Terminal
*   **Monaco Engine**: Embedded VS Code-tier editor with an active workspace file tree.
*   **Integrated xTerm.js**: A fully operational shell runtime embedded in the UI. 
*   **Dynamic Terminal Themes**: Switch color profiles on the fly without losing terminal state (Opus Default, Hacker Green, Monokai, Dracula, PowerShell).
*   **Local Ollama AI Launchpad**: Launch local coding suites—such as *OpenClaw*, *Claude*, *Codex*, *OpenCode*, *Droid*, and *Pi*—straight into the integrated terminal with zero configuration.

### Git & Source Control Panel
*   **Branch Management**: View standard Git histories, visually verify changes, and instantaneously switch, stage, or create branches.
*   **Visual Diff Engine**: Side-by-side AI-grade code diffing right in the app.
*   **Copilot Diff Ready**: Integration points primed for Ollama's local GitHub Copilot integrations.

### Security First
*   **Jules Code Check Tool**: Auto-analyzes generated code for vulnerabilities, performance optimization, and styling best practices before integration. Features unique "Pixel Battle" interactions representing AI cross-checking models!
*   **Local Encryption**: API Keys are never sent to a central server; they are symmetrically encrypted locally on your machine.
*   **18+ Secure Execution**: Age-gated configurations specifically for secure administrative deployment.

### Contextual Floating Guides
*   **"Gemma" Persona Guide**: A persistent, floating, lightweight assistant specifically designed to help onboard operators with platform commands and workflow optimization.

---

## 🚀 Installation & Getting Started

### Prerequisites
*   Node.js v18+
*   [Ollama](https://ollama.com/) (Required to run local offline LLM Agents)

### Setup

```bash
# Clone the repository
git clone https://github.com/Trollz1004/OpusPawClaw.git
cd OpusPawClaw

# Install packages
npm install

# Run the Electron Desktop App connected to the Vite Dev Server
npm run dev:electron
```

### Build & Package (Distribute)
```bash
# Build the production optimized React bundle
npm run build

# Package into executable formats (Windows, Mac, Linux)
npm run dist
```

## ⚙️ Provider Setup
Go to **Settings** inside the application to enter your API Keys or configure your custom local `Ollama` port endpoints (Default: `http://localhost:11434`).

## 🤝 Charitable Support
Every piece of energy put into this goes towards making an impact. Support the cause and know that 10% of any broader ecosystem support is channeled into providing kids' medical care through our founder-directed charity.

**#UntilNoKidInNeed**
