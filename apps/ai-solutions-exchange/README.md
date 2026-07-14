# AI Solutions Exchange — Local Development Guide

Next.js 14 (App Router) app shell for a marketplace for sourcing and
delivering AI solutions and services. Currently a static UI scaffold
(TRO-296) — no database, API routes, or auth are wired up yet.

## 1) Prerequisites

- Node.js 20+
- `npm`

## 2) Install dependencies

```bash
cd apps/ai-solutions-exchange
npm install
```

## 3) Environment variables

None required. The app has no backend integration yet — no `.env` file
exists or is needed to run it locally.

## 4) Run locally

```bash
npm run dev
```

Starts the dev server on **http://localhost:3060** (see the `-p 3060` flag
in `package.json`).

## 5) Other commands

```bash
npm run build   # production build
npm run start   # serve the production build on :3060
npm run lint    # next lint (extends next/core-web-vitals)
```

CI (`.github/workflows/ai-solutions-exchange-ci.yml`) runs `npm run lint`,
`npx tsc --noEmit`, and `npm run build` on every push/PR touching this app.

## 6) Project structure

```
apps/ai-solutions-exchange/
├── src/
│   ├── app/
│   │   ├── page.tsx           # home
│   │   ├── dashboard/page.tsx
│   │   ├── listings/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/ui/         # shadcn/ui-style components (button, card)
│   └── lib/utils.ts
├── components.json            # shadcn/ui config (aliases: @/components, @/lib/utils)
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## 7) Notes

- UI components follow the shadcn/ui pattern (`components.json`); add new
  components under `src/components/ui/`.
- No database or Prisma schema exists in this app yet. If/when a backend is
  added, update this section with connection setup and required env vars.
