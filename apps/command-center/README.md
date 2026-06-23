# ANTIGRAVITY Command Center

**AI content approval desk. Social command center for content review, platform launch links, and Josh-approved posting.**

## Quick Start

```bash
cd apps/command-center
npm install
npm run dev
```

Runs on `http://localhost:3000`

## Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + Lucide icons
- **Deployment**: Vercel or Docker

## Environment Variables

See `../../.env.example` for all required vars.

## Operating Boundary

This app is a private admin surface. It is not a public landing page.

- Codex remains the CEO/decision lane.
- Hermes is the marketing operator and can draft X/Grok, YouTube, and campaign content.
- FCC, GenSpark Claw, AutoClaw, and Z.ai OpenClaws are worker lanes for drafts, scans, and packaging.
- Official OpenClaw is customer support only and must not be used as the marketing/posting wrapper.
- The app never auto-posts to third-party platforms. It stores drafts, lets Josh approve, and opens the right platform for manual posting.
- Public content stays business-only: membership, verification, support, safety, uptime, matching quality, account access, pricing, checkout, refunds, and receipts.

## Hermes Draft Flow

The `/api/hermes/draft` route is the MCP seam. It returns a safe draft payload that the UI can place in the approval inbox. Wire the actual Hermes MCP/9020 bridge behind that route later without changing the approval UI.
