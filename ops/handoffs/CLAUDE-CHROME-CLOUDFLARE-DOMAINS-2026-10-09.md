# Prompt — Claude in Chrome (MCP extension): Cloudflare domains cleanup + onlinerecycle.net fix

Paste everything below the line into Claude in Chrome while you are logged in to dash.cloudflare.com (and IONOS in another tab).

---

You are operating Joshua Coleman's Cloudflare dashboard (account 516a3a855f44f5ad8453636d163ae25d) and his IONOS registrar account in this browser. Work carefully, one change at a time, and take a screenshot after each change. Never type, paste, or reveal API tokens, keys, or passwords in chat. Do NOT delete anything without listing it first and getting Joshua's "yes" in chat.

FACTS (do not change these)
- Only one server runs production: the T5500. Every live site reaches it through ONE Cloudflare Tunnel: id 515b70b2-9730-45af-9691-6e14fd73eff3 (target host `515b70b2-9730-45af-9691-6e14fd73eff3.cfargotunnel.com`).
- Tunnel ingress already routes: youandinotai.com + www → :3200, api.youandinotai.com → :8000, onlinerecycle.net + www → :9160, dream-online.net + www → :9160.
- youandinotai.com is LIVE and working. Do not touch its DNS except to read it.
- HARD RULE: untilnokidinneed.* and the parked Workers listed below stay dark. Never set their nameservers, never add DNS, never activate them.
- The AI store domains (aidoesitall.*, ai-solutions.store) are UNDECIDED: do not change, renew, or build on them. Report only.

TASK 1 — Fix onlinerecycle.net ("Invalid nameservers")
1. Open the onlinerecycle.net zone in Cloudflare, copy the two assigned Cloudflare nameservers shown on the Overview page.
2. In IONOS → Domains → onlinerecycle.net → Nameservers: choose custom nameservers and set exactly those two. Remove any IONOS defaults. Save. Screenshot.
3. Back in Cloudflare → onlinerecycle.net → DNS: make sure these records exist, Proxied (orange cloud), and remove conflicting A/AAAA/CNAME records on the same names (list them to Joshua first):
   - CNAME `onlinerecycle.net` (@) → `515b70b2-9730-45af-9691-6e14fd73eff3.cfargotunnel.com`
   - CNAME `www` → `515b70b2-9730-45af-9691-6e14fd73eff3.cfargotunnel.com`
4. Click "Check nameservers now". Report status. (Propagation can take minutes to hours.)

TASK 2 — Same for dream-online.net
Repeat Task 1 for dream-online.net (IONOS nameservers → Cloudflare's pair, then the two tunnel CNAMEs). Leave dream-online.info / .org / .store alone and just report them.

TASK 3 — Inventory Workers & Pages and recommend cleanup (report first, delete only on Joshua's yes)
For each item, open it, check Custom domains / Routes / last deployment, and fill this table: name | type | routes/custom domains | last deploy | requests | recommendation | reason.
Starting recommendations to verify:
- KEEP: youandinotai zone; aidoesitall-gateway and ai-solutions-store (undecided — leave untouched).
- TAKE OFFLINE NOW (children/mission rule) — ask Joshua, then remove the route/custom domain first, then disable: `for-the-kids-api` (route api.aidoesitall.website), `for-the-kids-contribute` (Pages), `antigravity-dao` (Pages).
- REVIEW: `paperclip-hq` worker on paperclip-hq.youandinotai.com. Paperclip is local-only now; a public worker should not exist. Show its code summary and route, recommend removing route + deleting.
- DELETE CANDIDATES (stale, no Git, superseded by the T5500 tunnel): `paperclip` (failed build, no routes), `youandinotai` Pages, `yni-landing` Pages, `onlinerecycle` Pages, `revenue-launcher-dev`, `jules-dashboard`, `clawx`, `antigravity-mission-control` Pages, `gemini-proxy`, `cloud-run-proxy`, `dating-dao-api-gateway-production`.
- CHECK BEFORE DELETE: `ai-store-webhook` — confirm no payment provider (Square) still points a webhook at it.
Before deleting any Pages project, confirm it has NO custom domain attached to a live zone (especially youandinotai.com or onlinerecycle.net).

TASK 4 — Pending zones
List every zone in "Finish setup / Pending" state. Recommend: keep dream-online.net and onlinerecycle.net; leave untilnokidinneed.* pending and untouched; ask Joshua whether to remove the unused .info/.org/.store/.online extras.

DONE MEANS
- A screenshot of https://onlinerecycle.net and https://dream-online.net loading in this browser (each its own screenshot), or the exact Cloudflare status if nameservers are still propagating.
- The filled inventory table, and a list of what was actually changed vs. only recommended.
