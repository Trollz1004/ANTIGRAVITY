---
version: alpha
name: YouAndINotAI
description: Human-first, real-people-only social platform. Premium, intimate, trustworthy aesthetic blending cinematic minimalism with warm romantic connection. Bot-shielded dating with intention-first intent and safe planning. State-of-the-art customizable UI.
colors:
  bg: "#0a0a0f"
  surface: "#111114"
  surface-elevated: "#1a1a20"
  text: "#f5f5f7"
  text-muted: "#a1a1aa"
  accent-primary: "#c0264a"
  accent-secondary: "#4f46e5"
  accent-warm: "#d4af37"
  on-accent: "#ffffff"
  border: "rgba(255,255,255,0.08)"
  border-strong: "rgba(255,255,255,0.12)"
typography:
  display:
    fontFamily: Inter
    fontSize: 4.5rem
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.06em"
  h1:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.05em"
  h2:
    fontFamily: Inter
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 600
    letterSpacing: "0.08em"
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
rounded:
  sm: 6px
  md: 12px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
    fontWeight: 700
    letterSpacing: "0.02em"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    border: "1px solid {colors.border-strong}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.xl}"
    padding: 24px
    shadow: "0 4px 20px rgba(0,0,0,0.3)"
  profile-card:
    backgroundColor: "{colors.surface-elevated}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.xl}"
    padding: 16px
  input:
    backgroundColor: "{colors.bg}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

## Overview

YouAndINotAI is a premium, human-verified social and dating platform focused on real people, intention-first intent, and safer connections. The visual identity evokes intimate trust and cinematic elegance — never cold tech, never flashy dating-app cliché. It feels like a private, high-end members club crossed with thoughtful AI assistance: warm where it matters (connection, romance), precise and minimal everywhere else (trust, safety, discovery).

The UI must feel state-of-the-art: buttery smooth interactions, live customizability, refined typography and spacing, subtle depth without glassmorphism overload or heavy borders. It is fully themeable by the user so people can express their personal taste while staying within the brand system.

## Colors

- **bg (#0a0a0f)**: Deep sophisticated near-black canvas. Primary app background.
- **surface (#111114)**: Main card and panel surfaces. Subtle elevation from bg.
- **surface-elevated (#1a1a20)**: Higher emphasis surfaces (profile cards, modals).
- **text (#f5f5f7)**: Primary readable text — warm off-white.
- **text-muted (#a1a1aa)**: Secondary, metadata, disabled.
- **accent-primary (#c0264a)**: Romantic rose-red — the emotional heart (likes, CTAs, verification, connection moments).
- **accent-secondary (#4f46e5)**: Deep indigo for precision, agents, safety, structure.
- **accent-warm (#d4af37)**: Soft gold for premium/founding member moments and subtle luxury.
- **on-accent (#ffffff)**: Text on strong accents.
- Borders are always subtle semi-transparent white for depth on dark surfaces.

**Customizable palettes** (user-selectable, all resolve to the above roles):
- Noir Romance (default): Rose + indigo on deep dark.
- Precision Human: Linear-inspired indigo-dominant.
- Cinematic Luxury: Apple/Superhuman refined neutrals + warm cream accents.
- Warm Heritage: Softer rose-gold dominant.
- Futuristic Intimacy: Refined neon with modern restraint.

## Typography

Inter (variable) for everything except technical labels (JetBrains Mono). Hierarchy through weight, size, and tight negative tracking on display. Generous line-height on body for comfortable reading of conversation starters and bios.

Display and headlines use aggressive compression and high weight for impact. Body is airy and human.

## Layout & Composition

Surface-first philosophy:
- **Explore** surfaces (discovery feed, profiles): Dense but breathable cards, strong visual hierarchy between photo/conversation-starter/intent.
- **Decide** surfaces (onboarding, plans, verification): Clear single primary action, progressive disclosure.
- **Operate** (chat, plans, settings): Clean forms, high affordance controls, subtle live feedback.

Spacing uses a 4px base. Generous whitespace around heroes and major sections. Cards use xl rounding (28px) for premium softness. Minimal solid borders — rely on luminance and subtle borders.

## Elevation & Depth

- Luminance stacking: bg → surface → surface-elevated.
- Subtle soft shadows (0 4px 20px rgba(0,0,0,0.3)) for cards.
- No aggressive glassmorphism or heavy drop shadows.
- Focus states use accent glows (primary rose or indigo).
- Hover: gentle lift + border intensification.

## Components

- Primary buttons: Bold rose, generous padding, rounded-xl, uppercase tracking for action.
- Secondary: Transparent with strong border.
- Profile cards: Elevated surface, prominent photo area, clear conversation-starter quote, verification/status chips, intent tags.
- Inputs: Dark, clean, high contrast.
- Navigation: Minimal, sticky, theme-aware.

## Customizability (Core Feature)

Users can switch themes live in Settings. Changes apply instantly via CSS variables + React context and persist in localStorage.

Controls exposed:
- Theme preset (5 options)
- Accent intensity slider (subtle → bold)
- Density (compact / comfortable)
- Border radius scale
- Font scale

This makes the UI "state-of-the-art" and personal — every user gets a tailored premium experience while the core brand language (trust + romance) remains intact.

## Do's and Don'ts

**Do**
- Use token references everywhere possible.
- Prioritize conversation starters and verification cues in profile UIs.
- Make every interactive element feel premium and deliberate.
- Support live theme switching with instant visual feedback.
- Keep motion purposeful (subtle scale, fade, lift).
- Maintain excellent contrast and accessibility.

**Don't**
- Mix the old cyberpunk neon cyan/pink with the warm retro heavy-border style.
- Use heavy black 4px+ borders or pixel-art shadows.
- Over-decorate with icons or gradients.
- Make buttons or cards feel cheap or generic.
- Ignore user theme choices.

## Motion & Interaction

Use framer-motion for tasteful transitions. Profile cards should feel alive when swiped or liked. Settings changes animate live. Reduced motion respected.

## Brand Voice in UI

Confident, warm, direct, protective. Language is human and clear ("verified", "real profiles", "safer plans"). Never salesy or mission-reserve coded.

This DESIGN.md is the single source of truth for the YouAndINotAI frontend. All agent work (redesign, components, marketing assets) must align with it.