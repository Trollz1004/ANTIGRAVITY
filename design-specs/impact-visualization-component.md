> Current override as of 2026-06-22: this document is historical strategy/spec context only.
> Do not use it to create public mission-funding claims, membership support routing, customer-facing
> disbursement language, membership records/Product launch claims, private accounting mechanics, or alternate
> payment rails. Active public/customer surfaces sell product value: membership, verification,
> support, safety, uptime, pricing, checkout, refunds, receipts, and account access.
# ImpactVisualization Component Specification

## Component Name

ImpactVisualization

## Overview

Dynamic visualization component displaying real-time community impact metrics for the Q3 campaign.

## Props/State

### Props

| Prop            | Type              | Required | Description                                  |
| --------------- | ----------------- | -------- | -------------------------------------------- |
| stats           | Array<ImpactStat> | Yes      | Collection of impact statistics              |
| title           | string            | No       | Section heading                              |
| description     | string            | No       | Supporting text                              |
| isLoading       | boolean           | No       | Loading state indicator                      |
| refreshInterval | number            | No       | Auto-refresh interval in ms (default: 30000) |

### ImpactStat Interface

```typescript
interface ImpactStat {
  id: string;
  value: number | string;
  label: string;
  icon: string; // Icon identifier
  trend?: 'up' | 'down' | 'neutral'; // Optional trend indicator
  change?: number; // Percentage change
}
```

### State

| State          | Type          | Description                  |
| -------------- | ------------- | ---------------------------- |
| currentIndex   | number        | Current carousel slide index |
| isAutoPlaying  | boolean       | Auto-rotation enabled state  |
| formattedStats | Array<Object> | Stats formatted for display  |

## Behavior Description

### Initial Load

1. Display skeleton loaders while fetching data
2. Animate counter values from 0 to actual amounts
3. Show introductory tooltip for first-time users
4. Start auto-rotation timer if applicable

### Data Refresh

1. Poll API at specified interval for updated stats
2. Smooth transition between old and new values
3. Visual indicator when data updates occur
4. Error handling for failed API requests

### User Controls

1. **Carousel Navigation**: Previous/next arrows for manual control
2. **Pause/Play Toggle**: Stop/start auto-rotation
3. **Info Tooltips**: Detailed explanations of metrics
4. **Share Links**: Social sharing of impact achievements

### Responsive Behavior

1. **Mobile (<768px)**: Single stat display with carousel
2. **Tablet (768px-1024px)**: 2-3 stats per view
3. **Desktop (>1024px)**: Full grid display of all stats

### Performance Optimization

1. Virtualize stat rendering when >10 stats
2. Debounce API refresh calls
3. Cache formatted values to prevent recalculation
4. Use CSS containment for complex visualizations

## Copy Stubs

### Section Header

- title: "Our Community's Impact"
- description: "Every connection made here directly supports member support in our communities. These numbers represent real contributions from real users like you."

### Sample Stats

```json
[
  {
    "id": "users",
    "value": 1000,
    "label": "verified users attending events",
    "icon": "👥",
    "trend": "up",
    "change": 12
  },
  {
    "id": "hours",
    "value": 783,
    "label": "volunteer hours contributed",
    "icon": "⏱️",
    "trend": "up",
    "change": 8
  },
  {
    "id": "revenue",
    "value": "$8,921",
    "label": "internal allocation review to kids' initiatives",
    "icon": "💰",
    "trend": "up",
    "change": 15
  },
  {
    "id": "connections",
    "value": 4200,
    "label": "real-world connections formed",
    "icon": "🤝",
    "trend": "up",
    "change": 5
  }
]
```

### Tooltips

- Users Tooltip: "Verified users are those who have attended at least one real-world event through ANTIGRAVITY."
- Hours Tooltip: "Volunteer hours contributed by our community members to local causes and initiatives."
- Revenue Tooltip: "internal allocation review to children's initiatives through our transparent business model."
- Connections Tooltip: "Meaningful connections formed through platform events and activities."

## Accessibility Notes

### Semantic Structure

```jsx
<section aria-labelledby="impact-section-title" aria-describedby="impact-section-desc">
  <header>
    <h2 id="impact-section-title">Our Community's Impact</h2>
    <p id="impact-section-desc">Every connection made here directly supports member support...</p>
  </header>
  <div role="group" aria-label="Impact statistics carousel" aria-roledescription="carousel">
    {/* Stat items with proper ARIA */}
  </div>
</section>
```

### Counter Animation Accessibility

- Use `aria-label` with static values for screen readers
- Implement `prefers-reduced-motion` for counter animations
- Provide alternative static display option
- Announce significant updates with `aria-live`

### Keyboard Navigation

```jsx
// Arrow key navigation
onKeyDown={(e) => {
  switch(e.key) {
    case 'ArrowLeft': goToPrevious(); break;
    case 'ArrowRight': goToNext(); break;
    case ' ': toggleAutoPlay(); break;
  }
}}
```

### Screen Reader Support

- Live regions for auto-updating stats
- Descriptive labels for all icons (hidden visually)
- Proper heading structure
- Role announcements for dynamic content

