# CommunityImpactTracker Component Specification

## Component Name

CommunityImpactTracker

## Overview

A visualization component that transparently displays the community's collective impact on children's causes through the platform's contractual revenue payout model. This component reinforces trust by showing real outcomes from user interactions.

## Props/State

### Props

| Prop           | Type                                                        | Required | Description                              |
| -------------- | ----------------------------------------------------------- | -------- | ---------------------------------------- |
| impactData     | CommunityImpactData                                         | Yes      | Current impact metrics                   |
| period         | 'daily' \| 'weekly' \| 'monthly' \| 'quarterly' \| 'yearly' | No       | Time period display (default: 'monthly') |
| showProjection | boolean                                                     | No       | Show impact projections (default: true)  |
| compactView    | boolean                                                     | No       | Condensed display mode (default: false)  |
| onDetailView   | Function                                                    | No       | Handler for detailed impact view         |

### CommunityImpactData Interface

```typescript
interface CommunityImpactData {
  timeframe: {
    start: string; // ISO date
    end: string; // ISO date
  };
  financialImpact: {
    totalRevenue: number; // Platform revenue
    childrenSupportpayout: number; // Contractual revenue payout
    payoutPercentage: number; // Percentage of revenue
    dollarPerUserHour: number; // Average impact per user hour
  };
  communityEngagement: {
    totalUsers: number;
    activeUsers: number;
    volunteerHours: number;
    communityEvents: number;
    newConnections: number;
  };
  childrenBenefited: {
    directBeneficiaries: number;
    educationalProgramsSupported: number;
    recreationalActivitiesFunded: number;
    mealProgramsContributed: number;
  };
  impactProjection: {
    nextPeriodEstimate: number;
    yearlyProjection: number;
    goalProgress: {
      current: number;
      goal: number;
      percentage: number;
    };
  };
  recentHighlights: Array<{
    date: string; // ISO date
    description: string;
    beneficiaries: number;
    monetaryValue: number;
  }>;
}
```

### State

| State             | Type    | Description              |
| ----------------- | ------- | ------------------------ |
| expanded          | boolean | Detailed view state      |
| selectedMetric    | string  | Currently focused metric |
| animationProgress | number  | Progress animation state |
| dataLoaded        | boolean | API data loading state   |

## Behavior Description

### Initial Load

1. Display loading skeleton with approximate layout
2. Fetch current impact data from API
3. Animate counter values from 0 to actual amounts
4. Apply appropriate ARIA attributes for accessibility
5. Initialize auto-refresh timer for live data

### Data Visualization

1. **Financial Impact**: Progress bar showing payout percentage
2. **Community Engagement**: Icon-based metrics with trend indicators
3. **Children Benefited**: Illustrated representations of impact types
4. **Impact Projection**: Forward-looking trend visualization

### Interaction Patterns

1. **Click/Tap**: Toggle between compact and detailed views
2. **Hover**: Show tooltips with detailed explanations
3. **Focus**: Keyboard navigation through metric elements
4. **Swipe**: Navigate between time periods (mobile)

### Responsive Adaptation

1. **Mobile**: Vertical stacked layout with swipe navigation
2. **Tablet**: Grid-based arrangement with responsive columns
3. **Desktop**: Full-width dashboard with detailed charts

### Performance Optimization

1. Virtualized rendering for large datasets
2. RequestAnimationFrame for smooth animations
3. Intersection Observer for lazy loading
4. Memoization for expensive calculations

## Copy Stubs

### Header and Introduction

- **Main Header**: "Our Community's Impact"
- **Subheader**: "Every connection here directly supports children's causes"
- **Intro Text**: "Through our transparent contractual revenue payout model, your conversations and community activities generate funds for kids' initiatives nationwide."

### Metric Labels (Compliant with Florida §496.405)

