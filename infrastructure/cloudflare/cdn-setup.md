# CDN Setup Guide — Cloudflare R2 + Workers

## Overview

Static assets for the ANTIGRAVITY project are served via Cloudflare R2 (S3-compatible
object storage) behind a Cloudflare CDN edge. Fingerprinted assets (JS, CSS, images,
fonts) are cached aggressively at the edge with immutable cache headers. HTML entry
points are never cached.

**CDN Base URL:** `https://cdn.youandinotai.com`

---

## 1. Cloudflare R2 Bucket Configuration

### Create the Bucket

1. Log in to the Cloudflare dashboard → **R2 Object Storage**.
2. Click **Create bucket**.
   - **Bucket name:** `antigravity-assets`
   - **Location:** `auto` (Cloudflare picks the optimal jurisdiction)
   - **Default storage class:** Standard
3. Click **Create bucket**.

### Bind a Custom Domain

1. In the bucket settings, go to **Custom Domains**.
2. Add `cdn.youandinotai.com`.
3. Cloudflare will auto-provision an SSL certificate (takes ~1 min).
4. Add the CNAME DNS record Cloudflare provides (if not auto-created):
   ```
   cdn.youandinotai.com  CNAME  cdn.youandinotai.com.cdn.cloudflare.net
   ```

### CORS Configuration

Set CORS on the bucket so browsers can load fonts and assets from the CDN domain:

```json
[
  {
    "AllowedOrigins": ["https://youandinotai.com", "https://www.youandinotai.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

Apply via the Cloudflare dashboard (R2 bucket → Settings → CORS) or via the API:

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/antigravity-assets/cors" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"rules":[{"AllowedOrigins":["https://youandinotai.com","https://www.youandinotai.com"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag","Content-Length","Content-Type"],"MaxAgeSeconds":86400}]}'
```

### Public Access

1. In bucket settings, enable **Public access** (R2.dev subdomain or custom domain).
2. Note the public URL: `https://cdn.youandinotai.com`.

---

## 2. Cache Policy Recommendations

| Asset Type              | Cache-Control Header                          | Rationale                                   |
|-------------------------|-----------------------------------------------|---------------------------------------------|
| Fingerprinted JS/CSS    | `public, max-age=31536000, immutable`         | Hash in filename = content-addressed        |
| Fingerprinted images    | `public, max-age=31536000, immutable`         | Same as above                               |
| Fingerprinted fonts     | `public, max-age=31536000, immutable`         | Same as above                               |
| HTML files              | `no-cache, no-store, must-revalidate`         | SPA entry must always be fresh              |
| `index.html`            | `no-cache, no-store, must-revalidate`         | Critical — must reflect latest deploy       |
| API responses           | `no-store`                                    | Dynamic content, never cache                |
| Service worker          | `no-cache, no-store, must-revalidate`         | Must always be fresh                        |

### Cloudflare Cache Rules (Dashboard)

Create these rules in **Caching → Cache Rules**:

1. **Rule: Cache fingerprinted assets aggressively**
   - Expression: `(http.request.uri.path contains "/assets/" and http.request.uri.path matches ".*-[a-f0-9]{8,}\\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$")`
   - Settings: `Cache Level: Cache Everything`, `Edge TTL: 1 year`, `Browser TTL: 1 year`

2. **Rule: Bypass cache for HTML**
   - Expression: `(http.request.uri.path matches ".*\\.html$")`
   - Settings: `Cache Level: Bypass`

---

## 3. Cloudflare Workers Script — Edge Caching Optimization

This Worker sits in front of the R2 bucket and adds/enforces optimal cache headers
at the edge. Deploy it on the route `cdn.youandinotai.com/*`.

### `worker.js`

