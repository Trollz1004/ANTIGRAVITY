# Q3 Campaign: "Connection with Purpose" Design Specification

## Overview

Design specifications for the Q3 2026 "Connection with Purpose" campaign focused on positioning ANTIGRAVITY as the premier platform for meaningful, community-focused social connection.

## Campaign Goals

1. Drive 1000 new user signups during Q3 focused on real-world engagement
2. Position platform as community-focused alternative to traditional dating apps
3. Highlight volunteer events and community service as core features
4. Communicate ethical revenue sharing benefits without violating Florida §496.405

## Design Principles

### Mobile-First Approach

- Prioritize vertical scrolling and thumb-friendly interactions
- Ensure all campaign elements work seamlessly on mobile devices
- Design for quick scanning and clear calls-to-action

### Trust Building Through Transparency

- Use clear, honest language that avoids dark patterns
- Visually demonstrate the connection between user actions and community impact
- Provide immediate feedback on interactions

### Accessibility Compliance

- Maintain 4.5:1+ color contrast ratios
- Follow WCAG 2.1 AA standards for all visual elements
- Ensure appropriate touch target sizes (minimum 48px)

### Emotional Connection

- Use warm, inviting visuals that convey community
- Highlight authentic human connections and real stories
- Emphasize positive outcomes and social impact

## Color Palette

### Primary Campaign Colors

Using existing design system tokens with emphasis on:

- `--brand-primary`: #FF4F00 (Alert Orange) - for primary actions and key messaging
- `--volunteer-community`: #8B5CF6 (Purple) - for community and volunteering elements
- `--safety-safe`: #10B981 (Safe Green) - for positive impact indicators

### Supporting Colors

- `--bg-primary`: #FFFFFF (White) - clean background for readability
- `--text-primary`: #111111 (Black) - high contrast text
- `--text-secondary`: #6B7280 (Gray) - supporting information

## Typography Specifications

### Headlines

- Font Family: `--font-family-heading`
- Sizes:
  - H1: `--font-size-4xl` (36px) - campaign tagline
  - H2: `--font-size-3xl` (30px) - section headers
  - H3: `--font-size-2xl` (24px) - subsection headers

### Body Text

- Font Family: `--font-family-base`
- Sizes:
  - Lead: `--font-size-lg` (18px) - introductory paragraphs
  - Standard: `--font-size-base` (16px) - main content
  - Caption: `--font-size-sm` (14px) - supporting details

## Component Specifications

### Hero Section

**Props/Variants:**

- Variant A: Volunteer-focused imagery
- Variant B: Community event imagery
- Variant C: User success story imagery

**Behavior:**

- Features prominent headline "Connection with Purpose"
- Clear call-to-action button: "Join Community Events"
- Subtext highlighting verified platform access
- Responsive image optimization for mobile bandwidth

**Copy Stubs:**

- Headline: "Real Connections. Real Community."
- Subheadline: "Meet people through shared activities and verified events."
- CTA: "Find Your Community"

### Value Proposition Cards

**Props/Variants:**

- Community Events Card
- Volunteer Opportunities Card
- Impact Stories Card

**Behavior:**

- Swipeable carousel on mobile
- Clickable cards linking to relevant sections
- Icon-based visual cues for quick scanning
- Consistent card sizing and spacing

**Copy Stubs:**

- Community Events: "Face-to-face meetups designed around shared interests"
- Volunteer Opportunities: "Make friends while contributing to community"
- Impact Stories: "See connections made through shared activities"

### Impact Visualization

**Props/Variants:**

- Statistics Dashboard
- Progress Indicators
- Community Map

**Behavior:**

- Animated counters showing platform activity
- Interactive map showing event locations
- Progress bars for event goals
- Auto-refreshing data displays

**Copy Stubs:**

- "Users have participated in \_\_\_ events"
- "$\_\_\_ in platform revenue supports verified operations"
- "\_\_\_ real-world connections formed this quarter"
- "Active in \_\_\_ cities nationwide"

### User Testimonial Carousel

**Props/Variants:**

- Photo + Quote Layout
- Video Preview Layout
- Community Story Layout

**Behavior:**

- Auto-rotating testimonials every 8 seconds
- Manual navigation controls
- Pause on hover/focus for accessibility
- Clear attribution to real users

**Copy Stubs:**

- Testimonial 1: "I found friends who share my values through real events."
- Testimonial 2: "The events here create genuine connections, not just matches."
- Testimonial 3: "Every connection feels valuable - to me and my community."

### Call-to-Action Banner

**Props/Variants:**

- Top Sticky Banner
- Bottom Fixed Banner
- Inline Content Banner

**Behavior:**

- Appears after scrolling 75% of page content
- Dismissible with persistence
- Direct link to sign-up flow
- Mobile-optimized fixed positioning

**Copy Stubs:**

- "Ready to make meaningful connections?"
- "Join thousands already building community through ANTIGRAVITY"
- CTA: "Start Connecting"

## Layout Grid System

### Mobile Layout (0px - 768px)

- Single column layout
- 16px horizontal margins (`--spacing-mobile-padding`)
- 24px vertical spacing between sections
- Full-width hero with contained content

### Tablet/Desktop Layout (768px+)

- Max width 1200px container
- Two-column layout for featured content
- 24px horizontal margins
- 32px vertical spacing between sections

## Animation Specifications

### Entrance Animations

- Fade in elements with 300ms duration (`--transition-duration-normal`)
- Staggered animation for card components
- Opacity transition from 0 to 1
- Easing: `--transition-easing`

### Interactive Feedback

- Button hover: scale transform 1.05 with 150ms (`--transition-duration-fast`)
- Card hover: subtle elevation with box-shadow
- Form focus: color transition with 300ms duration

### Loading States

- Skeleton loaders for dynamic content
- Progress indicators for form submissions
- Smooth transitions between loading and content states

## Accessibility Notes

### Screen Reader Support

- Proper heading hierarchy (H1 → H2 → H3)
- ARIA labels for interactive components
- Skip navigation link for keyboard users
- Descriptive alt text for all images

### Color Contrast Compliance

- All text meets 4.5:1 contrast ratio minimum
- Color alone never conveys critical information
- Focus indicators visible on all backgrounds
- Sufficient color differentiation for colorblind users

### Keyboard Navigation

- Logical tab order through all interactive elements
- Visible focus states using `--focus-ring-color`
- Keyboard operable sliders and carousels
- Escape key closes modal dialogs

### Reduced Motion Support

- Respect user preference for reduced motion
- Disable animations when `prefers-reduced-motion` is set
- Provide alternative feedback mechanisms
- Smooth but non-distracting transitions

## Implementation Requirements

### For CTO (b02a21c7)

1. API endpoints for real-time impact statistics
2. User testimonial content management system
3. Community event calendar integration
4. Analytics tracking for campaign conversion rates

### For CMO (2c40ae74)

1. Final copy approval for all campaign elements
2. Localization requirements for foundation cities
3. A/B testing framework for variant messaging
4. Compliance verification for legal guidelines

## Success Metrics Framework

### Visual Engagement Metrics

- Time spent on campaign landing pages
- Scroll depth through campaign content
- Click-through rates on value proposition cards
- Video play rates for testimonials

### Conversion Metrics

- New user signups from campaign sources
- Event RSVP rates post-exposure
- Volunteer opportunity engagement
- Platform retention rates for campaign users

### Impact Visualization Metrics

- Interaction rates with impact displays
- Share rates of campaign content
- User-generated content submissions
- Referral rates from existing users

---

_This design specification adheres to all platform design principles and legal compliance requirements._
