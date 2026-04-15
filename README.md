# ANTIGRAVITY

Public monorepo for the YouAndINotAI platform and related web properties operated by Trash Or Treasure Online Recycler LLC.

## Ecosystem projects

| Project                                                         | Visibility | Surface                 | Purpose                                                                                                                                      |
| --------------------------------------------------------------- | ---------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [YouAndINotAI](https://youandinotai.com/)                       | Public     | Live product            | Human-focused social platform with verification, moderation, and subscription flows.                                                         |
| [OnlineRecycle](https://onlinerecycle.org/)                     | Public     | Live product            | Central Florida electronics recycling, secure device intake, pickup, drop-off, and resale.                                                   |
| [AI-Solutions Store](https://ai-solutions.store/)               | Public     | Live product            | Separate storefront for digital products and automation offers.                                                                              |
| [Antigravity Dashboard](https://dashboard.aidoesitall.website/) | Public     | Live auth gateway       | Cloudflare-hosted entry page that routes trusted users into the authenticated PaperClip workspace.                                           |
| [AIDoesItAll.website](https://www.aidoesitall.website/)         | Public     | Live gateway surface    | Safe public handoff surface that routes trusted users to the authenticated workspace and points public visitors to the active product sites. |
| [ClawX](https://clawx-aihub-zwxfcstm.manus.space/)              | Public     | Live external dashboard | Separate multi-AI governance and coordination surface hosted outside this monorepo.                                                          |
| Command Center                                                  | Private    | Separate private repo   | Private admin dashboard for approvals, media workflow, and internal operator views.                                                          |
| Social Command Center                                           | Internal   | MCP/dashboard utility   | Read-only internal dashboard for platform and agent visibility.                                                                              |

## Repository Structure

```
ANTIGRAVITY/
├── backend/                  # Backend services
│   └── fastapi-app/          # YouAndINotAI FastAPI service
├── frontend/                 # Frontend applications
│   └── react-app/            # YouAndINotAI React frontend
├── infra/                    # Infrastructure as Code
├── scripts/                  # Automation scripts
├── docs/                     # Documentation
├── briefings/                # Operational briefings
├── memory/                   # Design and operational memory
├── research/                 # User research and evaluation
└── projects/                 # Project-specific documentation
```

## Stack

- Frontend: React, Next.js, TypeScript
- Backend: FastAPI / Python services
- Commerce: Square
- Hosting: Cloudflare Pages and Google Cloud Run
- Operations: Windows-based multi-node build and support workflow

## Local Development Setup

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.9 or higher)
- Docker (for infrastructure services)
- Git

### Backend Setup

```powershell
cd backend/fastapi-app
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend Setup

```powershell
cd frontend/react-app
npm install
npm run dev
```

## Environment Configuration

Each component requires specific environment variables. Refer to the respective `.env.example` files in each directory.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- `docs/architecture.md` - System architecture
- `docs/api.md` - API endpoints and contracts
- `docs/workflows.md` - Core business workflows
- `docs/contributing.md` - Contribution guidelines

## Public Note

This repository intentionally keeps customer-facing product details separate from internal operational material. Public product claims should live on controlled web surfaces, not in repo doctrine.
