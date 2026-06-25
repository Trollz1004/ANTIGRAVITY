# YouAndINotAI Design System Tokens

## Overview

This document defines the core design tokens for the YouAndINotAI platform. These tokens ensure consistency across all UI components while maintaining our commitment to accessibility, mobile-first design, and trust-building.

## Color Tokens

### Brand Colors

| Token               | Value                  | Usage                                    |
| ------------------- | ---------------------- | ---------------------------------------- |
| `--brand-primary`   | #FF4F00 (Alert Orange) | Primary brand color, key actions, alerts |
| `--brand-secondary` | #111111 (Black)        | Secondary actions, text, backgrounds     |
| `--brand-accent`    | #FFF4EF (Warm Cream)   | Backgrounds, subtle UI elements          |

### Functional Colors

| Token             | Value                   | Usage                                |
| ----------------- | ----------------------- | ------------------------------------ |
| `--color-success` | #10B981 (Safe Green)    | Success states, positive actions     |
| `--color-warning` | #F59E0B (Warning Amber) | Warnings, caution states             |
| `--color-error`   | #EF4444 (Danger Red)    | Errors, dangerous actions            |
| `--color-info`    | #3B82F6 (Blue)          | Informational messages, links        |
| `--color-neutral` | #6B7280 (Gray)          | Neutral information, disabled states |

### Text Colors

| Token              | Value                | Usage                    |
| ------------------ | -------------------- | ------------------------ |
| `--text-primary`   | #111111 (Black)      | Main text content        |
| `--text-secondary` | #6B7280 (Gray)       | Secondary text, captions |
| `--text-tertiary`  | #9CA3AF (Light Gray) | Placeholder text, hints  |
| `--text-inverse`   | #FFFFFF (White)      | Text on dark backgrounds |

### Background Colors

| Token            | Value                | Usage                          |
| ---------------- | -------------------- | ------------------------------ |
| `--bg-primary`   | #FFFFFF (White)      | Main backgrounds               |
| `--bg-secondary` | #F9FAFB (Light Gray) | Secondary backgrounds, cards   |
| `--bg-tertiary`  | #F3F4F6 (Light Gray) | Tertiary backgrounds, dividers |

### Safety Feature Colors

| Token              | Value                   | Usage                      |
| ------------------ | ----------------------- | -------------------------- |
| `--safety-alert`   | #FF4F00 (Alert Orange)  | High priority alerts       |
| `--safety-blocked` | #EF4444 (Danger Red)    | Blocked/restricted states  |
| `--safety-muted`   | #F59E0B (Warning Amber) | Muted/temporary states     |
| `--safety-safe`    | #10B981 (Safe Green)    | Protected/safe states      |
| `--safety-neutral` | #6B7280 (Gray)          | Neutral safety information |

### Volunteer Feature Colors

| Token                     | Value            | Usage                         |
| ------------------------- | ---------------- | ----------------------------- |
| `--volunteer-kids`        | #FF6B9D (Pink)   | Children-related volunteering |
| `--volunteer-elderly`     | #FFA500 (Orange) | Elderly care volunteering     |
| `--volunteer-environment` | #4ADE80 (Green)  | Environmental volunteering    |
| `--volunteer-animals`     | #06B6D4 (Cyan)   | Animal care volunteering      |
| `--volunteer-community`   | #8B5CF6 (Purple) | Community service             |

### Privacy Feature Colors

| Token                | Value              | Usage                      |
| -------------------- | ------------------ | -------------------------- |
| `--privacy-primary`  | #0EA5E9 (Sky Blue) | Privacy features, controls |
| `--privacy-secure`   | #10B981 (Emerald)  | Secure/data safe states    |
| `--privacy-warning`  | #F59E0B (Amber)    | Attention/limited privacy  |
| `--privacy-critical` | #EF4444 (Rose)     | Critical/deletion states   |

## Typography Tokens

### Font Families

| Token                   | Value                                                                               | Usage                                  |
| ----------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- |
| `--font-family-base`    | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif | Default body text                      |
| `--font-family-heading` | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif | Headings (same as base for simplicity) |

### Font Sizes

| Token              | Value           | Usage                 |
| ------------------ | --------------- | --------------------- |
| `--font-size-xs`   | 0.75rem (12px)  | Helper text, captions |
| `--font-size-sm`   | 0.875rem (14px) | Secondary text        |
| `--font-size-base` | 1rem (16px)     | Body text             |
| `--font-size-lg`   | 1.125rem (18px) | Lead paragraphs       |
| `--font-size-xl`   | 1.25rem (20px)  | Subheadings           |
| `--font-size-2xl`  | 1.5rem (24px)   | Headings              |
| `--font-size-3xl`  | 1.875rem (30px) | Large headings        |
| `--font-size-4xl`  | 2.25rem (36px)  | Page titles           |

### Font Weights

| Token                    | Value | Usage                     |
| ------------------------ | ----- | ------------------------- |
| `--font-weight-normal`   | 400   | Regular text              |
| `--font-weight-medium`   | 500   | Emphasized text           |
| `--font-weight-semibold` | 600   | Subheadings               |
| `--font-weight-bold`     | 700   | Headings, strong emphasis |

### Line Heights

| Token                   | Value | Usage      |
| ----------------------- | ----- | ---------- |
| `--line-height-tight`   | 1.25  | Headings   |
| `--line-height-normal`  | 1.5   | Body text  |
| `--line-height-relaxed` | 1.625 | Paragraphs |

## Spacing Tokens

### Base Scale

