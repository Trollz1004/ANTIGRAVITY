# Image Optimization Guide (OPU-103)

## Overview

This document describes the image optimization approach implemented for the
ANTIGRAVITY frontend (`frontend/react-app`). The goal is to deliver images
efficiently across devices and connection speeds by leveraging modern browser
features: **WebP format**, **responsive srcset**, and **lazy loading**.

## Architecture

### Component: `OptimizedImage`

**Location:** `src/components/OptimizedImage.tsx`

A drop-in replacement for `<img>` tags that renders a `<picture>` element with:

1. **WebP `<source>`** — served to browsers that support WebP (smaller file sizes)
2. **Fallback `<source>`** — original format (JPEG, PNG, etc.) for older browsers
3. **Responsive `srcset`** — 4 breakpoints so the browser picks the right size
4. **`loading="lazy"`** — defers off-screen images until the user scrolls near them

### Utility: `imageOptimizer`

**Location:** `src/utils/imageOptimizer.ts`

Pure functions for building srcset strings, checking WebP support, and
determining optimal image dimensions:

| Function | Purpose |
|---|---|
| `generateSrcSet(src, widths)` | Build srcset for original format |
| `generateWebPSrcSet(src, widths)` | Build srcset for WebP variants |
| `getWebPPath(src)` | Get the `.webp` equivalent path |
| `supportsWebP()` | Feature-detect WebP support |
| `getOptimalWidth(widths)` | Pick best width for current viewport |
| `buildResponsiveSources(src, widths, sizes)` | Build all sources in one call |

## Responsive Breakpoints

| Width | Typical Use |
|---|---|
| 320w | Mobile portrait |
| 640w | Mobile landscape / small tablet |
| 1024w | Tablet / small desktop |
| 1920w | Desktop / high-DPR displays |

## Usage

```tsx
import { OptimizedImage } from '../components/OptimizedImage';

// Basic — lazy-loaded, WebP with fallback, responsive srcset
<OptimizedImage src="/hero-bg.png" alt="Hero background" />

// With custom className and widths
<OptimizedImage
  src="/founder-josh.jpg"
  alt="Founder Josh"
  className="rounded-2xl shadow-lg"
  widths={[320, 640, 1024]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Above-the-fold — eager loading, no WebP
<OptimizedImage
  src="/logo.png"
  alt="Logo"
  loading="eager"
  webp={false}
/>
```

## Images in `public/`

The following images are available in `frontend/react-app/public/` and can be
used with `OptimizedImage`:

| File | Type | Suggested Use |
|---|---|---|
| `hero-bg.png` | PNG | Page hero backgrounds |
| `logo.png` | PNG | Branding / nav |
| `og-image.png` | PNG | Open Graph / social sharing |
| `founder-josh.jpg` | JPEG | Founder profile |
| `founder-josh.png` | PNG | Founder profile (alternate) |
| `founder-meme-opus.png` | PNG | Meme / community |
| `icebreaker.jpg` | JPEG | Chat icebreaker |
| `heart-fingerprint.png` | PNG | Feature graphics |
| `fingerprint-heart.jpg` | JPEG | Feature graphics |
| `ace-spades-smoke.jpg` | JPEG | Card suit imagery |
| `ace-hearts-crystal.jpg` | JPEG | Card suit imagery |
| `dateappwatermoonlight.jpg` | JPEG | App imagery |
| `bot-shield-logo.png` | PNG | Safety badge |
| `trollz-discord.png` | PNG | Discord community |
| `qrcode.png` | PNG | QR codes |
| `joshuatom-avatar.svg` | SVG | Avatar (inline recommended) |
| `faceless-avatar.svg` | SVG | Default avatar (inline recommended) |

## Images in `marketing-assets/`

The `marketing-assets/` directory at the repo root contains the master copies
and marketing-specific variants:

- `marketing-assets/youandinotai-public/` — mirror of `public/` for CDN deployment
- `marketing-assets/assets/` — high-res source images and social card templates
- `marketing-assets/assets/social/` — social media variations (launch, verify, urgency)
- `marketing-assets/data/` — content calendars, tweet schedules, caption banks

## Recommended Next Steps

### 1. Automated WebP/AVIF Pipeline

Install `sharp` or `imagemin` in the build process to auto-generate optimized
variants at all breakpoints:

```bash
npm install -D sharp
```

Create a build script (e.g., `scripts/optimize-images.js`) that:

1. Reads all images from `public/`
2. Generates WebP variants at 320, 640, 1024, 1920 widths
3. Optionally generates AVIF variants for next-gen browsers
4. Outputs to `public/` with the naming convention `{base}-{width}w.{ext}`

### 2. AVIF Support

Add an additional `<source type="image/avif">` to `OptimizedImage` once AVIF
variants are being generated. AVIF offers ~50% smaller files than JPEG at
equivalent quality.

### 3. CDN Integration

For production, consider serving images through a CDN with on-the-fly
transformation (e.g., Cloudflare Images, Imgix, Cloudinary). This eliminates
the need for pre-generated variants and allows the browser to request exactly
the size it needs via URL parameters.

### 4. Blur Hash Placeholders

For a polished loading experience, generate blur hash strings for each image
and render them as placeholders while the full image loads. Libraries like
`react-blurhash` or `plaiceholder` can help.

### 5. Image Audit

Run Lighthouse or WebPageTest on key pages to measure the impact of image
optimization. Target:
- **Largest Contentful Paint (LCP)** < 2.5s
- **Cumulative Layout Shift (CLS)** < 0.1 (always set `width`/`height` or use `aspect-ratio`)

## Naming Convention for Generated Variants

```
{base}-{width}w.{format}

Examples:
  hero-bg-320w.webp
  hero-bg-640w.webp
  hero-bg-1024w.webp
  hero-bg-1920w.webp
  hero-bg-320w.png
  hero-bg-640w.png
  ...
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| WebP | ✅ 32+ | ✅ 65+ | ✅ 14+ | ✅ 18+ |
| srcset | ✅ 34+ | ✅ 38+ | ✅ 9.1+ | ✅ 13+ |
| lazy loading | ✅ 77+ | ✅ 75+ | ✅ 15.4+ | ✅ 79+ |
| `<picture>` | ✅ 38+ | ✅ 38+ | ✅ 9.1+ | ✅ 13+ |
| AVIF | ✅ 85+ | ✅ 93+ | ✅ 16+ | ✅ 121+ |

> **Note:** As of 2026, WebP support is at ~97% globally. The fallback path
> ensures the remaining ~3% still receive images correctly.
