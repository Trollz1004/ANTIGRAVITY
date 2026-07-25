# DEPLOY LAUNCH COPY (1k Verified Humans Campaign)

## Current State
- Source: apps/youandinotai-static/index.html updated with 1k launch meta + noscript (1,000 verified humans, $1 Bot-Shield, $14.99 Founding locked, DAO link).
- Frontend source (youandinotai-frontend) has prior founding hero/CTA edits.
- Live: https://youandinotai.com still serves old shell (only "Bot-Shield" visible per curl).
- X: Revival thread ready in paperweight + marketing/POST-NOW-X-Wave1-Thread1.txt

## Deploy Steps
1. Ensure changes in apps/youandinotai-static/index.html are committed/pushed.
2. Build static if needed: cd apps/youandinotai-static && pnpm build (or equivalent).
3. Deploy the output (dist or public) to the serving platform (Cloudflare, etc. for youandinotai.com).
4. For full app: Build and deploy youandinotai-frontend.
5. Purge cache at CDN level for youandinotai.com/* .
6. Verify: curl -s https://youandinotai.com | grep -E '1,000 verified|Founding.*14.99'

## Parallel Marketing
- Post the X revival thread (see paperweight task "EXECUTE: Post Bot-Shield revival thread").
- Drive traffic to updated site for Bot-Shield verifications and Founding subs.
- Track to 1k real verified humans.

## DAO
- Transparency already linked in static and frontend to https://dashboard.aidoesitall.website
- Keep product-only, real-or-zero language.

DEPLOYEOF
ls -l DEPLOY-LAUNCH-1k-COPY.md && head -10 DEPLOY-LAUNCH-1k-COPY.md | cat

## Build Status (2026-07-11)
- Frontend: npm run build initiated. Next.js production build started (optimized production build phase).
- Static: index.html already updated with full 1k fallback.
- Next action after successful build: copy .next/static and use updated index.html for deploy to hosting.

## Exact commands (run locally)
cd apps/youandinotai-frontend
npm run build
# Then deploy the .next folder + updated static/index.html to the youandinotai.com hosting (Cloudflare, Vercel, etc.)

# Verify after
curl -s https://youandinotai.com | grep -o 'Join the first 1,000' || echo 'not yet live'
