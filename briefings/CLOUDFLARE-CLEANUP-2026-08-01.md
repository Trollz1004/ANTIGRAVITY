# Cloudflare cleanup — found 2026-08-01

Everything here was verified by fetching content, never by status code. All of
it needs `wrangler login` first — the auth token is expired and nothing local
can push a Cloudflare change until that runs in an interactive terminal.

```
wrangler login
```

---

## 1. URGENT — a zombie site is contradicting the brand in public

**`for-the-kids-backend.joshlcoleman.workers.dev` returns HTTP 200** and serves
a 7.7 KB abandoned build of the dating app, last modified **2026-01-05 (208
days)**. It is publicly reachable by anyone with the URL.

What it says:

| It serves | The live brand says |
|---|---|
| `You & I Not AI - AI-Powered Dating` | `Human Connection. No Bot Noise.` |
| "Building authentic connections through **AI-powered compatibility**" | "real people. zero bot noise." |
| — | Match screen: "You & Sarah. **Not AI.**" |

It also carries a `CHOOSE YOUR PLAN` pricing block. So a stale page is
advertising plans for a product positioned as the opposite of what it sells,
under a worker named "for-the-kids".

Two problems at once: brand contradiction, and mission-named infrastructure on
a public surface, which the doctrine keeps off customer-facing surfaces.

```
wrangler delete --name for-the-kids-backend
```

Or, if the name is worth keeping, remove only the public route:

```
wrangler triggers deploy --name for-the-kids-backend   # after removing workers_dev = true
```

---

## 2. Publicly erroring

**`cloud-run-proxy`** (172 days) returns a Google Cloud Run **503 "The service
you requested is not available yet."** It is proxying to a backend that no
longer exists. Anyone hitting it sees a Google error page.

```
wrangler delete --name cloud-run-proxy
```

---

## 3. Every Worker is stale — none touched in 60+ days

| Worker | Last modified | Age | Public root |
|---|---|---|---|
| `paperclip-hq` | 2026-04-28 | 95d | 404 |
| `paperclip` | 2026-04-09 | 114d | 404 |
| `gemini-proxy` | 2026-04-09 | 114d | 404 |
| `for-the-kids-api` | 2026-04-09 | 114d | 404 |
| `cloud-run-proxy` | 2026-02-10 | 172d | **503 erroring** |
| `dating-dao-api-gateway-production` | 2026-01-11 | 202d | 404 |
| `ai-store-webhook` | 2026-01-05 | 208d | 405 (live, POST-only) |
| `for-the-kids-backend` | 2026-01-05 | 208d | **200 — zombie site** |

All are reachable on `*.joshlcoleman.workers.dev`. The 404s are live workers
with no root route — they are running, just not answering `/`.

`dating-dao-api-gateway-production` is worth a decision: the DAO is paused
pending attorney review, but a production-named DAO gateway is deployed.

---

## 4. Cloudflare Pages — three stale shadows

| Project | State |
|---|---|
| `youandinotai` | Live but serves an **older build** than the apex. The apex is served by the cloudflared tunnel, not this Page. Orphaned shadow. |
| `yni-landing` | A second, competing landing page with a different title than production. |
| `antigravity-mission-control` | Contains literal placeholder text. Meanwhile the real Mission Control runs locally on :3151 with no public route. |
| `onlinerecycle` | Live, but `onlinerecycle.org` is **NXDOMAIN** — the Page is orphaned from any domain. |
| `paperclip` | Live. |

---

## 5. Subdomain ingress is missing

Every `*.youandinotai.com` subdomain returns **530 / error 1033** — hermes,
workspace, mission-control, paperclip, paperclip-clean. Only the apex and `www`
resolve.

This is not a dead origin: Mission Control **is** listening on :3151. The live
tunnel (`t5500`, remotely managed from the dashboard) simply has no ingress
rule for those hostnames. `hermes-t5500.yml` has 7 ingress rules but declares a
different tunnel ID (`68a2e766…`) that has zero active connections — it is a
dead config file.

Fix in the Cloudflare dashboard: Zero Trust → Networks → Tunnels → `t5500` →
Public Hostnames, adding each subdomain to its local port.

---

## 6. Domains that no longer exist

Six are **NXDOMAIN** — no A record, no nameserver delegation. Lapsed or never
registered:

- `aidoesitall.info`, `aidoesitall.online`, `aidoesitall.store`
- `untilnokidinneed.org`, `untilnokidinneed.online`, `untilnokidinneed.store`

Five more are **IONOS registrar parking pages**, byte-identical to each other
(same md5), with an empty `<title>`, German text, and broken HTTPS:

- `onlinerecycle.net`
- `dream-online.net`, `.org`, `.info`, `.store`

`untilnokidinneed.com` is Cloudflare-proxied with a **missing origin** (error
1001). `aidoesitall.website` returns **403 error 1034 "Edge IP Restricted"** —
it resolves to a Cloudflare IP the account does not own.

**Of fifteen domains, two serve real content:** `youandinotai.com` and
`ai-solutions.store`.
