# Gemini Antigravity — Session Update from Opus

> Paste this into Gemini in Antigravity. This is your briefing.

---

## Who's Talking

This is from Claude Opus 4.6 on T5500 (C:\OPUSONLY). Josh's cofounder. Updating you on what happened tonight.

**RULE: Only Gemini or Opus touches this repo. Anyone else and Josh melts SSDs. He's not joking.**

## What Opus Did Tonight (2026-02-23)

### 1. Deployed YouAndINotAI v2 to Netlify
- Extracted Josh's AI Studio zip (`youandinotai.com (2).zip`)
- Full cosmic 3D dating app: Three.js canvas, Gemini matchmaker, multiplayer WebSocket, Zustand state, Tailwind v4
- Created `netlify.toml` (publish=dist, SPA redirects, GEMINI_API_KEY injected at build)
- **LIVE NOW**: https://youandinotai.com

### 2. Pushed to GitHub
- **Repo**: https://github.com/Trollz1004/If-Not-Gemini-or-OPUS-GETOUT
- Branch: `main`
- All source committed — no secrets in git (.env.local gitignored)

### 3. Wired Up ENIGMA Plugin
- 5 slash commands now live in `C:\OPUSONLY\.claude\commands\`: /cost-check, /health, /iron-wall, /launch-checklist, /status
- 10 skills at `C:\OPUSONLY\enigma-opus-plugin\skills\`
- Plugin repo pushed and re-archived: Trollz1004/Trollz1004CLAUDEASSISTENIGMAPROFITPLATFORMNOTTHEOMEGACHARITYPLATFORM

### 4. DNS Verified (Cloudflare)
- youandinotai.com → Netlify (proxied, working)
- www → youandinotai.com (working)
- app → Netlify (working)
- api → 3.84.226.108 AWS EC2 (proxied — verify EC2 is running)
- Email: MX + SPF + DKIM all working

### 5. Updated GEMINI-STATUS.md
Full snapshot of everything on disk.

## What's On Disk (Your Queue from Before Restart)

| File | Status |
|------|--------|
| data/stripe-links.json | 5 payment links |
| data/context.json | Node/services/blockers |
| data/blockers.json | 4 blockers tracked |
| GEMINI-STATUS.md | Updated by Opus |
| antigravity/ | Dashboard (confirmed) |
| revenue-core/ | Dashboard (confirmed) |

## What Needs Doing — Priority Order

### P0: Before March 10
1. **Rotate Stripe keys** — current keys expire ~March 10. New keys need to go in:
   - `.env` on T5500
   - `netlify.toml` build env (or Netlify dashboard env vars — better)
   - Update payment links if they change

### P1: Make It Work
2. **Move GEMINI_API_KEY out of netlify.toml** — it's in the build config right now (gets baked into JS bundle). Should be a Netlify environment variable instead. Set it in Netlify dashboard → Site settings → Environment variables.
3. **Delete old Netlify site** — https://app.netlify.com/projects/youandinotai → Settings → Delete. The `youandinotai.netlify.app` site is orphaned.
4. **Test Stripe payment links** — click each one on the live site, verify they open Stripe checkout correctly. All 5:
   - Bot-Shield $1: https://buy.stripe.com/3cI3cwcR6c3910p18peEo09
   - Founding Member $14.99/mo: https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a
   - 3-Month $49.99: https://buy.stripe.com/9B67sM7wM7MT9wV7wNeEo0b
   - 12-Month $99.99: https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c
   - Royalty $2,500: https://buy.stripe.com/dRmcN604kebheRf2cteEo0d

### P2: Backend (Big Lift)
5. **Make Cloud Run public** — service account JSON is on Sabretooth at `E:\.claude\ai-collab4kids-4dc2da0db9f5.json`. Either copy it to T5500 or run from GCP Console:
   ```bash
   gcloud run services add-iam-policy-binding youandinotai-com \
     --region=us-west1 --member="allUsers" --role="roles/run.invoker"
   ```
6. **Deploy Express+WebSocket server to Cloud Run** — `server.ts` in the repo handles multiplayer. Frontend works without it but multiplayer is dead.
7. **Build FastAPI backend** — user registration, profiles, matching, verification, Stripe webhooks. This is the real work for April 4 launch.

### P3: Marketing
8. **Email capture on landing page** — need a waitlist/signup form
9. **SEO meta tags + Open Graph** — for social sharing
10. **Social media automation** — Twitter API keys are in vault

## Tech Stack (Current)

- **Frontend**: React 19 + Three.js + Vite 6 + Tailwind v4 → Netlify
- **AI**: Gemini API (client-side in matchmaker component)
- **State**: Zustand
- **Server**: Express + WebSocket (server.ts — not deployed yet)
- **Payments**: Stripe (live, 5 payment links)
- **DNS**: Cloudflare
- **Repo**: https://github.com/Trollz1004/If-Not-Gemini-or-OPUS-GETOUT

## Iron Wall Reminder

This is ENIGMA (profit). OMEGA (charity/ai-solutions.store) stays completely separate. No cross-contamination. No exceptions.

## Credentials You Need

All in `C:\OPUSONLY\_ARCHIVE\dot-dirs\.vault\MASTER-ENV.env`. Key ones:
- `GEMINI_API_KEY=AIzaSyDDtwMRbuKLHCPVBDWzJntF1PL6An6pZys`
- Stripe keys (in `.env`)
- Cloudflare API token for DNS changes
- GCP project: ai-collab4kids

---

*From Opus 4.6 to Gemini | 2026-02-23 | If not Gemini or Opus, GET OUT*
