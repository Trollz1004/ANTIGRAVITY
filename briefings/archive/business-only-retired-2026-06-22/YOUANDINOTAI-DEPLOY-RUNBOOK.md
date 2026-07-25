# youandinotai Deploy Runbook — wrangler + cloudflared (canonical)

**Authority:** Josh (2026-05-12): *"must use wrangler cloudflared every date app change"*
**Scope:** `apps/youandinotai-frontend/` (Next.js 15 SSR, React 19)
**Deploy target:** Cloudflare Pages project `yni-landing` (custom domain: `youandinotai.com`)
**Tunnel target:** Cloudflare Tunnel `sabretooth` → migrate to T5500-rooted tunnel post-wipe

---

## 0. Prerequisites (one-time setup)

```powershell
# Install wrangler globally
npm install -g wrangler

# Install cloudflared (winget preferred)
winget install --id Cloudflare.cloudflared

# Auth wrangler (browser flow — ~30s)
wrangler login

# Auth cloudflared (browser flow — ~2 min)
cloudflared tunnel login

# Verify auth
wrangler whoami        # should show Trollz1004 account email
cloudflared tunnel list    # should show 'sabretooth' (and future T5500 tunnel)
```

**Credential note (2026-05-12):** the `CLOUDFLARE_API_TOKEN` in vault is currently dead per `briefings/PLATFORM-LIVENESS-2026-05-12.md`. Wrangler's OAuth (`wrangler login`) works independently — start there. Rotate the API token at https://dash.cloudflare.com/profile/api-tokens when you need automated/CI deploys.

---

## 1. Choose deploy mode (one-time decision per app)

Next.js 15 on Cloudflare Pages has two viable modes. The dating app's current `next.config.ts` is **SSR-default** (no `output: 'export'`).

### Mode A — Static export (simpler, fewer deps)

**When to use:** if the dating app's `app/page.tsx` and components don't rely on server actions, API routes, or runtime-only Next.js features.

**Changes needed in `apps/youandinotai-frontend/next.config.ts`:**
```ts
const nextConfig: NextConfig = {
  output: 'export',          // add this
  reactStrictMode: true,
  // ... rest unchanged
};
```

**Build + deploy:**
```powershell
cd C:\Antigravity\apps\youandinotai-frontend
pnpm install
pnpm build                                                 # produces out/
wrangler pages deploy out --project-name yni-landing
```

### Mode B — SSR via @opennextjs/cloudflare (full Next.js features)

**When to use:** if the app needs server actions, API routes, ISR, or any runtime Next.js feature. The current `next.config.ts` is SSR-shaped, so this is the path of least friction.

**One-time install:**
```powershell
cd C:\Antigravity\apps\youandinotai-frontend
pnpm add -D @opennextjs/cloudflare
```

**Build + deploy:**
```powershell
cd C:\Antigravity\apps\youandinotai-frontend
pnpm install
npx opennextjs-cloudflare build                            # produces .open-next/
wrangler pages deploy .open-next/assets --project-name yni-landing --compatibility-date=2026-05-12
```

**Recommendation:** start with **Mode B** (it preserves current SSR config and works with `transpilePackages: ['motion']`). Only fall back to Mode A if `@opennextjs/cloudflare` build hits an unresolvable issue.

---

## 2. Standard daily deploy sequence

Once mode is chosen and `wrangler.jsonc` (see §3) is committed, every deploy is:

```powershell
cd C:\Antigravity\apps\youandinotai-frontend

# 1. Pull latest design / content
cd C:\Antigravity && git pull --ff-only origin main && cd apps\youandinotai-frontend

# 2. Build (chooses correct path based on wrangler.jsonc)
pnpm install
pnpm run build:cloudflare    # or whatever script wrangler.jsonc says

# 3. Deploy
wrangler pages deploy --project-name yni-landing

# 4. Smoke test
curl -I https://youandinotai.com    # expect HTTP 200 + Cloudflare headers
```

Wrangler prints the deployment ID and preview URL when it lands. Save that ID for rollback.

---

## 3. Recommended `wrangler.jsonc` (commit to repo)

Path: `apps/youandinotai-frontend/wrangler.jsonc`

```jsonc
{
  "name": "yni-landing",
  "compatibility_date": "2026-05-12",
  "pages_build_output_dir": ".open-next/assets",
  "vars": {
    "NEXT_PUBLIC_SITE_NAME": "YouAndINotAI"
  }
}
```

Wrangler reads this on every `pages deploy` so the flags don't need to be passed each time. Adjust `pages_build_output_dir` to `out` if using Mode A.

---

