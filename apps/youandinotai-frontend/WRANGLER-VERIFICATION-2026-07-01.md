# Wrangler / Cloudflare Pages Config Verification (TRO-22 / T-007)

**Date:** 2026-07-01  
**Agent:** Grok 14a7fdb9-c07a-4904-921b-0374bceec622  
**Issue:** TRO-22 T-007: Wrangler config verification for youandinotai  
**Status:** Completed - config consistent and ready for static Pages deploy

## Files Inspected
- `apps/youandinotai-frontend/wrangler.jsonc`
- `apps/youandinotai-frontend/next.config.ts`
- `apps/youandinotai-frontend/package.json`
- `apps/youandinotai-frontend/out/` (from prior successful `pnpm build`)
- `apps/youandinotai-static/` (legacy/direct static assets + _headers/_redirects/_worker.js)
- `briefings/YOUANDINOTAI-DEPLOY-RUNBOOK.md`
- `apps/youandinotai-frontend/functions/api/supabase-smoke.ts`

## Wrangler Config (wrangler.jsonc)
```jsonc
{
  "name": "yni-landing",
  "compatibility_date": "2026-05-12",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "out",
  "vars": {
    "NEXT_PUBLIC_SITE_NAME": "YouAndINotAI"
  }
}
```
- Uses JSONC (supported).
- Targets "out" dir for Pages.
- nodejs_compat flag present (good for Next).
- No custom routes defined here (SPA handled via _redirects in static).

## Next.js Config Alignment
- `output: 'export'` (static)
- `images: { unoptimized: true }`
- Matches wrangler `pages_build_output_dir: "out"`
- Build produces static HTML/JS in `out/` (confirmed: index.html, _next/ chunks, etc.)

## Build & Artifact Check
- Prior heartbeat (TRO-24) + re-confirmation: `pnpm build` succeeds, emits `out/` with prerendered static routes.
- `out/index.html` exists and contains the expected app shell + meta (YouAndINotAI branding, verified dating copy).
- youandinotai-static dir also present with pre-generated assets, strict security _headers, SPA _redirects `/* /index.html 200`.

## Runbook vs Reality
Runbook (briefings/YOUANDINOTAI-DEPLOY-RUNBOOK.md) references:
- Old build path: `frontend/react-app`
- Artifact: `apps/youandinotai-static`
Current active:
- `apps/youandinotai-frontend` (with its own wrangler + next.config for "out")
- youandinotai-static appears to be a snapshot/legacy direct-deploy location.

**Recommendation (non-blocking):** Sync runbook build instructions or note dual paths if intentional. Current wrangler + static export in apps/youandinotai-frontend is the live path matching the wrangler.jsonc.

## Other Findings
- No wrangler.toml found (jsonc is the config; correct).
- No obvious secret/env leakage in checked files.
- functions/api/supabase-smoke.ts present (light integration placeholder; not blocking config verify).
- Security headers in static/_headers are strong (CSP, HSTS, etc.) and product-appropriate.
- Package name in apps/youandinotai-frontend/package.json is "ai-studio-applet" (likely copy-paste; wrangler project "yni-landing" is what matters for CF).
- No wrangler/cloudflare/opennext deps visible at quick scan (Pages + static export doesn't require them in package for basic).

## Production Deploy Readiness
- Local: Build + wrangler config aligned for `wrangler pages deploy out --project-name=yni-landing` (or Pages dashboard / Git integration if used).
- Per runbook: T5500 owns actual wrangler + tunnel ops. Frontend build verified clean.
- No routes/env blockers found in inspected artifacts.
- Checkout verification (real Square flow) is separate (runbook step) and not part of pure config verify.

## Conclusion
Wrangler config for youandinotai frontend is valid and consistent with static export + Cloudflare Pages setup. Production deploy path is ready assuming T5500 wrangler execution.

**Durable artifacts:**
- This report: apps/youandinotai-frontend/WRANGLER-VERIFICATION-2026-07-01.md
- Prior build report + successful `out/` artifacts.

Related to TRO-1 Q3 infrastructure / deploy work.
