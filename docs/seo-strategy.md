# TRO-314: AI Solutions Exchange Landing SEO Metadata + Sitemap Strategy

## Objective

Create a practical SEO baseline for `ai-solutions-store` so landing, legal, and marketplace routes are discoverable by search engines and consistent with product-first public copy.

## Current surfaced routes

- `/` (landing page)
- `/tra` and `/marketplace` (marketplace stub routing in `_deploy/ai-solutions-store/_redirects`)
- `/terms` (legal terms)
- `/privacy` (legal privacy)
- `/api/support/chat` (support endpoint; not indexable, should be blocked from discovery)

## Recommended metadata baseline

Use one canonical origin for the storefront (example: `https://aidoesitall.website`).

### 1) Home page: `/`
- Title: `AI Solutions Store — Practical AI Setups for Teams`
- Description: `Explore practical AI service setups for checkout, storefronts, support, automation, and uptime review. Built for operators who need reliable implementation, clear handoff, and receipt-linked delivery.`
- Canonical: `https://aidoesitall.website/`
- Open Graph:
  - `og:title`: `AI Solutions Store — Practical AI Setups for Teams`
  - `og:description`: same as meta description
  - `og:type`: `website`
  - `og:url`: `https://aidoesitall.website/`
  - `og:image`: `https://aidoesitall.website/og-image.svg` (or existing image asset path)
  - `og:image:alt`: `AI Solutions Store service cards and setup options`
  - `twitter:card`: `summary_large_image`
  - `twitter:title`: same as title
  - `twitter:description`: same as meta description
  - `twitter:image`: same as `og:image`
- Structured data:
  - `@type: WebSite` with `name`, `url`, and `potentialAction` (`SearchAction` optional)
  - `@type: Organization` with `name`/`url` and `sameAs` where available
  - `@type: ItemList` only if each service card should be surfaced as a service listing
  - Add `Product` blocks per top service if individual product URLs are added later

### 2) Marketplace/TRA routes: `/tra`, `/marketplace`
- Title: `AI Solutions Store — Business Exchange Marketplace`
- Description: `Explore the AI Solutions Store marketplace for practical automation services, delivery-ready setups, and support-aware checkout flow.`
- Canonical:
  - `/tra` → `https://aidoesitall.website/tra`
  - `/marketplace` → `https://aidoesitall.website/tra`
- Open Graph fields should mirror home but use marketplace title/description.
- Structured data:
  - `@type: CollectionPage`
  - `@type: ItemList` of linked service offer objects when available.
- Add `rel="canonical"` and `<meta name="robots" content="index,follow">`.

### 3) Legal pages: `/terms`, `/privacy`
- Title: `AI Solutions Store — Terms of Service` and `AI Solutions Store — Privacy Policy`
- Description: concise, exact-to-page statement (e.g., “Terms that govern purchases, receipts, support handoff, and user responsibilities.”).
- Canonical each page individually.
- `robots`: `index,follow`
- `og:type`: `article`
- Structured data:
  - Optional `@type: WebPage` only; avoid schema over-saturation on legal pages.

### 4) Product card anchor links
If service buttons remain same-page anchors for now:
- Add descriptive `aria-label` and unique fragment IDs (for example `#bot-shield`, `#storefront`, `#supportclaw`, `#automation`, `#uptime`).
- If possible, convert cards into separate URLs now to improve indexability and conversion tracking.

## URL-level SEO quality rules

- One `title` per URL, <70 chars for primary pages.
- One unique `description` per URL, 150–160 chars preferred.
- Single canonical `https` + `www` policy (decide either with or without `www`, apply everywhere).
- Add `rel="alternate"` only if country/language variants are introduced later.
- Add a single JSON-LD block in `<head>` and keep it valid on every page.
- Ensure all checkout/product links include explicit `rel="noopener noreferrer"` only where opening new windows.

## Sitemap strategy

### File placement
- Add `sitemap.xml` to the storefront deployment root: `_deploy/ai-solutions-store/sitemap.xml`

### URL set (initial)
- `https://aidoesitall.website/`
- `https://aidoesitall.website/tra`
- `https://aidoesitall.website/marketplace` (if retained)
- `https://aidoesitall.website/terms`
- `https://aidoesitall.website/privacy`

### Priority/change policy
- `/`: `1.0`, `weekly`
- `/tra` or `/marketplace`: `0.8`, `monthly`
- `/terms`, `/privacy`: `0.5`, `yearly`

### Example priority policy
- Add `lastmod` dates with UTC date for each update.
- Use strict absolute URLs only.
- Exclude operational endpoints and API paths (`/api/*`) from sitemap.

## Robots and indexability

- Add `_deploy/ai-solutions-store/robots.txt`:
  - `Allow: /`
  - `Disallow: /api/`
  - `Disallow: /*.json`
  - `Sitemap: https://aidoesitall.website/sitemap.xml`
- Block any admin/test-only assets/paths if introduced later.

## Implementation order

1. Add metadata fields to landing page `head` (title, meta description, canonical, OG, Twitter, JSON-LD).
2. Add canonical landing+legal route rules and choose one destination for `/marketplace`.
3. Generate and publish `sitemap.xml` with initial URL list.
4. Add/update `robots.txt` with sitemap reference and API disallow.
5. Submit/refresh sitemap in Google Search Console and Bing Webmaster Tools.
6. Track and optimize with Search Console coverage, CTR, and core top-page impressions.

## Naming and copy guardrails

- Use product language only: verification, setup quality, support, safety, uptime, checkout reliability.
- Avoid non-product financial/control claims and non-consumer-facing private mechanics in page metadata.
- Keep structured data descriptions service-first and outcome-oriented.
