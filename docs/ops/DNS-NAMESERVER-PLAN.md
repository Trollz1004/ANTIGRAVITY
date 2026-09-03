# DNS / Nameserver Plan — 14 domains (registrar: IONOS)

**Status:** Read-only research, 2026-09-03. Nothing here was committed or executed. Every claim below is labeled **VERIFIED** (command run, shown) or **UNVERIFIED** (no credential to check it).

## Why this exists

`.github/workflows/cloudflare-add-zones.yml` already automates the Cloudflare-side half of an IONOS→Cloudflare migration for 12 of the 14 domains (`ai-solutions.store` and `aidoesitall.website` are already delegated). Per its header comment, `CLOUDFLARE_API_TOKEN` lives **only** in GitHub Secrets — the two OneDrive vault copies are dead (return "Invalid API Token") — so nothing here can call the Cloudflare API directly; the workflow is the only path that can. `.env` has 13 keys, none named `CLOUDFLARE_*` or `IONOS_*` — **VERIFIED** (`grep -oE '^[A-Z0-9_]+=' .env`). Both Cloudflare and IONOS API access are **NOT CONFIGURED** on this workstation.

## Two Cloudflare accounts, not one

Cloudflare assigns each **zone** a nameserver pair drawn from its account's pool; the same account's zones share a small rotating set of pairs, so seeing the same pair twice usually means the same account (an account can have more than one pair in the pool, so this is a strong signal, not an absolute proof). Two *different* pairs across domains that were plausibly added at different times strongly implies two different Cloudflare accounts:

- **Pair A** — `chase.ns.cloudflare.com` / `amy.ns.cloudflare.com` — assigned by IONOS panel to `aidoesitall.info` / `.online` (per Joshua's pasted registrar screen). No live zone answers there today (see table).
- **Pair B** — `april.ns.cloudflare.com` / `keenan.ns.cloudflare.com` — assigned to `aidoesitall.store/.website`, `ai-solutions.store`, and confirmed live and serving for `aidoesitall.website` and `ai-solutions.store`.

**How to tell which account owns which zone, once a token exists:** `GET /zones?name=<domain>` returns the zone's `account.id`; compare across domains. Without a token this is UNVERIFIED — the pair alone is a strong hint, not proof.

## Per-domain findings (live-verified 2026-09-03)

| Domain | Registrar NS (IONOS panel) | Live NS (1.1.1.1 + 8.8.8.8) | SOA | Serves today | Target CF pair |
|---|---|---|---|---|---|
| aidoesitall.info | chase/amy (CF) | **SERVFAIL — no answer** | SERVFAIL | Nothing (curl times out both schemes) | Pair A, once a live zone exists in whichever CF account owns it |
| aidoesitall.online | chase/amy (CF) | **SERVFAIL** | SERVFAIL | Nothing | Pair A |
| aidoesitall.store | april/keenan (CF) | **SERVFAIL** | SERVFAIL | Nothing | Pair B (already the target pair — zone is missing/misconfigured in CF, not a registrar problem) |
| aidoesitall.website | april/keenan (CF) | april/keenan — VERIFIED | primary april.ns.cloudflare.com | HTTP 302 → `https://www.ai-solutions.store/` (Cloudflare, working) | Already correct |
| ai-solutions.store | april/keenan (CF) | april/keenan — VERIFIED | primary april.ns.cloudflare.com | HTTP/HTTPS 301 → `https://www.ai-solutions.store/` (Cloudflare, working) | Already correct |
| dream-online.info | IONOS default ("not in use") | ns1075/1081/1109/1119 (IONOS ui-dns) — VERIFIED | ns1081.ui-dns.de, serial 2017060108 | HTTP 200, `Server: Apache`, `X-WS-Origin: available`, 605912 bytes — **IONOS parking page**, no HTTPS | TBD (see plan) |
| dream-online.net | IONOS default | same IONOS set — VERIFIED | ns1081.ui-dns.de, serial 2017060107 | Same IONOS parking page, no HTTPS | TBD — this is the primary |
| dream-online.org | IONOS default | same IONOS set — VERIFIED | same | Same parking page | TBD — redirect target |
| dream-online.store | IONOS default | same IONOS set — VERIFIED | same | Same parking page | TBD — redirect target |
| onlinerecycle.net | IONOS default | same IONOS set — VERIFIED | same | Same IONOS parking page (identical 605912-byte body — **a 200 is not the recycler app**, per prior note) | TBD |
| untilnokidinneed.com | "DNS modified", A→104.18.26.246 | IONOS ui-dns (ns1020/1053/1081/1090) — VERIFIED | ns1090.ui-dns.org, serial 2017060117 | HTTP **409**, `Server: cloudflare`, body `error code: 1001` (Cloudflare DNS-resolution error — the A record points at a Cloudflare anycast IP but the zone isn't delegated to Cloudflare, so Cloudflare's edge has no config for this hostname) | Pair TBD — primary |
| untilnokidinneed.online | keenan/april (per panel) | **SERVFAIL** | SERVFAIL | Nothing | Pair B, once zone exists |
| untilnokidinneed.org | keenan/april (per panel) | **SERVFAIL** | SERVFAIL | Nothing | Pair B |
| untilnokidinneed.store | keenan/april (per panel) | **SERVFAIL** | SERVFAIL | Nothing | Pair B |

Commands used for every row: `nslookup -type=NS <d> 1.1.1.1`, `nslookup -type=NS <d> 8.8.8.8` (cross-checked, identical results both resolvers), `nslookup -type=SOA <d> 1.1.1.1`, `curl -sI -m 8 https://<d>`, `curl -sI -m 8 http://<d>`.

**Reading the SERVFAIL group:** six domains have registrar-panel NS entries naming Cloudflare (`chase/amy` or `keenan/april`) but public resolvers get SERVFAIL — not NXDOMAIN, not a normal answer. That specific failure mode means the delegation is real (the TLD's authoritative servers do point at those Cloudflare nameservers) but querying those nameservers for the domain fails, which happens when **no zone for that domain exists in any Cloudflare account**, or it exists in an account those specific nameservers don't serve. This matches the prior note that a migration was "blocked on IONOS/youandinotai creds" and a fresh token was never minted to actually add the zones.

## Zone-exists-in-Cloudflare check (UNVERIFIED — no token)

Cannot be checked from here. Once `CLOUDFLARE_API_TOKEN` is minted (Zone:Edit) and stored as a GitHub secret, either:
1. Run `.github/workflows/cloudflare-add-zones.yml` with `dry_run: true` — it calls `GET /zones?name=<domain>` per domain and reports `exists(status)` or `WOULD-ADD`, with zero write risk.
2. Or, for a one-off check, `curl -H "Authorization: Bearer $TOKEN" "https://api.cloudflare.com/client/v4/zones?name=<domain>"`.

## Purpose per domain family

- **dream-online.\* (net/info/org/store):** the game landing page at `apps/landing/dream-online` (README confirmed present). `.net` is primary; `.info/.org/.store` should redirect to `.net`.
- **untilnokidinneed.\* (com/online/org/store):** `apps/landing/untilnokidinneed` (README confirmed present). `.com` is primary; the others redirect to `.com`.
- **ai-solutions.store:** the marketplace. Already live and correct on Cloudflare Pair B.
- **aidoesitall.\* (info/online/store/website):** **UNVERIFIED purpose — ask Joshua.** No landing-page directory found for this name family in `apps/landing/`.
- **onlinerecycle.net:** the recycler app. Currently only the IONOS parking page resolves — **a 200 here is not a working page**, per the existing note; there is no evidence a recycler deployment is reachable at this domain today.

## IONOS API alternative (option, not a plan)

IONOS publishes a DNS/Domains API keyed by an IONOS API key (public+secret key pair), which could set nameservers or manage records programmatically instead of the IONOS web panel. No IONOS API key exists in `.env` or any known vault copy checked here — this is noted as an available option only; it is not part of the plan below because there is nothing to authenticate with yet.

## Exact actions, owner, and order

1. **Joshua — mint a Cloudflare API token** (Zone:Edit permission, plus Zone:Read to list) and add it as the `CLOUDFLARE_API_TOKEN` GitHub repo secret (and `CLOUDFLARE_ACCOUNT_ID` if the target account isn't the default one the token resolves to). This unblocks everything below. *(No key exists today — NOT CONFIGURED.)*
2. **Run the workflow in dry-run** (`workflow_dispatch`, `dry_run: true`, domains blank = full 12-domain default set) to see which of the 12 already have zones in Cloudflare (`exists(status)`) versus need adding (`WOULD-ADD`). This resolves the "zone exists?" UNVERIFIED rows above.
3. For the 6 SERVFAIL domains specifically (`aidoesitall.info/.online/.store`, `untilnokidinneed.online/.org/.store`): if dry-run shows `WOULD-ADD`, re-run with `dry_run: false` to actually add them — this is what's missing, since the registrar NS already points at Cloudflare pairs that just have no matching zone.
4. **Before switching any nameserver that currently serves real content** (`untilnokidinneed.com`, and any dream-online.*/onlinerecycle.net domain that's about to get a working landing page): add the DNS records in the Cloudflare zone first. Switching NS before records exist blacks the site out — the workflow's own warning.
5. **Joshua — at IONOS, per domain:** panel → domain → DNS → "Use your own name servers" → paste the exact pair Cloudflare's `/zones` response assigned that zone (note: `dream-online.*`/`onlinerecycle.net`/`untilnokidinneed.com` currently sit on IONOS default NS and have never been assigned a CF pair — step 3's add will produce one).
6. For `untilnokidinneed.com` specifically: the stray A-record pointing at `104.18.26.246` is what's producing the Cloudflare 1001 error today. Once the zone is properly added and NS switched, that manual A record should be removed/replaced by whatever the Cloudflare zone config specifies — do not leave both a direct A-record-to-Cloudflare-IP setup and a delegated zone.
7. **Ask Joshua** what `aidoesitall.*` is for before building anything there — purpose is unverified and nothing in the repo names it.

## Checklist (≈20 minutes, top to bottom)

- [ ] Mint Cloudflare API token (Zone:Edit) → add as `CLOUDFLARE_API_TOKEN` GitHub secret
- [ ] Trigger `cloudflare-add-zones.yml` with `dry_run: true` → read the report
- [ ] Trigger again with `dry_run: false` for any `WOULD-ADD` domain
- [ ] For domains about to serve real content, add A/CNAME records in the new CF zone
- [ ] At IONOS: switch each domain to "own name servers" with the pair the workflow reported
- [ ] Remove the stray `untilnokidinneed.com` A record once its CF zone is live
- [ ] Ask Joshua: what is `aidoesitall.*` for?
- [ ] Wait for propagation (up to 24-48h, usually much faster) and re-run the verify block below

## Verify block (copy/paste)

```bash
for d in aidoesitall.info aidoesitall.online aidoesitall.store aidoesitall.website \
         ai-solutions.store \
         dream-online.info dream-online.net dream-online.org dream-online.store \
         onlinerecycle.net \
         untilnokidinneed.com untilnokidinneed.online untilnokidinneed.org untilnokidinneed.store; do
  echo "== $d =="
  nslookup -type=NS "$d" 1.1.1.1
  nslookup -type=SOA "$d" 1.1.1.1
  curl -sI -m 8 "https://$d" | head -3
  curl -sI -m 8 "http://$d"  | head -3
  echo
done
```

Zone/account check once a token exists:
```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=<domain>" | jq '.result[] | {name,status,name_servers,account}'
```
