# youandinotai.com

The app code has not moved yet — this is a pointer, not the app. Part 2 of
the repo consolidation moves it; until then it lives at `backend/fastapi-app`
(FastAPI + Postgres + Redis) and `frontend/react-app` (React), both at the
repository root.

**Status: FROZEN and FOR SALE as of 2026-09-16.** No new features, no growth
engine runs, no digests, no campaigns, no experiments, no audits. Keep the
site up and checkout untouched until the sale closes — see `ops/sale/
YOUANDINOTAI-SALE-LISTING.md` for the listing itself. This README does not
change that; it only documents where the running code is.

**Tunnel:** the named Cloudflare tunnel config maps `youandinotai.com` to the
frontend at `127.0.0.1:3200` and `api.youandinotai.com` to the backend at
`127.0.0.1:8000` (see `scripts/start-t5500-dateapp-cloudflared.ps1`).