```javascript
/**
 * Cloudflare Worker — CDN Edge Cache Optimizer for ANTIGRAVITY
 *
 * Serves static assets from R2 with aggressive caching for fingerprinted files
 * and no-cache for HTML. Adds security headers and CORS for cross-origin font loading.
 */

// Bucket binding name (configure in Worker settings → R2 Bucket Bindings)
const BUCKET_NAME = "antigravity-assets";

// Cache-Control policies
const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_HTML = "no-cache, no-store, must-revalidate";
const CACHE_MODERATE = "public, max-age=86400";

// Regex to detect fingerprinted filenames (e.g. main-abc12345.js)
const FINGERPRINTED_RE = /-[a-f0-9]{8,}\./;

// File extensions that should be immutable when fingerprinted
const IMMUTABLE_EXTENSIONS = new Set([
  ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
  ".ico", ".woff", ".woff2", ".ttf", ".eot", ".avif",
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Normalize: remove leading slash
    const key = path.startsWith("/") ? path.slice(1) : path;

    // Fetch from R2
    const object = await env[BUCKET_NAME].get(key);

    if (!object) {
      // Try index.html for SPA fallback (if serving HTML from same bucket)
      if (!path.includes(".")) {
        const indexObject = await env[BUCKET_NAME].get("index.html");
        if (indexObject) {
          return buildResponse(indexObject, path, CACHE_HTML, request);
        }
      }
      return new Response("Not Found", { status: 404 });
    }

    // Determine cache policy
    const cacheControl = getCacheControl(path);

    return buildResponse(object, path, cacheControl, request);
  },
};

/**
 * Build a Response with proper cache, CORS, and security headers.
 */
function buildResponse(object, path, cacheControl, request) {
  const headers = new Headers();

  // Content type from R2 metadata
  if (object.httpMetadata?.contentType) {
    headers.set("Content-Type", object.httpMetadata.contentType);
  }

  // Cache headers
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", object.httpEtag);

  // CORS headers — required for fonts loaded from CDN domain
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = [
    "https://youandinotai.com",
    "https://www.youandinotai.com",
  ];
  if (allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Immutable directive for fingerprinted assets
  if (cacheControl.includes("immutable")) {
    headers.set("X-Cache-Status", "IMMUTABLE");
  }

  return new Response(object.body, {
    headers,
    status: 200,
  });
}

/**
 * Determine the appropriate Cache-Control value for a given path.
 */
function getCacheControl(path) {
  // HTML files: never cache
  if (path.endsWith(".html")) {
    return CACHE_HTML;
  }

  // Fingerprinted assets: 1 year immutable
  if (FINGERPRINTED_RE.test(path)) {
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    if (IMMUTABLE_EXTENSIONS.has(ext)) {
      return CACHE_IMMUTABLE;
    }
  }

  // Everything else: moderate cache
  return CACHE_MODERATE;
}
```

### Deploy the Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Create the worker project
mkdir -p infrastructure/cloudflare/worker
cd infrastructure/cloudflare/worker

# Initialize
wrangler init antigravity-cdn-worker

# Configure wrangler.toml (see below)
# Deploy
wrangler deploy
```

### `wrangler.toml`

```toml
name = "antigravity-cdn-worker"
main = "worker.js"
compatibility_date = "2025-01-01"

[[r2_buckets]]
binding = "antigravity-assets"
bucket_name = "antigravity-assets"

# Route the worker to the CDN domain
routes = [
  { pattern = "cdn.youandinotai.com/*", zone_name = "youandinotai.com" }
]
```

---

## 4. Cache Invalidation

After deploying new assets, purge the Cloudflare cache for changed files:

```bash
# Purge specific files (recommended — only purge what changed)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"files":["https://cdn.youandinotai.com/assets/main-abc12345.js"]}'

# Purge everything (nuclear option — use sparingly)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

---

## 5. Monitoring

- **R2 Dashboard:** Monitor storage usage, request counts, and bandwidth.
- **Worker Analytics:** Check request volume, CPU time, and errors in the Worker dashboard.
- **Cache Hit Ratio:** Monitor via Cloudflare Analytics → Caching.

---

## 6. Cost Considerations

- **R2 Storage:** $0.015/GB/month (no egress fees).
- **R2 Operations:** Class A (write) $4.50/million, Class B (read) $0.36/million.
- **Cloudflare Workers:** Free tier = 100,000 requests/day. Paid = $5/month for 10M requests.
- **Bandwidth:** Free through Cloudflare CDN (no egress charges from R2 via Worker).
