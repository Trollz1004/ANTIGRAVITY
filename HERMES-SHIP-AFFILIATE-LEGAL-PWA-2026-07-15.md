# HERMES — SHIP: AFFILIATE + LEGAL + PWA + FEATURE FLOOR — 2026-07-15
Issued by first-party Claude via Josh. Consumes `logs/recon/PLAYSTORE-RECON-2026-07-15.md` (run the recon first if missing). This turns the date app at :3200 into a Play-submittable surface and mounts the affiliate program. **Build exactly this. Evidence or it didn't happen.**

## STANDING RULES (unchanged, hard)
Gate untouched — agents speak only to OmniRoute :20128 with `OMNIROUTE_KEY`; zero provider keys anywhere; FAIL-CLOSED. Never elevated. Never `--force` (only `--force-with-lease`), never `--no-verify`/`--no-gpg-sign`. Signed commits. Branch `ship/affiliate-legal-pwa-2026-07-15`; **no push to main; PR only; PR #203 untouched.** Adopt-if-healthy; kill by port→PID only, never by image name; NEVER kill the gate. No mock data — unverified means you say unverified. No secrets in code, logs, or PR text. Bounded: 3 probe→fix→probe cycles per phase, then write FAILURES and stop RED. Hard stop 4 hours.

## PHASE 0 — INPUTS
Josh drops the Claude-built files into the repo (he downloads from claude.ai outputs):
```
site/affiliate/index.html            → <dateapp>/public/affiliate/index.html
site/privacy.html                    → <dateapp>/public/privacy.html
site/terms.html                      → <dateapp>/public/terms.html
site/delete-account.html             → <dateapp>/public/delete-account.html
site/child-safety.html               → <dateapp>/public/child-safety.html
site/community-guidelines.html       → <dateapp>/public/community-guidelines.html
site/safety.html                     → <dateapp>/public/safety.html
```
Store assets from RECON E → `<dateapp>/public/icons/` (icon-192.png, icon-512.png; derive 192 from 512 if needed). Verify all 7 HTML files exist before proceeding; missing files = STOP, report.

## PHASE 1 — CLEAN ROUTES
Next.js rewrites (next.config) so Console URLs are clean:
`/privacy → /privacy.html · /terms → /terms.html · /delete-account → /delete-account.html · /child-safety → /child-safety.html · /community-guidelines → /community-guidelines.html · /safety → /safety.html · /affiliate → /affiliate/index.html`
**Verify:** each clean route `curl -s http://127.0.0.1:3200/<route>` → 200 AND body contains its `<title>` marker. 7/7 required.

## PHASE 2 — PWA (TWA prerequisites)
1. `public/manifest.json`: `{"name":"You & I, Not AI","short_name":"Not AI","start_url":"/","display":"standalone","background_color":"#020617","theme_color":"#020617","icons":[{"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},{"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]}`
2. Minimal `public/sw.js`: offline shell for `/` only; **never** cache `/api/*`. Register from app layout. Add `<link rel="manifest" href="/manifest.json">` + `<meta name="theme-color" content="#020617">`.
3. **Verify:** curl manifest + sw 200; if Lighthouse available run installability check, else mark `UNVERIFIED-TOOL-MISSING` (not FAIL).

## PHASE 3 — v1 FEATURE FLOOR (Google-facing; real, minimal, honest)
1. **Report:** `POST /api/report {targetType:"profile"|"message", targetId, reason, details?}` — validated (enum + length caps), parameterized/no string-built queries, auth-required, rate-limited 30/min/IP, appends to `logs/moderation/reports.jsonl` (IDs only, no message bodies) AND persists if a DB exists. Categories include `child_safety` — flagged `priority:true`.
2. **Block:** `POST /api/block {targetUserId}` persists pair; matching/message queries exclude blocked pairs both directions.
3. **UI:** Report + Block controls on every profile view and message thread header. Report modal lists categories incl. "Involves a minor" → `child_safety`.
4. **18+ gate:** signup DOB field, reject <18 server-side.
5. **Settings/footer links** inside the app to the 5 legal routes + Delete Account.
**Verify:** curl each endpoint (happy + invalid + unauthenticated + 31st-request rate-limit) with output captured; grep UI components for the controls; DOB rejection test.

