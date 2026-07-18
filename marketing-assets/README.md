# Marketing Assets

## Overview

This directory contains all visual assets, brand materials, data files, and public-facing static content for **YouAndINotAI** — a verified dating platform that eliminates bots using V8 Cloud Verification.

- **Brand**: YouAndINotAI
- **Tagline**: No Bots. Real Humans. V8 Cloud Verification.
- **URL**: youandinotai.com
- **Handle**: @YouAndiNotAi

---

## Directory Structure

```
marketing-assets/
├── assets/                        # Generated visual assets (images, logos, social)
│   ├── logo/                      # Brand logos in all standard sizes
│   │   ├── logo-app-icon-1024.png
│   │   ├── logo-social-profile-400.png
│   │   ├── logo-favicon-32.png
│   │   ├── logo-og-image-1200x630.png
│   │   ├── logo-watermark-256.png
│   │   ├── logo-dark-bg-512.png
│   │   ├── logo-dark-bg-256.png
│   │   ├── logo-light-bg-512.png
│   │   └── YouandinotaiTwitterprofile.png
│   ├── social/                    # Platform-specific social media assets
│   │   ├── instagram-feed/        # 15 feed posts (1080x1080)
│   │   ├── instagram-stories/     # 10 stories (1080x1920)
│   │   ├── tiktok/                # 5 thumbnails (1080x1920)
│   │   ├── twitter/               # 10 cards (1200x675)
│   │   ├── pinterest/             # 8 pins (1000x1500)
│   │   ├── countdown/             # Countdown posts (multi-platform)
│   │   ├── variations/            # A/B test variations (launch, verify, urgency)
│   │   └── grok-video-*.mp4       # Generated video content
│   ├── marketing/                 # Standalone marketing images
│   │   ├── onlinerecycle_impact_shriners.png
│   │   ├── youandinotai_botshield_card_vertical.png
│   │   └── youandinotai_hero_moonlight.png
│   ├── archive/                   # Deprecated/legacy assets (see Archive Policy)
│   ├── generate_all_assets.py     # Master asset generation script
│   ├── assets_manifest.json       # Machine-readable asset manifest
│   └── README.md                  # Detailed assets documentation
├── data/                          # Marketing data, copy, and scheduling
│   ├── caption-bank.json          # Full caption library for social posts
│   ├── caption-bank-fresh.json    # Fresh/updated caption set
│   ├── twitter-drip-schedule.json # Twitter/X drip campaign schedule
│   ├── tweets-day1-feb17.json     # Launch day tweet content (Feb 17)
│   ├── reddit-linkedin-expansion.json  # Reddit & LinkedIn post content
│   ├── intake-registry.csv        # Asset intake tracking
│   ├── assets_manifest.json       # Manifest copy for data pipeline
│   ├── archive/                   # Deprecated data snapshots
│   └── README.md                  # Data directory notes
└── youandinotai-public/           # Public-facing static files (web deploy)
    ├── logo.png                   # Primary logo
    ├── hero-bg.png                # Hero background image
    ├── og-image.png               # Open Graph preview image
    ├── founder-josh.jpg/png       # Founder photos
    ├── faceless-avatar.svg        # Anonymous avatar
    ├── joshuatom-avatar.svg       # Joshua Coleman avatar
    ├── bot-shield-logo.png        # Bot Shield product logo
    ├── heart-fingerprint.png      # Brand motif (heart + fingerprint)
    ├── ace-hearts-crystal.jpg     # Card-themed brand imagery
    ├── ace-spades-smoke.jpg       # Card-themed brand imagery
    ├── icebreaker.jpg             # Icebreaker feature imagery
    ├── dateappwatermoonlight.jpg  # App screenshot/mockup
    ├── qrcode.png                 # QR code for the platform
    ├── trollz-discord.png         # Discord community imagery
    ├── _headers                    # Cloudflare headers config
    ├── _redirects                 # Cloudflare redirects config
    ├── _worker.js                 # Cloudflare Worker script
    └── robots.txt                 # Search engine crawler rules
```

---

## Subdirectory Guide

### `assets/` — Visual Asset Pipeline

The core visual asset library. All images here are either generated programmatically or curated brand assets.

- **`logo/`** — Complete logo set in every standard size (favicon 32px → app icon 1024px). Includes dark/light background variants, OG image, watermark, and Twitter profile.
- **`social/`** — Platform-optimized content ready to post. Each subdirectory targets a specific platform and format. All social assets include the logo watermark.
- **`marketing/`** — Standalone marketing images (hero shots, partnership cards, impact graphics).
- **`archive/`** — Deprecated assets retained for reference (see Archive Policy below).
- **`generate_all_assets.py`** — Master Python script (Pillow/PIL) that regenerates all logo and social assets. Run from `assets/` directory.
- **`assets_manifest.json`** — Machine-readable listing of every asset with path, dimensions, format, and file size.

### `data/` — Marketing Data & Copy

Structured data files powering social campaigns, content calendars, and automation pipelines.

- **`caption-bank.json`** — Full library of social media captions organized by campaign/theme.
- **`caption-bank-fresh.json`** — Updated/cleaned caption set for current campaigns.
- **`twitter-drip-schedule.json`** — Scheduled tweet content for drip campaigns.
- **`tweets-day1-feb17.json`** — Launch day (Feb 17) tweet content.
- **`reddit-linkedin-expansion.json`** — Post content for Reddit and LinkedIn expansion.
- **`intake-registry.csv`** — Tracking log for asset intake requests.
- **`archive/`** — Deprecated data snapshots (e.g., legacy catalog exports). Do not use for live copy.

