# CampaignHero Component Specification

## Component Name

CampaignHero

## Overview

Primary hero component for the Q3 "Connection with Purpose" campaign landing page.

## Props/State

### Props

| Prop        | Type                                  | Required | Description                |
| ----------- | ------------------------------------- | -------- | -------------------------- |
| variant     | 'volunteer' \| 'community' \| 'story' | Yes      | Visual theme variant       |
| headline    | string                                | Yes      | Main campaign headline     |
| subheadline | string                                | Yes      | Supporting text            |
| ctaText     | string                                | Yes      | Call-to-action button text |
| imageUrl    | string                                | Yes      | Background/image URL       |
| impactStat  | object                                | No       | Statistical impact data    |

### State

| State     | Type    | Description                 |
| --------- | ------- | --------------------------- |
| isVisible | boolean | Controls entrance animation |
| isLoaded  | boolean | Image loading state         |
| isHovered | boolean | Mouse hover state           |

## Behavior Description

### Initial Load

1. Component renders with skeleton loader
2. Background image loads with progressive enhancement
3. Content fades in with staggered animation
4. CTA button becomes focusable after load

### User Interactions

1. **CTA Button Click**: Navigate to sign-up flow
2. **Background Click**: Navigate to event browsing
3. **Impact Stat Click**: Navigate to impact page
4. **Hover States**: Subtle elevation effect on interactive elements

### Responsive Behavior

1. **Mobile (<768px)**: Single column layout, full-width button
2. **Tablet (768px-1024px)**: Split layout with adjusted proportions
3. **Desktop (>1024px)**: Maximum container width with side padding

### Performance Considerations

1. Lazy load background images below the fold
2. Preload hero image with high priority
3. Use skeleton loader during image fetch
4. Implement intersection observer for entrance animations

## Copy Stubs

### Default Variants

**Volunteer Variant:**

- headline: "Volunteer While You Connect"
- subheadline: "Join events that bring people together AND support children's causes through our transparent contractual revenue disbursement model."
- ctaText: "Find Service Opportunities"

**Community Variant:**

- headline: "Community Over Compatibility"
- subheadline: "Meet people through shared activities that matter - not just matching algorithms that expire."
- ctaText: "Explore Community Events"

**Story Variant:**

- headline: "Stories That Matter"
- subheadline: "Discover how real connections here are funding educational programs and recreational activities for kids who need them most."
- ctaText: "Read Impact Stories"

### Impact Statistics

- stat1: { value: "1000+", label: "verified users attending events" }
- stat2: { value: "$15K", label: "contractual revenue disbursement goal" }
- stat3: { value: "8", label: "foundation cities expanding to" }

## Accessibility Notes

### Semantic Structure

```jsx
<section aria-labelledby="campaign-hero-heading">
  <h1 id="campaign-hero-heading">{headline}</h1>
  <p>{subheadline}</p>
  <button aria-describedby="cta-description">{ctaText}</button>
  <p id="cta-description">Join our community-focused platform</p>
</section>
```

### Keyboard Navigation

- Tab sequence follows visual reading order
- Enter/space activate primary CTA
- ESC key closes any opened overlays
- Arrow keys navigate carousel variants

### Screen Reader Support

- Landmark regions properly labeled
- Descriptive alt text for decorative images
- ARIA-live regions for dynamic content
- Skip link for keyboard users

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus trapping in modal states
- Programmatic focus movement
- Consistent focus styling across browsers

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .hero-animation {
    animation: none;
    transition: none;
  }
}
```

## Technical Implementation

### CSS Classes

```css
.campaign-hero {
  /* Base styles using design tokens */
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--spacing-mobile-padding);
}

.campaign-hero__content {
  max-width: var(--breakpoint-md);
  margin: 0 auto;
}

.campaign-hero__cta {
  background-color: var(--brand-primary);
  color: var(--text-inverse);
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-bold);
}
```

### React Component Structure

```jsx
const CampaignHero = ({ variant, headline, subheadline, ctaText, imageUrl, impactStat }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Entrance animation trigger
    setIsVisible(true);
  }, []);

  return (
    <section className={`campaign-hero campaign-hero--${variant}`}>
      <div className="campaign-hero__background">
        <img src={imageUrl} onLoad={() => setIsLoaded(true)} alt="" aria-hidden="true" />
      </div>
      <div className="campaign-hero__content">
        <h1 className="campaign-hero__headline">{headline}</h1>
        <p className="campaign-hero__subheadline">{subheadline}</p>
        <button className="campaign-hero__cta" onClick={handleCTAClick}>
          {ctaText}
        </button>
        {impactStat && (
          <div className="campaign-hero__stats">
            <StatCard value={impactStat.value} label={impactStat.label} />
          </div>
        )}
      </div>
    </section>
  );
};
```

## Dependencies

- React 19 (front-end framework)
- Design system tokens (CSS variables)
- Intersection Observer API (for animations)
- CSS Grid/Flexbox (layout)

## Testing Requirements

1. Unit tests for all prop combinations
2. Accessibility audit with axe-core
3. Cross-browser compatibility check
4. Performance budget adherence (<500KB total)
5. Mobile viewport rendering verification

---

_Component specification aligns with YouAndINotAI design system and mobile-first principles._
