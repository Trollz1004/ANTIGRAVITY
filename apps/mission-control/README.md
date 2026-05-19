# Mission Control

> The operational dashboard for the **ANTIGRAVITY** platform — a unified command center for managing AI agents, monitoring system health, tracking treasury, and orchestrating mission-critical workflows.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Key Components](#key-components)
- [API Integration](#api-integration)
- [Custom Hooks](#custom-hooks)
- [Input Validation](#input-validation)
- [Theming & Styling](#theming--styling)
- [Adding New Panels](#adding-new-panels)
- [Testing](#testing)
- [Environment Variables](#environment-variables)

---

## Overview

Mission Control is the primary web-based dashboard for the ANTIGRAVITY ecosystem. It provides real-time visibility into:

- **AI Agent Fleet** — status and health of Claude, Hermes, CodeX, Ollama, and Paperclip workers
- **Treasury** — committed funds, kids fund balance, and estimated kids covered
- **Launch Operations** — initiate and track deployment pipelines
- **Revenue Engine** — monitor revenue streams and performance
- **Stack Integrity** — system health checks across the full technology stack
- **Trust Hierarchy** — governance and authority structure visualization
- **Runbooks** — operational runbooks and standard procedures
- **Build Agent** — AI-assisted code building and repository management
- **T5500 Node** — dedicated node status and control panel
- **DAO Governance** — decentralized governance panel

The dashboard is served as a static Single Page Application (SPA) built with Vite and React, designed to be deployed alongside the ANTIGRAVITY API server.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.5 | UI component library |
| TypeScript | 6.0.2 | Type-safe development |
| Vite | 8.0.10 | Build tool & dev server |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| React Router DOM | 6.0.2 | Client-side routing |
| Lucide React | 0.378.0 | Icon library |
| clsx | 2.1.0 | Conditional class composition |
| Vitest | 4.1.6 | Unit testing framework |
| @testing-library/react | 16.3.2 | React component testing |
| ESLint | 10.2.1 | Code linting |

---

## Directory Structure

```
mission-control/
├── index.html                          # Entry HTML file
├── package.json                        # Dependencies & scripts
├── tailwind.config.ts                  # Tailwind CSS theme configuration
├── tsconfig.json                       # TypeScript configuration
├── tsconfig.app.json                   # App-specific TS config
├── tsconfig.node.json                  # Node/Vite TS config
├── vite.config.ts                      # Vite build configuration
├── eslint.config.js                    # ESLint configuration
├── README.md                           # This file
└── src/
    ├── main.tsx                        # React entry point
    ├── App.tsx                         # Root application component
    ├── index.css                       # Global styles & Tailwind imports
    ├── vite-env.d.ts                   # Vite environment type declarations
    ├── components/
    │   ├── Sidebar.tsx                 # Left navigation sidebar with mode switching
    │   ├── TopBar.tsx                  # Top header bar with treasury info & branding
    │   ├── Footer.tsx                  # Bottom status bar
    │   ├── MissionControlDashboard.tsx # Main dashboard layout wrapper
    │   ├── TaskBriefInput.tsx          # Task input form for dispatching work
    │   ├── LaunchPanel.tsx             # Launch/deployment operations panel
    │   ├── TreasuryBand.tsx            # Treasury status indicator band
    │   ├── HermesRouterPanel.tsx       # Hermes AI router status & controls
    │   ├── PaperclipWorkerPanel.tsx    # Paperclip worker agent status panel
    │   ├── RevenueEnginePanel.tsx      # Revenue monitoring panel
    │   ├── TrustHierarchyPanel.tsx     # Trust & governance hierarchy display
    │   ├── StackIntegrityPanel.tsx     # Full stack health monitoring panel
    │   ├── StackIntegrityWidget.tsx    # Compact stack integrity widget (sidebar)
    │   ├── RunbooksPanel.tsx           # Operational runbooks panel
    │   ├── BuildAgentPanel.tsx         # AI build agent controls
    │   ├── MissionBand.tsx             # Mission status indicator band
    │   ├── T5500Panel.tsx              # T5500 node control panel
    │   ├── DaoPanel.tsx                # DAO governance panel (in sidebar)
    │   ├── PanelBase.tsx               # Reusable panel container component
    │   ├── Toast.tsx                   # Toast notification system
    │   ├── ConfirmDialog.tsx           # Confirmation dialog modal
    │   ├── SearchFilter.tsx            # Search & filter input component
    │   ├── ModeButton.tsx              # Mode toggle button component
    │   ├── SkeletonLoader.tsx          # Loading skeleton placeholder
    │   ├── ScanningRepoIndicator.tsx   # Repository scanning status indicator
    │   └── UnreachableTile.tsx         # Unreachable service fallback tile
    └── lib/
        ├── api.ts                      # API client (GET/POST with timeout & envelopes)
        ├── modes.ts                    # Application mode definitions
        ├── usePoll.ts                  # Polling hook for live data refresh
        ├── useToast.tsx                # Toast notification state management
        └── input-validation.ts         # Strict input validation utilities
```

---

## Getting Started

### Prerequisites

- **Node.js** — v18 or later recommended
- **npm** — v9 or later

### Installation

```bash
cd apps/mission-control
npm install
```

### Development

Start the Vite dev server (default port 5173):

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output is written to the `dist/` directory. Preview the production build locally:

```bash
npm run preview
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start the Vite development server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `lint` | `eslint .` | Run ESLint across the project |
| `preview` | `vite preview` | Serve the production build locally |

---

## Key Components

### Layout Components

#### `TopBar`
The top header bar displays the ANTIGRAVITY mission hashtag (`#UntilNoKidInNeed`), treasury summary (committed amount, kids fund, kids covered estimate), build badge, and a share button.

#### `Sidebar`
Left-side navigation with 8 operational modes: Mission Control, Mission Ledger, AI Roundtable, Tasks, Code Mode, Create · Banana, Research Mode, and Chat Mode. Also houses the `StackIntegrityWidget` and `DaoPanel`.

#### `Footer`
Bottom status bar for additional system information and status indicators.

### Dashboard Panels

#### `LaunchPanel`
Primary panel for initiating and tracking deployment/launch operations. Displays launch status and provides controls for triggering new launches.

#### `TreasuryBand`
A horizontal status band showing real-time treasury information pulled from the API.

#### `HermesRouterPanel`
Displays the status and routing information for the Hermes AI agent router. Shows connected agents, routing tables, and health metrics.

#### `PaperclipWorkerPanel`
Monitors the Paperclip worker agent — its current task queue, processing status, and throughput metrics.

#### `RevenueEnginePanel`
Tracks revenue streams, financial performance metrics, and monetization pipeline status.

#### `TrustHierarchyPanel`
Visualizes the governance and trust structure of the ANTIGRAVITY platform, showing authority relationships and trust levels.

#### `StackIntegrityPanel`
Comprehensive system health dashboard showing the status of all technology stack components. Polls the API for real-time health data.

#### `RunbooksPanel`
Displays operational runbooks — step-by-step procedures for common operational tasks and incident response.

#### `BuildAgentPanel`
Interface for the AI build agent, allowing users to trigger builds, review agent output, and manage repository operations.

#### `MissionBand`
Horizontal status band showing overall mission health and key performance indicators.

#### `T5500Panel`
Dedicated control panel for the T5500 node — displays node status, resource utilization, and node-specific controls.

#### `DaoPanel`
Decentralized Autonomous Organization governance panel accessible from the sidebar, showing proposals, voting status, and governance metrics.

### Utility Components

#### `PanelBase`
A reusable panel container that provides consistent styling, header, and collapse behavior for all panel components.

#### `TaskBriefInput`
Input form for creating and dispatching task briefs to AI agents. Includes strict input validation (500 char max, allowlisted characters).

#### `Toast` / `ToastContainer`
Toast notification system for user feedback. Managed via the `ToastProvider` context.

#### `ConfirmDialog`
Reusable confirmation modal for destructive or important actions.

#### `SearchFilter`
Search and filter input for filtering dashboard content.

#### `SkeletonLoader`
Animated placeholder shown while data is loading.

#### `ScanningRepoIndicator`
Visual indicator shown when the system is scanning repositories.

#### `UnreachableTile`
Fallback display tile shown when a service or data source is unreachable.

---

## API Integration

The `src/lib/api.ts` module provides a typed HTTP client for communicating with the ANTIGRAVITY backend API.

### Configuration

By default, the API client uses **relative paths**, meaning it works when the dashboard is served from the same origin as the API (e.g., `localhost:8787`). To override the API base URL (e.g., when running the Vite dev server separately):

```bash
echo "VITE_API_URL=http://localhost:8787" > apps/mission-control/.env.local
```

### Envelope Type

All API responses are wrapped in a typed envelope:

```typescript
type Envelope<T = any> = {
  status: "ok" | "degraded" | "unreachable";
  checked_at: string;
  latency_ms: number;
  details: T;
  error: string | null;
};
```

### Functions

| Function | Signature | Description |
|---|---|---|
| `apiGet` | `apiGet<T>(path, timeout?)` | GET request returning `Envelope<T>`. Default timeout: 2500ms. |
| `apiPost` | `apiPost<T>(path, body, timeout?)` | POST request with JSON body. Default timeout: 5000ms. |
| `apiJson` | `apiJson<T>(path, timeout?)` | GET request returning `{ data, error }` tuple. Default timeout: 5000ms. |
| `fetchWithTimeout` | `fetchWithTimeout(url, init?, timeout?)` | Low-level fetch with abort timeout. Default timeout: 2500ms. |

All functions handle network errors gracefully and return fallback `unreachable` envelopes instead of throwing.

---

## Custom Hooks

### `usePoll<T>(path, interval?)`

Located in `src/lib/usePoll.ts`. Automatically polls an API endpoint at a specified interval (default: 10 seconds) and returns the latest `Envelope<T>` with a `loading` flag.

```typescript
const { status, details, loading, latency_ms } = usePoll<HealthData>("/api/health");
```

### `ToastProvider` / `useToast`

Located in `src/lib/useToast.tsx`. React context and hook for managing toast notifications. Wrap your app in `<ToastProvider>` and call `useToast()` to show notifications.

---

## Input Validation

The `src/lib/input-validation.ts` module provides strict, allowlist-based input validation:

| Function | Description |
|---|---|
| `validateTaskBrief(input)` | Validates task brief text (max 500 chars, alphanumeric + punctuation allowlist) |
| `validateAgentId(input)` | Validates agent ID against allowlist: `codex`, `claude`, `hermes`, `ollama`, `paperclip` |
| `validateEmail(input)` | Email format validation |
| `validateRequired(input)` | Non-empty string validation |
| `validateMinLength(input, min)` | Minimum length check |
| `validateMaxLength(input, max)` | Maximum length check |
| `validateField(value, rules)` | Generic field validation with configurable rule chains |

All validators return a `ValidationResult` discriminated union: `{ valid: true, value }` or `{ valid: false, error }`.

---

## Theming & Styling

The app uses a custom dark theme configured in `tailwind.config.ts`:

| Token | Value | Usage |
|---|---|---|
| `background` | `#0b0f1a` | Page background |
| `panel` | `#0f1421` | Panel/card backgrounds |
| `border` | `#1f2740` | Border color |
| `accentCyan` | `#22d3ee` | Primary accent (links, highlights) |
| `accentTeal` | `#14b8a6` | Secondary accent |
| `accentMagenta` | `#e879f9` | Tertiary accent (branding, badges) |

**Font families:**
- `font-mono`: IBM Plex Mono
- `font-sans`: IBM Plex Sans

---

## Adding New Panels

To add a new dashboard panel:

1. **Create the component** in `src/components/`:

```tsx
// src/components/MyNewPanel.tsx
import React from "react";
import { PanelBase } from "./PanelBase";

export const MyNewPanel: React.FC = () => {
  return (
    <PanelBase title="My New Panel" icon="🚀">
      {/* Panel content */}
    </PanelBase>
  );
};
```

2. **Import and place it** in `src/App.tsx`:

```tsx
import { MyNewPanel } from "./components/MyNewPanel";

// Add to the main content area or sidebar:
<MyNewPanel />
```

3. **If the panel needs API data**, use the `usePoll` hook:

```tsx
import { usePoll } from "../lib/usePoll";

const { status, details, loading } = usePoll<MyData>("/api/my-data");
```

4. **If the panel needs validation**, import from `src/lib/input-validation.ts`.

5. **Export from an index barrel** if desired — add to `src/components/index.ts`.

---

## Testing

Tests are written with Vitest and @testing-library/react.

```bash
# Run tests
npx vitest

# Run with coverage
npx vitest --coverage

# Run in watch mode
npx vitest --watch
```

Test files should be co-located with their components as `*.test.tsx` files.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `""` (relative) | Base URL for the API server. Set this when the dev server and API are on different origins. |

Create a `.env.local` file in the project root for local overrides:

```
VITE_API_URL=http://localhost:8787
```

---

## License

Private — ANTIGRAVITY platform. All rights reserved.
