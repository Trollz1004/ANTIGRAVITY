# Business Exchange

A serious B2B marketplace and deal-management platform for founders and operators. Supports services, projects, referrals, and business acquisitions with a unified deal engine, verification, and admin tooling.

## Features

- **Multi-type Marketplace**: Services, Projects, Referrals, Business Sales, Asset Sales
- **Unified Deal Engine**: Single pipeline for all deal types with type-specific workflows
- **Verification System**: Business registration, tax ID, identity, proof of funds, domain ownership
- **Admin Dashboard**: Audit logs, user management, platform health
- **Real-time Messaging**: Per-deal threaded conversations
- **Ollama Cloud AI Assist**: Server-side proxy for gemma3:27b (API key never in browser)
- **Email/Password Auth**: JWT in HttpOnly cookies, bcrypt hashing
- **Dark/Light Theme**: Nexus palette (warm beige + Hydra teal)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT + HttpOnly cookies + bcrypt
- **AI**: Ollama Cloud (gemma3:27b) via server proxy
- **Styling**: Custom design system (Nexus palette, Instrument Serif + Inter)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Ollama Cloud API key

### Installation

```bash
# Clone and install
cd business-exchange
npm install

# Set up environment
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, OLLAMA_CLOUD_API_KEY, etc.

# Set up database
npm run db:generate
npm run db:push

# Development
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/business_exchange"
JWT_SECRET="your-secure-random-string-min-32-chars"
OLLAMA_CLOUD_API_KEY="your-ollama-cloud-api-key"
OLLAMA_CLOUD_MODEL="gemma3:27b"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASS="pass"
EMAIL_FROM="noreply@businessexchange.local"
ADMIN_ALERT_EMAIL="admin@businessexchange.local"
NODE_ENV="development"
```

## Project Structure

```
business-exchange/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Login, Register
│   │   ├── (dashboard)/       # Main app pages
│   │   │   ├── dashboard/     # Marketplace home
│   │   │   ├── explore/       # Browse listings
│   │   │   ├── listings/      # Listing CRUD
│   │   │   ├── pipeline/      # Deal pipeline (Kanban)
│   │   │   ├── messages/      # Per-deal messaging
│   │   │   ├── my-listings/   # User's listings
│   │   │   └── verification/  # Verification center
│   │   ├── (admin)/           # Admin pages
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Register, login, logout, me
│   │   │   ├── assist/        # Ollama Cloud proxy
│   │   │   ├── listings/      # Listing CRUD
│   │   │   ├── deals/         # Deal CRUD
│   │   │   ├── messages/      # Messaging
│   │   │   ├── connectors/    # Connector management
│   │   │   └── admin/         # Admin APIs
│   │   ├── globals.css        # Global styles + design tokens
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Redirect to dashboard/login
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   ├── layout/            # Sidebar, Header, DashboardLayout
│   │   ├── marketplace/       # ListingCard, ListingForm, Filters
│   │   ├── deals/             # Pipeline (Kanban)
│   │   └── admin/             # Admin components
│   ├── lib/
│   │   ├── env.ts             # Environment config
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # JWT, password hashing
│   │   ├── ollama.ts          # Ollama Cloud client (server-only)
│   │   ├── connectors.ts      # Connector management
│   │   ├── audit.ts           # Audit logging
│   │   ├── email.ts           # Email sending
│   │   └── utils.ts           # Utilities
│   └── middleware.ts          # Auth protection
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── .env.example
```

## Design System (Locked)

- **Colors**: Nexus warm beige (#f7f6f2) + Hydra teal (#01696f)
- **Typography**: Instrument Serif (headings) + Inter (body) + JetBrains Mono (code)
- **Spacing**: 4px base unit
- **Radii**: 4-16px (tight)
- **No gradients, no purples, no cold blues**
- **Equal visual treatment for all 5 listing types**

## Hard Rules

1. **Public copy stays business-focused** - customer surfaces describe product value only
2. **5 listing types exactly**: SERVICE, PROJECT, REFERRAL, BUSINESS_SALE, ASSET_SALE
3. **Ollama Cloud only via server proxy** - API key never in browser
4. **Equal visual treatment** for all listing types
5. **Self-hosted only** - no managed auth, MinIO for files, Cloudflare Tunnel

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## Deployment

- **Self-hosted**: Docker, Railway, Render, or VPS
- **Database**: PostgreSQL (Neon, Railway, Supabase, or self-hosted)
- **Files**: MinIO (self-hosted S3-compatible)
- **Ingress**: Cloudflare Tunnel only
- **No public IP** - always behind Cloudflare

## License

Private - All rights reserved.