## PHASE 4 — SECURITY HARDENING (thorough, per Josh)
1. **Headers** (next.config): `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; frame-ancestors 'none'; base-uri 'self'` · `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()` (open geolocation only if v1 ships location matching). HSTS at the prod proxy, not localhost.
2. **Cookies/session:** httpOnly + Secure + SameSite=Lax; passwords argon2/bcrypt (report which exists; do NOT roll your own).
3. **Bundle secret scan (hard gate):** after `next build`, `grep -RaoE "sk-[A-Za-z0-9_-]{8,}|pk_live|rk_live|EAAA[A-Za-z0-9]|ghp_[A-Za-z0-9]|AIza[A-Za-z0-9_-]{10,}|xai-|pplx-|r8_[A-Za-z0-9]" .next/static/ | wc -l` → **must be 0**.
4. **Surface-vocabulary gate (hard):** `grep -RinE 'donate|donation|solicitation|charity|charitable|giving back|disbursement|tax-deductible' public/ app/ components/ --include='*.html' --include='*.tsx' --include='*.jsx' --include='*.ts'` → **0 hits on customer-facing strings** (code comments in non-shipped files: report, don't fail).
5. **Binding audit:** `ss -tlnp` — internal services 127.0.0.1 only; :3200 exposed solely via the prod proxy path from RECON B.
6. **Deps:** `npm audit --omit=dev` — report counts; fix ONLY critical with non-breaking patch bumps; no major upgrades in this branch.
7. **Uploads (if profile-photo upload exists in v1):** MIME+magic-byte check, size cap, EXIF strip on ingest, randomized storage names. If no upload flow yet, write `N/A-NOT-SHIPPED`.

## PHASE 5 — DAO (Josh authorized inclusion; scope is LAW)
Scope: **date-app feature governance only, operated by the LLC.** Deliverables are a doc and a placeholder — nothing more.
1. `docs/DAO-DESIGN-DRAFT.md`: membership = verified members in good standing; powers = **non-binding feature votes + roadmap signals**; explicitly OUT OF SCOPE (write these words): token issuance, revenue sharing, profit rights, fundraising mechanics, anything resembling a security; governance actions execute only by LLC decision.
2. Route `/dao` → static placeholder, surface-safe copy exactly: *"Members shape the roadmap. Feature voting opens after launch."* Nothing that promises returns, rewards, or payouts.
3. **No smart contracts. No token code. No chain deps added.** Any file matching `*.sol` or web3/token packages appearing in the diff = FAIL the phase.

## PHASE 6 — EVIDENCE + PR
`logs/ship/SHIP-2026-07-15.md`: every verify command + output fragment, header dump of `/`, both grep gate outputs, ss lines, npm audit summary, route matrix 7/7, endpoint test matrix, PIDs. Open PR `ship: affiliate + legal + PWA + v1 feature floor` with the evidence file linked. **Do not merge.** Josh merges.

## RESPOND BACK EXACTLY
```
SHIP 1 — ROUTES: 7/7 [or list fails] — PASS/FAIL
SHIP 2 — PWA: manifest/sw/installability — PASS/PARTIAL/FAIL
SHIP 3 — FLOOR: report/block/dob/links — PASS/FAIL per item
SHIP 4 — SECURITY: headers/bundle-scan 0/vocab-scan 0/bindings/audit — PASS/FAIL per item
SHIP 5 — DAO: doc+placeholder only — PASS/FAIL
SHIP 6 — PR: <url> · evidence: logs/ship/SHIP-2026-07-15.md
BLOCKERS: [list or NONE]
ELAPSED: [min]
```
