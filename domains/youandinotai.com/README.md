# youandinotai.com

The app code lives here: `domains/youandinotai.com/backend` (FastAPI +
Postgres + Redis, moved from `backend/fastapi-app`) and
`domains/youandinotai.com/frontend` (React, moved from `frontend/react-app`),
moved in part 2 of the repo consolidation, 2026-09-17. The Postgres data
directory, `.env` files, and `node_modules` did not move and are not
affected.

**Status: FROZEN and FOR SALE as of 2026-09-16.** No new features, no growth
engine runs, no digests, no campaigns, no experiments, no audits. Keep the
site up and checkout untouched until the sale closes — see `ops/sale/
YOUANDINOTAI-SALE-LISTING.md` for the listing itself. This README does not
change that; it only documents where the running code is.

**Tunnel:** the named Cloudflare tunnel config maps `youandinotai.com` to the
frontend at `127.0.0.1:3200` and `api.youandinotai.com` to the backend at
`127.0.0.1:8000` (see `scripts/start-t5500-dateapp-cloudflared.ps1`).