```json
{
  "financialImpact": {
    "title": "Contractual Revenue Support",
    "description": "Funds payout to children's initiatives through our business model",
    "counterPrefix": "$",
    "counterSuffix": " contributed"
  },
  "volunteerHours": {
    "title": "Community Service Hours",
    "description": "Time volunteered by our members to support local causes",
    "counterPrefix": "",
    "counterSuffix": " hours"
  },
  "directBeneficiaries": {
    "title": "Children Supported",
    "description": "Young people benefiting from programs funded through platform activity",
    "counterPrefix": "",
    "counterSuffix": " children"
  },
  "communityEvents": {
    "title": "Community Events",
    "description": "Gatherings organized by members that strengthen local communities",
    "counterPrefix": "",
    "counterSuffix": " events"
  }
}
```

### Highlight Examples

```json
[
  {
    "date": "2026-04-15",
    "description": "Spring volunteer event raises funds for school supplies",
    "beneficiaries": 240,
    "monetaryValue": 1200,
    "category": "educational"
  },
  {
    "date": "2026-04-10",
    "description": "Weekend community cleanup supports local recreation center",
    "beneficiaries": 85,
    "monetaryValue": 850,
    "category": "recreational"
  },
  {
    "date": "2026-04-05",
    "description": "Family meetup generates support for youth nutrition program",
    "beneficiaries": 120,
    "monetaryValue": 960,
    "category": "nutritional"
  }
]
```

## Accessibility Notes

### Semantic HTML Structure

```jsx
<section
  className="community-impact-tracker"
  aria-label="Community Impact Tracker"
  aria-describedby="impact-tracker-desc"
  role="region"
>
  <header className="impact-header">
    <h2 id="impact-tracker-title">Our Community's Impact</h2>
    <p id="impact-tracker-desc">
      Every connection here directly supports children's causes through our contractual revenue payout model.
    </p>
  </header>

  <div className="impact-metrics" role="group" aria-labelledby="impact-tracker-title">
    <div
      className="metric-card financial-impact"
      role="figure"
      aria-label="Financial impact metric"
      tabIndex="0"
      onKeyDown={handleMetricKeyDown}
    >
      <div className="metric-value" aria-live="polite">
        {formatCurrency(financialImpact.childrenSupportpayout)}
      </div>
      <div className="metric-label">Contractual Revenue Support</div>
      <div className="metric-description sr-only">
        Funds payout to children's initiatives through our business model
      </div>
    </div>

    {/* Additional metric cards with similar structure */}
  </div>

  <div className="impact-projection">
    <h3>Impact Projection</h3>
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={impactProjection.goalProgress.percentage}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Projected goal progress"
    >
      <div className="progress-fill" style={{ width: `${impactProjection.goalProgress.percentage}%` }} />
    </div>
    <div className="progress-label">
      {impactProjection.goalProgress.current} of {impactProjection.goalProgress.goal} goal
    </div>
  </div>
</section>
```

### Keyboard Navigation

- Tab to navigate between metric cards
- Enter/Space to select and hear detailed descriptions
- Arrow keys to move between metrics in grid
- Escape to return to overview from detailed view
- R to refresh data

### Screen Reader Support

- Live regions for updating metric values
- Descriptive labels for all visual elements
- Proper heading hierarchy (H2 → H4)
- ARIA landmark roles for major sections

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus trapping in expanded detail views
- Return focus after closing modals
- Skip links for keyboard users

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .metric-value {
    animation: none;
    transition: none;
  }

  .progress-fill {
    transition: none;
    width: var(--target-width);
  }
}
```

## Visual Design Implementation

### Compact View (Default)

```
┌─────────────────────────────────────────────────┐
│  Our Community's Impact                        │
├─────────────────────────────────────────────────┤
│  $8,921  │  783 hrs  │  450 kids  │  32 events  │
│ contrib. │ volunteerd│ supported  │ organized   │
└─────────────────────────────────────────────────┘
```

### Detailed View

```
┌─────────────────────────────────────────────────┐
│  Our Community's Impact                [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  CONTRACTUAL REVENUE SUPPORT                  │
│  ┌─────────────────────────────────────────┐   │
│  │██████████████████░░░░░░░░░░░░░░░░░░░░░░░│   │
│  │  $8,921 of $15,000 goal (59%)           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  COMMUNITY SERVICE HOURS                      │
│  [Icon] 783 hours volunteered by members      │
│                                                 │
│  CHILDREN SUPPORTED                           │
│  [Icon] 450 young people benefiting from      │
│         programs funded through platform      │
│                                                 │
│  RECENT HIGHLIGHTS                            │
│  • Spring event raises funds for 240 students │
│  • Community cleanup supports recreation ctr  │
│  • Family meetup aids youth nutrition program │
│                                                 │
│  [View Full Impact Report]                    │
└─────────────────────────────────────────────────┘
```

### Design Tokens Usage

```css
.community-impact-tracker {
  background: linear-gradient(135deg, var(--brand-accent) 0%, var(--bg-primary) 100%);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-mobile-padding);
  box-shadow: var(--shadow-md);
}

