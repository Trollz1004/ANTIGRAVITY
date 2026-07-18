# HERMES — PLAY STORE RECON (read-only) — 2026-07-15
Issued by first-party Claude via Josh. Parallel task while the affiliate site + legal pages + compliance pack are built elsewhere. **Your job is FACTS, not fixes.**

## GUARDRAILS (hard)
- READ-ONLY. No service restarts, no kills, no installs, no config edits.
- No commits, no pushes, no branches. Report file goes to `logs/recon/` UNCOMMITTED. PR #203 untouched.
- Never run elevated. Never contact a model provider or any external API. No account signups. Nothing submitted to Google.
- NEVER print secret values. Masked tails only (first4…last4). Redaction ON.
- Do NOT create or edit any web pages, legal text, marketing copy, or affiliate UI — that work is in flight elsewhere. Touching it is a collision.
- Any item you can't complete: write `BLOCKED — <reason>` and move on. Do not improvise. Hard stop at 45 minutes.

## TASKS
**A. DATE APP FACTS (:3200)**
1. From the date-app dir: `package.json` → app name, Next.js version, start script. PM2/process name serving :3200.
2. Route inventory: top 2 levels of `app/` or `pages/` tree. Note if any of these already exist: `/privacy` `/terms` `/delete-account` `/child-safety` `/community-guidelines` `/safety` `/affiliate`.
3. Does `public/` contain `manifest.json`, a service worker, `robots.txt`, `.well-known/`? List what exists.
4. `curl -sI http://127.0.0.1:3200/` → paste status line + Server/security headers present.

**B. DOMAIN + TLS PATH (youandinotai.com)**
1. `dig +short youandinotai.com A` and `CNAME` — where does prod DNS point today?
2. What fronts it (Cloudflare / nginx / nothing yet)? Evidence line.
3. Yes/No: can we serve `https://youandinotai.com/.well-known/assetlinks.json` today, and via what path?

**C. MAILBOXES**
1. `dig +short MX youandinotai.com` — do MX records exist? Cloudflare Email Routing configured?
2. Which of `support@ / safety@ / legal@` currently route anywhere? INSPECTION ONLY — send nothing.

**D. BUILD TOOLING (for TWA/Bubblewrap later)**
`node -v` · `java -version` (need JDK 17+) · is `@bubblewrap/cli` installed (report only, do NOT install) · free disk on the build volume.

**E. STORE ASSETS (only write action allowed, non-repo)**
1. Copy `logo-ynai-256.png` (+ 512 if exists) and `verified-human-badge.png` into `E:\ANTIGRAVITY\store-assets\` (create dir; do not commit).
2. If ImageMagick present: produce `icon-512.png` (512×512) and `feature-1024x500.png` (logo centered on `#020617`). Else `BLOCKED — no imagemagick`.
3. If headless Chrome available: 2 screenshots of `http://127.0.0.1:3200/` at 1080×1920 → same folder. Else BLOCKED line.

**F. SECRET HYGIENE (masked, no probes)**
1. Locate all on-disk copies of `Shared_linksopus.zip` and any extracted `uploads/.env.txt`, `1min.ai.env`, `runtime-misc.env*`, `hermes-config.yaml` outside the vault. Full paths.
2. For each: count of key-shaped lines (`sk-|pk_|rk_|EAAA|ghp_|AIza|xai-|pplx|r8_`) + masked tails ONLY.
3. Diff those names against `VAULT-INDEX.md`; mark each `ROTATE-CANDIDATE: yes/no`. NO live validation of any key.

**G. GATE PULSE** — `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:20128/health` — code only.

## RESPOND BACK EXACTLY LIKE THIS
Save to `logs/recon/PLAYSTORE-RECON-2026-07-15.md` AND paste the same content back:
```
RECON A — DATE APP: [facts] — PASS/BLOCKED
RECON B — DOMAIN/TLS: [facts] — PASS/BLOCKED
RECON C — MAIL: [facts] — PASS/BLOCKED
RECON D — TOOLING: [facts] — PASS/BLOCKED
RECON E — ASSETS: [paths produced] — PASS/PARTIAL/BLOCKED
RECON F — SECRETS: [paths + counts + masked tails + rotate-candidates] — PASS/BLOCKED
RECON G — GATE: [code]
BLOCKERS: [list or NONE]
ELAPSED: [min]
```
One evidence line per row (command + output fragment). Unverified means you SAY unverified.
