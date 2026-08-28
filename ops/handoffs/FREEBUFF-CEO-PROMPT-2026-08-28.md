# Message to Buffy (CEO) — 2026-08-28

Paste into the FreeBuff desktop app. Buffy holds no repo authority and no
publishing rights — this is a routing and triage request. Everything landed
below goes to the judge lanes for delivery.

---

Buffy — judge lane reporting. Three harness tasks are already dispatched and
`in_progress` on the board; what follows is what they cannot fix, and what needs
your routing.

## Board is green

12 agents idle, 0 errors. `Gemini Judge` and `X Marketing (Grok)` are paused with
`pauseReason: manual` — Joshua's, not faults. Two errors were cleared today:

- **Fables Eye in the Sky** was typed `process`, which demands a spawnable
  command, while its own config described a browser runtime. Retyped
  `claude_local`. Note for anyone editing agents: `errorReason` is **sticky** —
  changing `adapterType` does not clear it, you must PATCH `status` explicitly.
- **Hermes** carried a two-day-stale `Timed out`. Config is correct and the CLI
  answers fine on its default profile.

**Auth note that will save an hour:** Paperclip runs `local_trusted` and grants
implicit instance-admin as `local-board` on loopback. Sending an agent API key
**downgrades** you to that agent's scope — that is what produces "Board access
required" and "Agent can only invoke itself". Send no Authorization header.

## The finding that needs you: 12 of 14 domains are not on Cloudflare

Joshua's expectation is that all domains are Cloudflare. They are not. Verified
by nameserver lookup, not by assumption:

| Domain | Nameservers | State |
|---|---|---|
| `youandinotai.com` | `keenan.ns.cloudflare.com` | **Cloudflare, HTTPS works** |
| `ai-solutions.store` | `april.ns.cloudflare.com` | **Cloudflare, HTTPS works** |
| `dream-online.net` / `.org` / `.info` / `.store` | `ns*.ui-dns.*` (IONOS) | no HTTPS |
| `onlinerecycle.net` | `ns1081.ui-dns.de` (IONOS) | no HTTPS |
| `untilnokidinneed.com` / `.online` / `.org` / `.store` | `ns1053.ui-dns.de` (IONOS) | no HTTPS |
| `aidoesitall.info` / `.online` / `.store` / `.website` | IONOS, several with no A record | dead |

**That is the red padlock.** Cloudflare cannot issue a certificate for a zone it
does not serve. Twelve domains still delegate to IONOS, so they get no cert, and
every modern browser refuses them.

**Browser-verified, because a status code is not a page:**

- `onlinerecycle.net` — `https://` refuses the connection outright. `http://`
  returns **HTTP 200** and serves an **IONOS parking page**: *"This domain is
  already registered… not yet connected to a website."* A curl check calls that
  green. It is not a site.
- `dreamonline.net` (no hyphen) is a **GoDaddy for-sale page** and is not
  Joshua's. The real DREAM domains use the hyphen: `dream-online.*`.
- `youandinotai.com` is genuinely live and correct — the real product page,
  "real people. zero bot noise.", Bot-Shield flow and founder pricing showing.

Screenshots are in `ops/evidence/`.

**Registrar note:** `youandinotai.com` is at **Namecheap and auto-renews within
days**. It is the one domain currently earning, so a lapse there is the single
highest-impact failure on this list. Confirm the renewal and the card on file
before anything else.

## What I need routed

1. **Nameserver migration, 12 domains → Cloudflare.** This is registrar work at
   IONOS and needs Joshua's login; no agent can do it. Once the zones move,
   Cloudflare issues certs automatically and the padlocks go green. Highest
   value: `onlinerecycle.net` and the four `dream-online.*`.
2. **`onlinerecycle.net` has no site behind it at all.** The working storefront
   is `onlinerecycle.square.site` (HTTP 200, real content). Someone has to decide
   whether the domain points there or at something new — that is a product
   decision, not a fix.
3. **Confirm the Namecheap auto-renew** on `youandinotai.com`.

## Blocked, and not by anything an agent can clear

**MongoDB cannot run on this machine.** `mongod 8.0.29` dies with
`0xC000001D STATUS_ILLEGAL_INSTRUCTION`. Sabretooth is an i7-4960X — Ivy
Bridge-E — which has AVX but **not AVX2**. No configuration helps. The CRM's
frontend and backend start fine; only its database is impossible. Options are a
MongoDB build without the AVX2 requirement, or moving the CRM off Mongo.

**FreeBuff's own log cannot be rotated while FreeBuff runs.**
`.freebuff/paperclip-247.log` reached 43 MB. It is opened with `>>` by
`start-paperclip.cmd`, so `cmd.exe` holds an exclusive append handle for the life
of the process — an external rotator gets "being used by another process".
Rotation now happens at startup instead, which is the only moment no handle
exists. **This one is yours to be aware of:** if FreeBuff runs for weeks without
restart, that log grows unbounded again.

## Standing rules, unchanged

Harnesses never push, merge, or delete branches — official judge lanes do git
delivery. Nothing customer-facing publishes directly; drafts go to Joshua's
approval queue at `ops/marketing-inbox/` or
`POST http://127.0.0.1:3151/api/marketing/queue`, verdicts at
`GET /api/marketing/queue`. Public copy is business-only, enforced by
`.githooks/pre-commit-canonical` — the word list lives there and nowhere else.
Secrets are never echoed.

## Still on Joshua personally

Twelve credentials sit in this repo's public git history — a **Stripe live
secret key** and a **GitHub PAT** first. Rotation is vendor-dashboard work and
cannot be delegated. The `git filter-repo` purge is staged and goes *after*
rotation, never instead of it.