| Token          | Value          | Usage           |
| -------------- | -------------- | --------------- |
| `--spacing-0`  | 0              | No spacing      |
| `--spacing-1`  | 0.25rem (4px)  | Minimal spacing |
| `--spacing-2`  | 0.5rem (8px)   | Small spacing   |
| `--spacing-3`  | 0.75rem (12px) | Compact spacing |
| `--spacing-4`  | 1rem (16px)    | Default spacing |
| `--spacing-5`  | 1.25rem (20px) | Medium spacing  |
| `--spacing-6`  | 1.5rem (24px)  | Large spacing   |
| `--spacing-8`  | 2rem (32px)    | XL spacing      |
| `--spacing-10` | 2.5rem (40px)  | XXL spacing     |
| `--spacing-12` | 3rem (48px)    | XXXL spacing    |

### Component Spacing

| Token                        | Value            | Usage                     |
| ---------------------------- | ---------------- | ------------------------- |
| `--spacing-input-padding`    | var(--spacing-3) | Input field padding       |
| `--spacing-button-padding-h` | var(--spacing-4) | Button horizontal padding |
| `--spacing-button-padding-v` | var(--spacing-2) | Button vertical padding   |
| `--spacing-card-padding`     | var(--spacing-4) | Card inner padding        |
| `--spacing-mobile-padding`   | var(--spacing-4) | Mobile viewport padding   |
| `--spacing-desktop-padding`  | var(--spacing-6) | Desktop viewport padding  |

## Border Tokens

### Border Widths

| Token                   | Value | Usage              |
| ----------------------- | ----- | ------------------ |
| `--border-width-none`   | 0     | No border          |
| `--border-width-thin`   | 1px   | Default borders    |
| `--border-width-medium` | 2px   | Emphasized borders |
| `--border-width-thick`  | 4px   | Strong borders     |

### Border Radius

| Token                  | Value          | Usage                       |
| ---------------------- | -------------- | --------------------------- |
| `--border-radius-none` | 0              | Sharp corners               |
| `--border-radius-sm`   | 0.25rem (4px)  | Small rounded corners       |
| `--border-radius-md`   | 0.5rem (8px)   | Medium rounded corners      |
| `--border-radius-lg`   | 0.75rem (12px) | Large rounded corners       |
| `--border-radius-full` | 9999px         | Fully rounded (pill shapes) |

## Shadow Tokens

| Token            | Value                                                                   | Usage          |
| ---------------- | ----------------------------------------------------------------------- | -------------- |
| `--shadow-none`  | none                                                                    | No shadow      |
| `--shadow-sm`    | 0 1px 2px 0 rgba(0, 0, 0, 0.05)                                         | Subtle depth   |
| `--shadow-md`    | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)   | Moderate depth |
| `--shadow-lg`    | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) | Strong depth   |
| `--shadow-inner` | inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)                                   | Inner shadows  |

## Breakpoint Tokens

| Token             | Value  | Usage                    |
| ----------------- | ------ | ------------------------ |
| `--breakpoint-xs` | 0px    | Extra small devices      |
| `--breakpoint-sm` | 576px  | Small devices (phones)   |
| `--breakpoint-md` | 768px  | Medium devices (tablets) |
| `--breakpoint-lg` | 992px  | Large devices (desktops) |
| `--breakpoint-xl` | 1200px | Extra large devices      |

## Z-Index Tokens

| Token                      | Value | Usage                     |
| -------------------------- | ----- | ------------------------- |
| `--z-index-dropdown`       | 1000  | Dropdown menus            |
| `--z-index-sticky`         | 1020  | Sticky elements           |
| `--z-index-fixed`          | 1030  | Fixed positioned elements |
| `--z-index-modal-backdrop` | 1040  | Modal backdrop            |
| `--z-index-modal`          | 1050  | Modals                    |
| `--z-index-popover`        | 1060  | Popovers                  |
| `--z-index-tooltip`        | 1070  | Tooltips                  |

## Transition Tokens

| Token                          | Value                        | Usage                |
| ------------------------------ | ---------------------------- | -------------------- |
| `--transition-duration-fast`   | 150ms                        | Quick transitions    |
| `--transition-duration-normal` | 300ms                        | Standard transitions |
| `--transition-duration-slow`   | 500ms                        | Slow transitions     |
| `--transition-easing`          | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing      |

## Accessibility Tokens

| Token                 | Value                | Usage                                |
| --------------------- | -------------------- | ------------------------------------ |
| `--focus-ring-color`  | var(--brand-primary) | Focus indicator color                |
| `--focus-ring-width`  | 3px                  | Focus ring thickness                 |
| `--focus-ring-offset` | 2px                  | Space between element and focus ring |
| `--min-target-size`   | 48px                 | Minimum touch target size            |

---

## Usage Guidelines

### Mobile-First Implementation

1. Design for the smallest breakpoint first (`--breakpoint-xs`)
2. Use relative units (rem) for consistent scaling
3. Ensure all touch targets meet minimum size requirements
4. Prioritize vertical spacing over horizontal spacing

### Accessibility Compliance

1. Maintain minimum 4.5:1 color contrast ratios
2. Use semantic HTML with proper ARIA attributes
3. Ensure focus states are visible and consistent
4. Support reduced motion preferences

### Trust-Building Considerations

1. Use consistent colors for similar actions
2. Provide clear visual feedback for all interactions
3. Avoid deceptive patterns or hidden actions
4. Maintain transparency in all UI states

These design tokens should be used consistently across all platform components to create a cohesive, accessible, and trustworthy user experience.