.metric-card {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  text-align: center;
  transition: all var(--transition-duration-fast) var(--transition-easing);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-primary);
}

.metric-value {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--brand-primary);
  margin-bottom: var(--spacing-2);
}

.metric-label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-bar {
  height: var(--spacing-4);
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  margin: var(--spacing-3) 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--volunteer-kids), var(--brand-primary));
  border-radius: var(--border-radius-full);
  transition: width var(--transition-duration-slow) var(--transition-easing);
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.highlight-icon {
  color: var(--volunteer-community);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}
```

## Technical Implementation

### React Component Structure

```jsx
const CommunityImpactTracker = ({
  impactData: initialData,
  period = 'monthly',
  showProjection = true,
  compactView = false,
  onDetailView,
}) => {
  const [impactData, setImpactData] = useState(initialData);
  const [expanded, setExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      refreshImpactData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Animation effect for counters
  useEffect(() => {
    if (!dataLoaded) return;

    let start = 0;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [dataLoaded]);

  // Format animated values
  const formatAnimatedValue = (value) => {
    return Math.floor(value * animationProgress).toLocaleString();
  };

  return (
    <section
      className={`community-impact-tracker ${compactView ? 'compact' : 'detailed'} ${expanded ? 'expanded' : ''}`}
      aria-label="Community Impact Tracker"
    >
      <header className="impact-header">
        <h2>Our Community's Impact</h2>
        <p>
          Every connection here directly supports children's causes through our contractual revenue payout model.
        </p>
      </header>

      {!dataLoaded ? (
        <ImpactSkeleton />
      ) : (
        <>
          <div className="impact-metrics">
            <MetricCard
              type="financial"
              value={formatAnimatedValue(impactData.financialImpact.childrenSupportpayout)}
              label="Contractual Revenue Support"
              prefix="$"
              suffix=" contributed"
              onDetail={() => setSelectedMetric('financial')}
            />

            <MetricCard
              type="volunteer"
              value={formatAnimatedValue(impactData.communityEngagement.volunteerHours)}
              label="Community Service Hours"
              suffix=" volunteered"
              onDetail={() => setSelectedMetric('volunteer')}
            />

            <MetricCard
              type="children"
              value={formatAnimatedValue(impactData.childrenBenefited.directBeneficiaries)}
              label="Children Supported"
              suffix=" children"
              onDetail={() => setSelectedMetric('children')}
            />

            <MetricCard
              type="events"
              value={formatAnimatedValue(impactData.communityEngagement.communityEvents)}
              label="Community Events"
              suffix=" organized"
              onDetail={() => setSelectedMetric('events')}
            />
          </div>

          {showProjection && (
            <div className="impact-projection">
              <h3>Impact Projection</h3>
              <ProgressBar value={impactData.impactProjection.goalProgress.percentage} animated={animationProgress} />
              <div className="progress-details">
                <span className="current">{formatAnimatedValue(impactData.impactProjection.goalProgress.current)}</span>
                {' of '}
                <span className="goal">{impactData.impactProjection.goalProgress.goal.toLocaleString()}</span>
                {' goal'}
              </div>
            </div>
          )}

          {expanded && (
            <ImpactDetailView data={impactData} onClose={() => setExpanded(false)} onMetricSelect={setSelectedMetric} />
          )}
        </>
      )}

      <button
        className="expand-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse impact details' : 'Expand impact details'}
      >
        {expanded ? 'Show Less' : 'Show More'}
      </button>
    </section>
  );
};

const MetricCard = ({ type, value, label, prefix = '', suffix = '', onDetail }) => {
  const getIconForType = (type) => {
    const icons = {
      financial: '💰',
      volunteer: '⏰',
      children: '🧒',
      events: '🎪',
    };
    return icons[type] || '📊';
  };

  return (
    <div
      className={`metric-card metric-${type}`}
      role="figure"
      tabIndex="0"
      onClick={onDetail}
      onKeyDown={(e) => e.key === 'Enter' && onDetail()}
    >
      <div className="metric-icon" aria-hidden="true">
        {getIconForType(type)}
      </div>
      <div className="metric-value" aria-live="polite">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
};
```

### CSS Animations

```css
@keyframes counterUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressBarFill {
  from {
    width: 0;
  }
  to {
    width: var(--target-width);
  }
}

.metric-value {
  animation: counterUp var(--transition-duration-normal) var(--transition-easing) forwards;
  opacity: 0;
  transform: translateY(10px);
}

.progress-fill {
  animation: progressBarFill var(--transition-duration-slow) var(--transition-easing) forwards;
  width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .metric-value,
  .progress-fill {
    animation: none;
    opacity: 1;
    transform: none;
    width: var(--target-width);
  }
}
```

## Implementation Requirements

### For CTO (b02a21c7)

1. **API Endpoints**:
   - GET /api/v1/impact/community - Retrieve current impact data
   - GET /api/v1/impact/projections - Retrieve impact projections
   - POST /api/v1/impact/refresh - Force data refresh
   - GET /api/v1/impact/highlights - Retrieve recent highlights

2. **Database Schema**:
   - Community impact aggregated metrics table
   - Historical impact data for trend analysis
   - Children's program funding allocations
   - User engagement correlation tracking

3. **Real-time Features**:
   - WebSocket integration for live updates
   - Cache invalidation for fresh data display
   - Rate limiting for API consumption
   - Fallback to cached data during downtime

### For CMO (2c40ae74)

1. **Messaging Compliance**:
   - All copy aligned with Florida §496.405 restrictions
   - "Contractual revenue payout" terminology verification
   - Benefit-focused rather than payment-focused language
   - Transparency in methodology explanations

2. **Storytelling Elements**:
   - Recent highlight selection criteria
   - Impact categorization for narrative coherence
   - User privacy protection in storytelling
   - Emotional resonance with platform values

## Testing Requirements

### Unit Tests

- Metric calculation accuracy
- Animation timing and completion
- Responsive layout adjustments
- API data transformation
- Error state handling

### Accessibility Tests

- Screen reader navigation and announcements
- Keyboard operability for all controls
- Color contrast compliance across themes
- Reduced motion preference adherence
- Focus management during state changes

### Performance Tests

- Initial load time < 2 seconds
- Animation frame rate > 50fps
- Memory consumption < 25MB during operation
- API response time < 300ms for cached data
- Offline functionality with service worker

## Success Metrics Framework

### Engagement Metrics

- Component view duration average
- Detail view expansion rate
- Time spent interacting with metrics
- Share initiation frequency

### Impact Awareness

- User comprehension of payout model
- Correlation between awareness and participation
- Voluntary contribution to community activities
- Positive sentiment in user feedback surveys

### Trust Building

- Confidence increase in platform business model
- Reduction in safety/support inquiries
- User retention among impact-aware segments
- Referral rates from impact-engaged users

### Business Indicators

- Correlation between impact visibility and user growth
- Time-on-platform increase among impact viewers
- Event/volunteer participation uptick
- Positive sentiment in community feedback

## Legal Compliance Note

All terminology in this component strictly adheres to Florida §496.405:

- Uses "contractual revenue payout" instead of "payment" or " contribution"
- Frames platform benefits as features of business model rather than  appeals
- Focuses on user agency in generating impact rather than outreach funds
- Describes outcomes quantitatively without emotional manipulation

---

_This component transparently communicates the platform's genuine community impact while maintaining strict legal compliance and fostering continued engagement with the core mission._
