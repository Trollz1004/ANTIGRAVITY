# Skill: Multi-Domain Mission-Driven Site Build on Manus

**Version:** 1.0 — March 2026  
**Project:** OnlineRecycle.org + #ForTheKids transparency dashboard  
**Author:** Manus AI  

---

## Overview

This document captures the repeatable process used to build and deploy the OnlineRecycle.org local-business landing page alongside the #ForTheKids transparency dashboard — two distinct audiences, two distinct visual identities, served from a single Manus web project via host-based routing.

The pattern is applicable to any scenario where a single codebase must serve multiple domains with different page content, branding, or audience intent.

---

## Architecture Pattern: Host-Based Domain Routing

The core technique is server-side host detection in `server/_core/vite.ts`. Both in development (Vite middleware) and production (`serveStatic`), the server reads the `x-forwarded-host` header (set by the Manus reverse proxy) and falls back to the `Host` header. When the host matches the secondary domain, a different root HTML file is served.

```ts
// In vite.ts catch-all handler
const host = req.headers['x-forwarded-host'] || req.headers['host'] || '';
const isOnlineRecycle = host.includes('onlinerecycle.org');
const rootFile = isOnlineRecycle ? 'onlinerecycle.html' : 'index.html';
res.sendFile(path.resolve(distPath, rootFile));
```

The secondary domain's HTML (`onlinerecycle.html`) lives in `client/public/` and is served as a fully static file — no React, no tRPC, no auth. This keeps it fast, indexable, and independent of the React app's build cycle.

| Domain | Root file served | Stack |
|---|---|---|
| `forthekids.manus.space` | `index.html` → React SPA | React 19 + tRPC + Manus Auth |
| `onlinerecycle.org` | `onlinerecycle.html` | Static HTML + Vanilla JS |

---

## Honesty-First Copy Protocol

Every piece of public-facing copy was reviewed against three questions before deployment:

1. **Is this true right now?** Not "will be true," not "is planned" — is it operational today?
2. **Would a reasonable person interpret this as a guarantee?** If yes, add a qualifier.
3. **Does this match the canonical business profile?** Cross-check against `briefings/BUSINESS-PROFILE-CANONICAL.md`.

The canonical profile (`BUSINESS-PROFILE-CANONICAL.md`) is the single source of truth for all AI agents working on this project. It includes an explicit "do not add back" list of phrases that were removed after Perplexity and Codex review.

**Key corrections made during this build:**

| Removed phrase | Replacement | Reason |
|---|---|---|
| "Automatic on sale" (Step 8) | "Tracked per on-chain split — bridge in development" | Square-to-chain bridge not yet built |
| "One upload → 4 channels" | "Test batch first — then scale" | Channel sync not yet proven |
| "Automatically routed via smart contract" | "Allocated per publicly verifiable DAO structure" | No live routing exists yet |
| "Shriners Children's Hospitals" | "Children's medical care" | Specific beneficiary not contracted |

---

## Legal Pages Checklist

For any for-profit platform making charitable allocation claims, the minimum legal page set is:

| Page | Key disclosures required |
|---|---|
| Terms of Service | As-is sales, DAO allocation statement, Square-to-chain caveat, arbitration clause, Florida jurisdiction |
| Privacy Policy | Data collected, Square data handling, no ad tracking, CCPA rights, retention period |
| Disclaimer | For-profit status, no charitable solicitation registration, no third-party endorsement, blockchain risk |

All three pages were drafted by Perplexity and reviewed for paste artifacts (malformed `<li>` tags) before deployment.

---

## SEO Requirements for a Local Business Page

The following targets apply to the static local-business page:

| Element | Requirement | Value used |
|---|---|---|
| `<title>` | 30–60 characters | "Florida E-Waste & Electronics Recycling \| Free Drop-Off & Pickup \| OnlineRecycle.org" |
| `<meta name="description">` | 50–160 characters | 144 chars |
| `<meta name="keywords">` | 3–8 focused terms | 7 terms |
| `og:image` | 1200×630px, hosted on CDN | CloudFront URL |
| `og:image:width` / `og:image:height` | Explicit dimensions | 1200 / 630 |
| `schema.org` type | `RecyclingCenter` | Included with full NAP |
| Geo meta tags | `geo.region`, `geo.placename`, `geo.position`, `ICBM` | Sorrento FL 32776 |
| `sitemap.xml` | All pages, correct priorities | 5 URLs submitted |

---

## Cookie Consent Pattern (GDPR/CCPA Compliant)

The banner uses three categories: Strictly Necessary (always-on, greyed out), Analytics (unchecked), and Functional (unchecked). Preference is stored in `localStorage` under the key `cookieConsent`. A "Manage Cookies" link in every footer clears this key and re-shows the banner.

**Critical rule:** Optional categories must start unchecked. Pre-checking them violates GDPR Article 7 and CCPA opt-out requirements.

---

## OG Image Generation Prompt Template

For future OG images in this brand style:

> Clean white background (#f8fafc). Left side: large [brand icon] in vibrant green (#16a34a), below it the domain name in bold Inter font, dark navy (#0f172a). Right side: three stacked stat cards with green left border — [stat 1], [stat 2], [stat 3]. Bottom bar: solid green (#16a34a) strip with white text '[tagline]'. Overall style: professional, trustworthy, local business, daylight theme. No gradients. No dark backgrounds.

Aspect ratio: `3:2` (renders at 2528×1696, displayed at 1200×630 via `og:image:width`/`height` meta tags).

---

## Contact Form Pattern (No Backend Required)

The contact form on `about.html` uses a `mailto:` handler — no server, no database, no spam risk. On submit, it constructs a pre-filled `mailto:` URI with subject and body populated from form fields, then sets `window.location.href` to open the user's email client.

This is appropriate for low-volume inquiry forms. For higher volume, replace with a Formspree or Netlify Forms endpoint, or a tRPC mutation that calls `notifyOwner()`.

---

## Deployment Checklist

Before publishing any update to this project:

- [ ] All public-facing copy reviewed against `BUSINESS-PROFILE-CANONICAL.md`
- [ ] No phrases from the "do not add back" list present
- [ ] SEO title 30–60 chars, description ≤160 chars, keywords ≤8
- [ ] `og:image` URL is a CDN URL (not a local path)
- [ ] Cookie banner present on `onlinerecycle.html` with all three categories unchecked
- [ ] "Manage Cookies" link in footer of all pages
- [ ] `sitemap.xml` updated if new pages added
- [ ] ANTIGRAVITY repo committed and pushed before Manus checkpoint
- [ ] Manus checkpoint saved before clicking Publish

---

## Files Modified in This Build

| File | Purpose |
|---|---|
| `server/_core/vite.ts` | Host-based routing — onlinerecycle.org → onlinerecycle.html |
| `client/public/onlinerecycle.html` | Daylight-theme local-business landing page |
| `client/public/about.html` | About Us page with data destruction, DAO breakdown, contact form |
| `client/public/terms.html` | Terms of Service |
| `client/public/privacy.html` | Privacy Policy |
| `client/public/disclaimer.html` | Disclaimer |
| `client/public/sitemap.xml` | XML sitemap for all 5 pages |
| `client/index.html` | React SPA root — SEO meta fixed |
| `client/src/pages/Home.tsx` | Transparency dashboard — copy corrections + legal footer links |
| `briefings/BUSINESS-PROFILE-CANONICAL.md` | Canonical business profile (source of truth for all AI agents) |

---

*This skill document is maintained in `ANTIGRAVITY/briefings/` and should be updated whenever the site architecture or compliance requirements change.*