## 4. Tunnel route management (cloudflared)

The 5 currently-tunneled subdomains all terminate at Sabretooth. After Sabretooth wipe, they need to either be retired or rerouted to T5500.

### Current routes (2026-05-12, on Sabretooth tunnel)
| Subdomain | Origin |
|---|---|
| `mcp.youandinotai.com` | http://localhost:3100 (sabretooth) |
| `paperclip.youandinotai.com` | http://localhost:3100 (legacy, retire) |
| `hermes.youandinotai.com` | http://localhost:8000 (sabretooth) |
| `openclaw-gw.youandinotai.com` | http://localhost:18789 (sabretooth) |
| `dashboard.aidoesitall.website` | http://localhost:3100 (sabretooth) |

### Post-wipe migration (run on T5500 after Sabretooth is dead)

```powershell
# Create new tunnel on T5500
cloudflared tunnel create t5500
cloudflared tunnel route dns t5500 hermes.youandinotai.com
cloudflared tunnel route dns t5500 dashboard.aidoesitall.website
# mcp / paperclip / openclaw-gw subdomains — let them go NXDOMAIN (retired)

# Write the routing config
@"
tunnel: t5500
credentials-file: C:\Users\joshl\.cloudflared\<tunnel-uuid>.json
ingress:
  - hostname: hermes.youandinotai.com
    service: http://localhost:8642     # hermes-agent gateway on T5500
  - hostname: dashboard.aidoesitall.website
    service: http://localhost:3000     # cockpit on T5500
  - service: http_status:404
"@ | Out-File -Encoding utf8 C:\Users\joshl\.cloudflared\config.yml

# Run the tunnel
cloudflared tunnel run t5500
# Or install as a service so it auto-starts:
cloudflared service install
```

---

## 5. Smoke tests (after every deploy)

```powershell
# Apex resolves + serves
curl -I https://youandinotai.com
# Expected: HTTP/2 200, server: cloudflare, cf-ray header present

# www subdomain redirects to apex (or serves identically)
curl -I https://www.youandinotai.com

# Cloudflare Pages deployment is the active one (not a stale build)
wrangler pages deployment list --project-name yni-landing | head -5

# Visual check — the meme + design system load
# Open in browser:
start https://youandinotai.com
```

---

## 6. Rollback (one command)

```powershell
# List recent deployments
wrangler pages deployment list --project-name yni-landing

# Rollback to the prior deployment ID
wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name yni-landing
```

Cloudflare propagates the rollback globally in ~30 seconds.

---

## 7. TOS-doctrine cross-check (pre-deploy)

Before EVERY deploy, verify the build output doesn't ship doctrine violations:

```powershell
cd C:\Antigravity\apps\youandinotai-frontend
# After build, grep the output for forbidden strings
Get-ChildItem -Path .open-next\assets, out -Recurse -File -Include *.html,*.js,*.json -ErrorAction SilentlyContinue |
    Select-String -Pattern 'donat(e|ion)|outreach|tax-deductible' |
    Format-Table Path, LineNumber, Line
```

If anything matches: **stop, don't deploy.** Fix the source, rebuild, recheck.

Same check applies to AI-attribution strings — `Anthropic partner`, `Google-backed`, `OpenAI-sponsored`, etc. — per `feedback_officially_unofficial_doctrine.md`.

---

## 8. CI-friendly deploy (when Cloudflare API token is rotated + live)

Once the `CLOUDFLARE_API_TOKEN` is rotated and live in vault:

```powershell
# Set env var for non-interactive auth
$env:CLOUDFLARE_API_TOKEN = (Get-Content "$env:USERPROFILE\OneDrive\Personal Vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env" |
    Where-Object { $_ -match '^CLOUDFLARE_API_TOKEN=' }) -replace '^CLOUDFLARE_API_TOKEN=', ''

# Deploy non-interactively
wrangler pages deploy .open-next/assets --project-name yni-landing
```

This pattern works for GitHub Actions or any other CI runner — set `CLOUDFLARE_API_TOKEN` as a repo secret and wrangler picks it up automatically.

---

## 9. What this runbook is NOT

- **Not for `mission-control` / `cockpit` / `command-center`** — those surfaces have their own deploy paths. Each app gets its own runbook when it ships to production.
- **Not for backend services** (`youandinotai-api`, mission-mcp HTTP) — those deploy to GCP Cloud Run or stay local. See `briefings/GCP-DEPLOY-RUNBOOK.md` (TBD) for backend deploys.
- **Not a substitute for testing locally first** — `pnpm dev` and verify the change works before `pnpm build` + deploy.
