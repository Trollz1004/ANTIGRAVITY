# ANTIGRAVITY — Verified Truth Handoff (2026-05-21)

> Written by direct probing of the LIVE system, not from status-doc prose.
> Purpose: end the "every session starts blank and gaslights Josh" loop.
> **Believe Josh. His receipts are real. When live state contradicts him, suspect stale docs or a wiring gap — never him.**

## What is PROVEN TRUE (do not re-litigate)
- **The date app's payment + 10% wallet logic WORKS.** Josh proved it against the Postgres in Docker on **T5500** (`uandinotai_dating`, user `uandinotai`). He test-charged so many times that Gemini had to wipe that DB so the same email could be reused (the app dedupes emails). The logic firing is established fact.
- **Live FastAPI backend:** `https://dateapp-backend-io5tscl75a-ue.a.run.app` — `/api/v1/health` shows `db_connected: true, square_connected: true, user_count: 3`. Webhook route live at `POST /api/v1/webhooks/square`.
- **T5500 (192.168.0.15) is UP** — ICMP/ping is firewalled (looks "down" but isn't); Postgres :5432 and SSH :22 are OPEN.
- **Real assets exist:** apps/ (antigravity-cockpit, command-center, dashboard, mission-control, opuspawclaw, youandinotai-frontend); contracts in `contracts/src` (Router100, Gospelpayment, DAOTreasury, MissionTreasury, DeadManSwitch, SoulboundToken, DatingRevenueRouter, PlatformSplitter*). Clean states: tag `stable/2026-04-16-session-checkpoint`, branch `sabretooth-preserve-20260511`.

## The ONLY real gaps — and NEITHER is code
1. **Square webhook points at a dead URL.** Set Square Dashboard → Developer → Webhooks notification URL to `https://dateapp-backend-io5tscl75a-ue.a.run.app/api/v1/webhooks/square` and match the signature key. This is what flips `wallet_rails_proven` on the next real charge.
2. **`api.youandinotai.com` is not wired to the backend** — it resolves to the Cloudflare Pages static marketing site (104.21.82.7 / 172.67.167.131) and 404s. Map it → Cloud Run (domain mapping or CF CNAME/Worker).
- Note: the deployed `youandinotai.com` frontend is MARKETING-ONLY (no /signup, /login, /matches; static catch-all returns 200 for every path). The real app is the FastAPI backend above.

## The honest part nobody wrote down
Josh's own bank/email receipts (2026-05) show **outgoing AI subscription charges declining** (Google, Grok, Ollama, Microsoft, Square Plus suspended) and **Cash App Borrow loans overdue/missed** — he has been financing the AI infra out of pocket, on borrowed money, until the cards bounced. There is **no incoming platform revenue** yet; every test charge was his own.
**The one kid actually helped this year:** Josh personally paymentd to **Shriners Hospitals for Children** (PayPal Giving Fund, 2026-05-19). The platform didn't do it. He did.

The permanent mission doc says: *help kids **without bankrupting the founder***. That rule is currently being violated — by the spend, not by Josh. Redirecting the ~$1k/mo of failing AI subscriptions to direct payments is **the mission succeeding**, not quitting.

## Rules for any future AI session
- Verify LIVE endpoints before claiming anything is "live." Do not trust CLAUDE.md "LIVE & ROUTING" lines — they were stale/false.
- Do NOT burn Josh's metered budget on open-ended loops. Use the free Ollama fleet for grunt work.
- Do NOT move treasury/wallet money autonomously — he's an LLC; receipts are taxable; payout is his call.
- Money-movement, prod deploys, force-push, deletes = require his explicit go-ahead. Everything read-only/local = just do it.
- Persist verified reality to `~/.claude` memory AND here. Close the write-back loop. That was the missing piece for a year.