### `youandinotai-public/` — Public Static Files

Static assets deployed to the public-facing website (Cloudflare Pages). These are the files served directly to users and referenced by the frontend.

- Brand images (logo, hero, OG, avatars)
- Product imagery (bot shield, icebreaker, app screenshots)
- Platform assets (QR code, Discord graphics)
- Cloudflare config files (`_headers`, `_redirects`, `_worker.js`)
- `robots.txt` for SEO

---

## Brand Guidelines

| Element        | Value                                               |
| -------------- | --------------------------------------------------- |
| **Name**       | YouAndINotAI                                        |
| **Tagline**    | No Bots. Real Humans. V8 Cloud Verification.        |
| **URL**        | youandinotai.com                                    |
| **Handle**     | @YouAndiNotAi                                      |
| **Background** | `#020617` (deep space dark)                         |
| **Gradient**   | `#22d3ee` → `#ec4899` (cyan→pink — brand gradient)  |
| **Font**       | Outfit (Google Fonts) / Arial fallback              |
| **Tone**       | Confident, urgent, real-talk — NOT corporate        |

---

## Naming Conventions

- **Logos**: `logo-{variant}-{size}.png` (e.g., `logo-dark-bg-512.png`)
- **Social posts**: `{platform}-{sequence}-{slug}.png` (e.g., `ig-feed-01-launch.png`)
- **Countdown**: `countdown-{number}-{platform}-{format}.png` (e.g., `countdown-97-instagram-feed.png`)
- **Variations**: `variation-{number}-{campaign}-v{version}.png` (e.g., `variation-01-launch-v1.png`)
- **Marketing**: Descriptive kebab-case (e.g., `youandinotai_hero_moonlight.png`)
- **Data**: `{content-type}-{descriptor}.json` (e.g., `caption-bank-fresh.json`)
- **Public**: Descriptive kebab-case, lowercase (e.g., `bot-shield-logo.png`)

---

## Adding New Assets

### Social Media Posts

1. Place generated images in the correct `assets/social/{platform}/` subdirectory.
2. Follow the existing naming convention: `{platform-code}-{sequence}-{slug}.png`
3. Update `assets/assets_manifest.json` with the new asset's metadata.
4. Add corresponding captions to `data/caption-bank.json` if applicable.

### Logos & Brand Assets

1. Place in `assets/logo/` using the `logo-{variant}-{size}.png` naming pattern.
2. Ensure transparent backgrounds where appropriate.
3. Update the manifest.

### Marketing Images

1. Place standalone marketing images in `assets/marketing/`.
2. Use descriptive kebab_case names with underscores allowed.

### Data Files

1. Add new JSON/CSV files to `data/`.
2. Include a descriptive filename and update `data/README.md` if the file's purpose isn't self-evident.

### Public Files

1. Place in `youandinotai-public/`.
2. Ensure files are optimized for web (compressed images, minified JS).
3. Update Cloudflare config files (`_headers`, `_redirects`) if adding new routes.

---

## Image Requirements

| Platform         | Dimensions      | Format |
| ---------------- | --------------- | ------ |
| Instagram Feed   | 1080 × 1080     | PNG    |
| Instagram Story  | 1080 × 1920     | PNG    |
| TikTok           | 1080 × 1920     | PNG    |
| Twitter/X Card   | 1200 × 675      | PNG    |
| Pinterest Pin    | 1000 × 1500     | PNG    |
| Open Graph       | 1200 × 630      | PNG    |
| App Icon         | 1024 × 1024     | PNG    |
| Favicon          | 32 × 32         | PNG    |
| Social Profile   | 400 × 400       | PNG    |

- All social assets should include the logo watermark (bottom-right corner).
- Use brand gradient (`#22d3ee` → `#ec4899` = cyan→pink) for backgrounds and accents.
- Dark background: `#020617` (deep space dark).

---

## Asset Generation

The `assets/generate_all_assets.py` script is the master pipeline for regenerating all visual assets.

**Requirements**: Python 3, Pillow (`pip install Pillow`), NumPy (`pip install numpy`)

**Regenerate all assets**:
```bash
cd C:\Antigravity\marketing-assets\assets
python generate_all_assets.py
```

**Generate a single custom post** (on-demand):
```bash
cd C:\Antigravity\scripts
python generate_social_post.py \
  --platform instagram-feed \
  --headline "YOUR HEADLINE\nLINE TWO" \
  --body "Body text here" \
  --emoji "🔥" \
  --output my-custom-post
```

**Supported platforms**: `instagram-feed`, `instagram-story`, `tiktok`, `twitter`, `pinterest`, `facebook`, `linkedin`

---

## Archive Policy

The `assets/archive/` and `data/archive/` directories contain deprecated assets and data snapshots that are **no longer in active use** but are retained for historical reference.

**What goes in archive**:
- Superseded logo or design iterations
- Old social media content from previous campaigns
- Legacy data exports (e.g., `square_catalog.legacy-2026-04-01.json`)
- Any asset that has been replaced by a newer version

**Rules**:
- Never delete archived files without explicit approval.
- Do not reference archived assets in active campaigns or live copy.
- When archiving, move the file to `archive/` and add a dated subfolder if appropriate (e.g., `archive/root-cleanup-2026-03-20/`).
- Archived data files should include a note in the parent `README.md` explaining why they were archived.

---

> "AI for kids in need, not adults with greed."
>
> **Until no kid is in need. #FORtheKIDS 🚀**
