# MAR-4: Visual Assets for CMO Launch Content

**To:** CMO (MAR-3)
**From:** UX Designer (MAR-4)
**Date:** 2026-07-17
**Status:** Asset specification — ready for production

---

## Background

CMO launch strategy (MAR-3) published at `docs/strategy/launch-marketing-strategy.md`. The UX team has audited the design system and brand guidelines to specify the visual assets needed for launch week (Phase 2: Launch, Week 1).

All assets follow the ANTIGRAVITY design system (`_design-system/`) and brand messaging guidelines (`docs/strategy/brand-messaging-guidelines.md`). No charity/donation language. Business-only framing.

---

## Required Visual Assets

### 1. Social Media Graphics

| Asset | Dimensions | Theme | Copy | Priority |
|---|---|---|---|---|
| Launch announcement card | 1200×630px (OG) | Dark navy, cyan gradient heading, verification badge | "Real profiles before real dates." | P0 |
| Bot-Shield explainer card | 1080×1080px (square) | Verification badge on neon skyline, glass overlay | "Every profile passed a human check." | P0 |
| Prompt-first matching card | 1080×1080px | Profile preview UI, cyan accent | "Like or comment on a prompt. Not a swipe." | P1 |
| Safety tools card | 1080×1080px | Shield icons, rose accents | "Report, block, freeze — visible on every screen." | P1 |
| Founding Member card | 1080×1080px | Gold badge, gradient heading | "Founding Member pricing. Locked at signup." | P1 |
| Countdown / teaser series (3) | 1080×1080px | Minimal, cyan text on dark | "Verified humans only." / "Bot-Shield active." / "Prompt-first matching." | P0 |

### 2. Landing Page Assets

| Asset | Notes |
|---|---|
| OG image (1200×630px) | Update `public/og-image.png` with current branding |
| App icon (1024×1024px) | For Google Play Store listing |
| Feature screenshots (16:9) | Phone mockup + feature highlight overlays |

### 3. Email Assets

| Asset | Notes |
|---|---|
| Email header graphic (600×200px) | Lockup: logo + "You're verified. Start matching." |
| Welcome email hero | "Real profiles. Zero bot noise." + CTA button |

---

## Design Specifications

### Color Palette (from design system)

- **Background:** `#020617` (deep navy)
- **Primary action:** `#22d3ee` (cyan-400)
- **Secondary:** `#f472b6` (pink-400)
- **Trust/verification:** `#e9b949` (gold)
- **Text:** `#f8fafc` (slate-50) on dark
- **Glass overlay:** `rgba(15,23,42,0.60)` + `blur(12px)`

### Typography

- **Headings:** Inter, black (900) weight, tracking-tight
- **Body/Mono labels:** JetBrains Mono, 10px, uppercase, tracking-widest
- **Brand gradient headings:** `linear-gradient(to right, #22d3ee, #ec4899)` + clip-text

### Brand Assets Location

- Logo mark: `assets/logo/logo-dark-bg-512.png`
- OG image: `assets/logo/logo-og-image-1200x630.png`
- Lockup: spiral-heart mark + `.ag-brand-heading` wordmark
- Tagline: "No Bots · Real Humans · #UntilNoKidInNeed"

### Approved Copy Patterns

See `docs/strategy/brand-messaging-guidelines.md` for full approved copy. Key patterns:

```
Real profiles before real dates.

[TRUST SIGNAL] + [PLATFORM FEATURE] + [USER OUTCOME]
"Every profile is verified. Bot-Shield stops bots. You match with real humans only."
```

### Prohibited Content

- No "donate", "donation", "solicitation", "charity", "non-profit"
- No "100% safe", "completely safe", "perfect match", "soulmate"
- No "invest", "investor", "returns" (use "member", "subscription")
- No claims about features not yet live (coordinate with CTO)

---

## Production Notes

1. **Tool:** Design team prefers Figma for social assets. All exports at 2x for Retina.
2. **Review:** All copy reviewed by CEO before publishing per brand guidelines.
3. **CTO coordination:** Verify feature availability before making public claims (Square webhook fix is pending per MAR-2).
4. **Format:** PNG for social, SVG for logos, WebP for web where supported.
5. **Delivery:** Assets to be published in `assets/marketing/` directory and shared with CMO.
