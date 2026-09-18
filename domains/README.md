# Domains

One folder per domain, per Joshua's 2026-09-17 ruling that everything on this
node lives in one repo with one folder for domains and their files. This is
part 1 of the consolidation: satellite repos folded in with history, and the
already-local landing pages moved here. Part 2 moves the date-app code itself
and retires the surviving `apps/landing` shell.

**onlinerecycle.net** (`domains/onlinerecycle.net/`) is the Central Florida
electronics recycling app, folded in with full history from
`Trollz1004/OnlineRecycle`. As of the last live check (2026-09-03), the domain
itself is broken: `https://` refuses the connection and `http://` only serves
an IONOS parking page, so the real storefront customers use today is
`onlinerecycle.square.site`, not this domain. State: **off-node / DNS broken**.

**ai-solutions.store** (`domains/ai-solutions.store/`) is the live digital
products and automation marketplace, on Cloudflare with working HTTPS. It
folds in three source repos with history: `ai-solutions` at the folder root
(blog, revenue-catalog), `Ai` at `Ai/` (a large historical mirror of doctrine,
briefings, and archived node content — not a placeholder), and the Jules
code-review dashboard at `jules-code-review-dashboard/`. Its former
`crosslisting-os/` subfolder moved to `mission-control/crosslisting-os` in
this same pass; a pointer README is left where it was. State: **live**.

**untilnokidinneed.com** (`domains/untilnokidinneed.com/`) is a static
landing page, moved here from `apps/landing/untilnokidinneed`. Per
`docs/ops/DNS-NAMESERVER-PLAN.md`, the domain currently sits on IONOS default
nameservers with a stray A-record causing a Cloudflare 1001 error; the
Cloudflare cutover described in that plan has not happened yet. State:
**code present / DNS not yet live**.

**dream-online.net** (`domains/dream-online.net/`) is the DREAM Online game's
static landing page, moved here from `apps/landing/dream-online`. The domain
itself currently resolves only to an IONOS parking page (no HTTPS); the
landing page in this folder is not yet what the domain serves. State: **code
present / DNS not yet live**.

**youandinotai.com** (`domains/youandinotai.com/`) is the You and I, not AI
dating app. Its code moved here in part 2 of the consolidation, 2026-09-17:
`domains/youandinotai.com/backend` (was `backend/fastapi-app`) and
`domains/youandinotai.com/frontend` (was `frontend/react-app`), reachable
through a Cloudflare tunnel mapping the domain to `:3200` and `api.` to
`:8000`. State: **live and frozen** — for sale as of 2026-09-16 per
`ops/sale/YOUANDINOTAI-SALE-LISTING.md`; keep it up, change nothing else.

**aidoesitall.website** (`domains/aidoesitall.website/README.md`, pointer
only) has no app code in this repo. Its apex and `www` are verified live on
Cloudflare, redirecting to `ai-solutions.store`; `api.` routes to a Cloudflare
Worker and `dashboard.` is named elsewhere in the repo as a customer-support
surface. Its deeper purpose is explicitly unverified in the repo's own DNS
planning doc. State: **redirect live / no dedicated app**.

Not folded here: `Trollz1004/llc-crosslisting-os` and
`Ai-Solutions-Store/llc_crosslisting_os`, both superseded by the
`crosslisting-os` code already folded into `ai-solutions.store` on
2026-09-03 (now at `mission-control/crosslisting-os`) — see the
consolidation report for the file-count and content comparison that
confirmed neither duplicate holds anything unique.