### Visual Accessibility

- High contrast stat values (#111111 on #FFFFFF)
- Minimum 18px font size for stat numbers
- Clear visual distinction between current/upcoming slides
- Focus indicators meeting 3:1 contrast ratio
- Text alternatives for all decorative elements

## Visual Design Specifications

### Layout Grid

```
Desktop (>1024px):
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    Stat     │    Stat     │    Stat     │    Stat     │
└─────────────┴─────────────┴─────────────┴─────────────┘

Tablet (768px-1024px):
┌───────────────────────────┬───────────────────────────┐
│          Stat             │          Stat             │
├───────────────────────────┼───────────────────────────┤
│          Stat             │          Stat             │
└───────────────────────────┴───────────────────────────┘

Mobile (<768px):
← ┌─────────────────────────────────────────────────────┐ →
  │                    Stat Display                     │
  └─────────────────────────────────────────────────────┘
  ● ○ ○ ○  (Navigation Dots)
```

### Color Scheme

- Background: `var(--bg-secondary)` (#F9FAFB)
- Stat Values: `var(--text-primary)` (#111111)
- Labels: `var(--text-secondary)` (#6B7280)
- Icons: `var(--brand-primary)` (#FF4F00)
- Trend Up: `var(--color-success)` (#10B981)
- Trend Down: `var(--color-warning)` (#F59E0B)

### Typography

- Stat Numbers: `--font-size-3xl` to `--font-size-4xl` with bold weight
- Labels: `--font-size-base` with normal weight
- Section Header: H2 with `--font-size-2xl`
- Tooltips: `--font-size-sm`

### Spacing

- Container Padding: `var(--spacing-4)` (16px) mobile, `var(--spacing-6)` desktop
- Stat Item Padding: `var(--spacing-4)` within each card
- Gap Between Items: `var(--spacing-4)` horizontally, `var(--spacing-5)` vertically
- Section Margin: `var(--spacing-8)` vertical spacing

## Technical Implementation

### React Component Structure

```jsx
const ImpactVisualization = ({ stats, title, description, isLoading = false, refreshInterval = 30000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [formattedStats, setFormattedStats] = useState([]);

  // Auto-refresh effect
  useEffect(() => {
    if (!refreshInterval || !isAutoPlaying) return;

    const interval = setInterval(() => {
      refreshStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isAutoPlaying]);

  // Format stats for display
  useEffect(() => {
    const formatted = stats.map((stat) => ({
      ...stat,
      displayValue: formatNumber(stat.value),
    }));
    setFormattedStats(formatted);
  }, [stats]);

  return (
    <section className="impact-visualization" aria-busy={isLoading}>
      <header className="impact-visualization__header">
        {title && <h2 className="impact-visualization__title">{title}</h2>}
        {description && <p className="impact-visualization__description">{description}</p>}
      </header>

      <div className="impact-visualization__carousel" role="group" aria-roledescription="carousel">
        {isLoading ? (
          <SkeletonLoader count={4} />
        ) : (
          <StatGrid stats={formattedStats.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage)} />
        )}

        {stats.length > itemsPerPage && (
          <CarouselControls
            currentIndex={currentIndex}
            totalItems={Math.ceil(stats.length / itemsPerPage)}
            onPrevious={() => navigateCarousel(-1)}
            onNext={() => navigateCarousel(1)}
            onAutoToggle={() => setIsAutoPlaying(!isAutoPlaying)}
            isAutoPlaying={isAutoPlaying}
          />
        )}
      </div>
    </section>
  );
};
```

### Animation Specifications

```css
@keyframes counter-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-value {
  animation: counter-up var(--transition-duration-normal) var(--transition-easing);
}

@media (prefers-reduced-motion: reduce) {
  .stat-value {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Performance Optimizations

```jsx
// Memoize expensive calculations
const StatItem = memo(({ stat }) => {
  // Expensive formatting operations here
  const formattedValue = useMemo(() => {
    return formatLargeNumber(stat.value);
  }, [stat.value]);

  return (
    <div className="stat-item">
      <span className="stat-icon">{stat.icon}</span>
      <span className="stat-value">{formattedValue}</span>
      <span className="stat-label">{stat.label}</span>
    </div>
  );
});

// Virtualized list for many stats
const StatGrid = ({ stats }) => {
  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <StatItem key={stat.id} stat={stat} />
      ))}
    </div>
  );
};
```

## Dependencies

- React 19 (front-end framework)
- Design system membership records (CSS variables)
- CSS animations and transitions
- Intersection Observer API (optional enhancement)
- Number formatting utilities

## Testing Requirements

1. Unit tests for number formatting functions
2. Accessibility audit with screen readers
3. Performance testing with large stat collections
4. Cross-browser compatibility verification
5. Mobile responsiveness testing across devices
6. Loading state and error handling validation

## API Integration Requirements (For CTO)

1. `/api/v1/impact/stats` endpoint with caching
2. Rate limiting considerations for public dashboard
3. Fallback values for service interruptions
4. Analytics tracking for user engagement with stats

---

_Component specification adheres to YouAndINotAI design system principles with mobile-first, accessibility-first approach._
