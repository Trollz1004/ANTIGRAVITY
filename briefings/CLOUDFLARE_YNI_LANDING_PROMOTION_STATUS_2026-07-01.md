# Cloudflare UI Promotion Status for yni-landing / youandinotai (TRO-30)

**Date:** 2026-07-01  
**Agent:** Grok (14a7fdb9-c07a-4904-921b-0374bceec622)  
**Related:** TRO-22 (wrangler verif), TRO-24 (frontend build), deploy runbook

## Current Config State (ready for promotion)

**wrangler.jsonc (apps/youandinotai-frontend/wrangler.jsonc)**
- name: "yni-landing"
- compatibility_date: "2026-05-12"
- compatibility_flags: ["nodejs_compat"]
- pages_build_output_dir: "out"
- vars: { NEXT_PUBLIC_SITE_NAME: "YouAndINotAI" }

**next.config.ts**
- output: 'export'  (static export for Cloudflare Pages)
- images: { unoptimized: true }

**Build artifacts (verified)**
- apps/youandinotai-frontend/out/index.html exists
- apps/youandinotai-static/ contains prebuilt index.html + assets + _headers + _redirects + _worker.js (static deploy ready)

**Note on modes (from wrangler comment)**
- Current: configured for Mode A (static export "out")
- Default comment mentions Mode B (SSR via @opennextjs/cloudflare) - would require config change + different build.

## Recommended Josh Actions in Cloudflare UI (for yni-landing / youandinotai project)

1. Go to Cloudflare Dashboard > Pages > select project "yni-landing" (or the one mapped to youandinotai.com).
2. In Deployments tab, identify latest successful deployment (from wrangler or connected source).
3. Click "Promote to Production" for the desired deployment.
4. Verify/ set Custom Domains: ensure youandinotai.com and any aliases are active and point to the production deployment.
5. Check Environment variables: confirm NEXT_PUBLIC_SITE_NAME and any other production vars (match wrangler.jsonc).
6. After promotion, verify:
   - https://youandinotai.com loads the promoted version.
   - Backend health via api.youandinotai.com (T5500 origin + tunnel).
   - No stale assets (per runbook: remove old from youandinotai-static if used).
7. If switching modes or additional UI settings (build config, functions), adjust in Pages project settings.

## Discrepancies / Drift Noted
- Deploy runbook references outdated build path (`frontend/react-app` + direct youandinotai-static upload). Current active path is `apps/youandinotai-frontend` with wrangler.jsonc + static out/.
- Runbook says "T5500 owns Wrangler and Cloudflare tunnel work" - aligns with promotion being manual UI step by Josh.
- No code-level "promotion" scripts or TODOs found for this; it's a manual CF dashboard action after build/deploy.

## Status
- Code/config/build state: **Ready** for promotion.
- No additional prep action required in repo.
- Last activity on TRO-30: none. This tracking serves as the update.
- Recommendation: Josh to perform promotion in CF UI as soon as convenient (coordinate with any launch timing from Product Hunt draft TRO-29).

**Durable artifact:** This file + references to prior verif reports (BUILD-VERIFICATION-2026-07-01.md, WRANGLER-VERIFICATION-2026-07-01.md).

**Next if needed:** If promotion blocked (e.g. domain/tunnel), add interactive blocker or child issue.
