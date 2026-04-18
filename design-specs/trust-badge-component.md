# TrustBadge Component Specification

## Component Name

TrustBadge

## Overview

A visual indicator that communicates platform trust signals to users, showing the safety and verification status of other users, events, and organizations. This component reinforces the platform's commitment to genuine community and responsible interaction.

## Props/State

### Props

| Prop        | Type                                            | Required | Description                                 |
| ----------- | ----------------------------------------------- | -------- | ------------------------------------------- |
| type        | 'user' \| 'event' \| 'organization'             | Yes      | Type of entity being verified               |
| status      | 'verified' \| 'reported' \| 'safe' \| 'pending' | Yes      | Current trust status                        |
| entityId    | string                                          | Yes      | Unique identifier for the entity            |
| onReport    | Function                                        | No       | Handler for reporting concerns              |
| size        | 'sm' \| 'md' \| 'lg'                            | No       | Visual size variant (default: 'md')         |
| showTooltip | boolean                                         | No       | Display explanatory tooltip (default: true) |

### State

| State          | Type    | Description               |
| -------------- | ------- | ------------------------- |
| tooltipVisible | boolean | Tooltip visibility state  |
| isReporting    | boolean | Report submission state   |
| reportSuccess  | boolean | Report submission success |

## Behavior Description

### Initial Load

1. Display appropriate icon and color based on status
2. Apply proper ARIA attributes for accessibility
3. Initialize event listeners for hover/focus interactions
4. Set up keyboard navigation support

### Interaction Patterns

1. **Hover/Focus**: Show tooltip with detailed status explanation
2. **Click**: Open safety actions panel for reporting/blocking
3. **Keyboard**: Space/Enter to activate, Escape to close
4. **Long Press**: Mobile context menu activation

### Status Behavior Mapping

- **Verified**: Green checkmark with official verification explanation
- **Reported**: Warning indicator with "view report" option
- **Safe**: Standard safety confirmation with platform protection
- **Pending**: Neutral processing state with estimated completion time

### Responsive Adaptation

1. **Mobile**: Larger touch targets, simplified tooltip
2. **Tablet**: Standard behavior with enhanced accessibility
3. **Desktop**: Full tooltip with detailed safety information

## Copy Stubs

### Status Descriptions

```json
{
  "verified": {
    "title": "Verified",
    "description": "This user has completed identity verification and background checks.",
    "longDescription": "Officially verified through government ID and optional background screening. Verified users have committed to our community standards."
  },
  "reported": {
    "title": "Reported Concerns",
    "description": "Other users have reported concerns about this entity.",
    "longDescription": "Multiple community members have flagged concerns. Our moderation team is reviewing all reports. Exercise appropriate caution in interactions."
  },
  "safe": {
    "title": "Platform Safe",
    "description": "Active user with no reported incidents.",
    "longDescription": "Regular user with confirmed account activity and no safety reports. All interactions protected by our automated safety systems."
  },
  "pending": {
    "title": "Verification Pending",
    "description": "Identity verification in progress.",
    "longDescription": "User has initiated verification process. Full status will be available within 3-5 business days after document review."
  }
}
```

### Tooltip Actions

- "Report Concern" - Opens report form
- "View Safety Tips" - Shows relevant safety guidance
- "Block User" - Immediate blocking action
- "Learn About Safety" - Link to safety center

## Accessibility Notes

### Semantic HTML Structure

```jsx
<span
  className={`trust-badge trust-badge--${status} size-${size}`}
  role="status"
  aria-label={`${getStatusLabel(status)} trust status`}
  tabIndex="0"
  onKeyDown={handleKeyDown}
  onFocus={showTooltip}
  onBlur={hideTooltip}
>
  <Icon name={getIconName(status)} className="trust-badge__icon" aria-hidden="true" />
  <span className="sr-only">{getStatusDescription(status)}</span>

  {showTooltip && (
    <div className="trust-badge__tooltip" role="tooltip" id={`trust-tooltip-${entityId}`}>
      <div className="tooltip-content">
        <h4>{getStatusTitle(status)}</h4>
        <p>{getStatusLongDescription(status)}</p>
        <div className="tooltip-actions">
          <button onClick={onReport}>Report Concern</button>
        </div>
      </div>
    </div>
  )}
</span>
```

### Keyboard Navigation

- Tab to focus badge
- Enter/Space to show tooltip/actions
- Escape to close tooltip
- Arrow keys to navigate tooltip actions
- Tab out to move focus away

### Screen Reader Support

- ARIA live regions for status changes
- Descriptive labels for all status states
- Proper heading structure in tooltips
- Announcement of actionable options

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus trapping within tooltip when open
- Return focus to badge after closing tooltip
- Programmatic focus movement between elements

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .trust-badge__tooltip {
    transition: none;
    opacity: 1;
  }

  .trust-badge__icon {
    animation: none;
  }
}
```

## Visual Design Implementation

### Status Visual Design

```css
.trust-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  position: relative;
}

.trust-badge--verified {
  background-color: var(--safety-safe);
  color: var(--text-inverse);
}

.trust-badge--reported {
  background-color: var(--safety-alert);
  color: var(--text-inverse);
}

.trust-badge--safe {
  background-color: var(--color-success);
  color: var(--text-inverse);
}

.trust-badge--pending {
  background-color: var(--color-neutral);
  color: var(--text-inverse);
}

/* Size Variants */
.size-sm {
  width: var(--spacing-5);
  height: var(--spacing-5);
  font-size: var(--font-size-xs);
}

.size-md {
  width: var(--spacing-6);
  height: var(--spacing-6);
  font-size: var(--font-size-sm);
}

.size-lg {
  width: var(--spacing-8);
  height: var(--spacing-8);
  font-size: var(--font-size-base);
}
```

### Tooltip Design

```
┌─────────────────────────────────────────────────┐
│  Verified                              ⓘ      │
├─────────────────────────────────────────────────┤
│  Officially verified through government ID      │
│  and optional background screening.             │
│                                                 │
│  [ Report Concern ]  [ View Safety Tips ]       │
└─────────────────────────────────────────────────┘
```

### Design Tokens Usage

```css
.trust-badge {
  /* Colors based on safety token system */
  background-color: var(--safety-safe);
  color: var(--text-inverse);

  /* Shape and sizing */
  border-radius: var(--border-radius-full);
  width: var(--spacing-6);
  height: var(--spacing-6);

  /* Interactive states */
  transition: all var(--transition-duration-fast) var(--transition-easing);
}

.trust-badge:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.trust-badge:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.trust-badge__tooltip {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-3);
  min-width: 200px;
  max-width: 300px;
}

.tooltip-content h4 {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-2);
}

.tooltip-content p {
  color: var(--text-secondary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin: 0 0 var(--spacing-3);
}
```

## Technical Implementation

### React Component Structure

```jsx
const TrustBadge = ({ type, status, entityId, onReport, size = 'md', showTooltip = true }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const badgeRef = useRef(null);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setTooltipVisible(true);
        break;
      case 'Escape':
        setTooltipVisible(false);
        break;
    }
  };

  const handleClickOutside = (e) => {
    if (badgeRef.current && !badgeRef.current.contains(e.target)) {
      setTooltipVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <span
      ref={badgeRef}
      className={`trust-badge trust-badge--${status} size-${size}`}
      role="status"
      aria-label={`${getStatusTitle(status)} trust status for ${type}`}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onFocus={() => showTooltip && setTooltipVisible(true)}
      onBlur={() => showTooltip && setTooltipVisible(false)}
    >
      <Icon name={getIconFromStatus(status)} className="trust-badge__icon" aria-hidden="true" />
      <span className="sr-only">{getStatusDescription(status)}</span>

      {tooltipVisible && showTooltip && (
        <TrustTooltip
          status={status}
          type={type}
          entityId={entityId}
          onClose={() => setTooltipVisible(false)}
          onReport={onReport}
          isReporting={isReporting}
          reportSuccess={reportSuccess}
        />
      )}
    </span>
  );
};

const TrustTooltip = ({ status, type, entityId, onClose, onReport, isReporting, reportSuccess }) => {
  return (
    <div className="trust-badge__tooltip" role="tooltip" id={`trust-tooltip-${entityId}`}>
      <div className="tooltip-content">
        <div className="tooltip-header">
          <h4>{getStatusTitle(status)}</h4>
          <button className="tooltip-close" onClick={onClose} aria-label="Close tooltip">
            ×
          </button>
        </div>
        <p>{getStatusLongDescription(status)}</p>
        <div className="tooltip-actions">
          <Button variant="secondary" size="sm" onClick={onReport} disabled={isReporting}>
            {isReporting ? 'Reporting...' : 'Report Concern'}
          </Button>
          <Button variant="secondary" size="sm" onClick={viewSafetyTips}>
            Safety Tips
          </Button>
        </div>
        {reportSuccess && <div className="report-success">Concern reported. Our team will review.</div>}
      </div>
    </div>
  );
};
```

### CSS Animations

```css
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.trust-badge__icon {
  animation: pulse 2s infinite;
}

.trust-badge__tooltip {
  animation: fadeIn var(--transition-duration-normal) var(--transition-easing);
}

@media (prefers-reduced-motion: reduce) {
  .trust-badge__icon {
    animation: none;
  }

  .trust-badge__tooltip {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

## Implementation Requirements

### For CTO (b02a21c7)

1. API endpoints for:
   - Status verification lookup by entity ID
   - Report submission with evidence attachment
   - Real-time status update notifications
   - Moderation queue management
2. Real-time WebSocket integration for status updates
3. Database indexing for efficient status queries
4. Audit trail for all verification actions
5. CDN configuration for badge assets

### For Frontend Developers

1. Component library integration with existing safety systems
2. State management for verification statuses
3. Error handling for API failures
4. Caching strategy for status information
5. Internationalization support for status descriptions

## Testing Requirements

### Unit Tests

- Status icon rendering correctness
- Tooltip visibility logic
- Keyboard navigation compliance
- Focus management validation
- Event handler firing accuracy

### Accessibility Tests

- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation verification
- Color contrast compliance checking
- Reduced motion preference support
- ARIA attribute correctness validation

### Integration Tests

- API connection success/failure handling
- Real-time update propagation
- Cross-component communication
- Performance under load conditions
- Security boundary enforcement

## Success Metrics Framework

### Trust Indicators

- Badge visibility increase in user interactions
- Report submission rates through badge interface
- Time to resolution for reported concerns
- User confidence scores in safety surveys

### Performance Metrics

- Badge render time < 50ms
- Tooltip show/hide response < 100ms
- API status lookup < 200ms
- Mobile touch response < 150ms

### Accessibility Compliance

- WCAG 2.1 AA compliance score > 95%
- Keyboard navigation coverage 100%
- Screen reader announcement accuracy 100%
- Color contrast ratios > 4.5:1 for all states

### Community Impact

- Reduction in safety incidents through badge awareness
- Increased participation in verified user interactions
- Improved response times to safety concerns
- Higher user retention among safety-conscious users

## Trust Design Patterns

### Transparency Through Design

- Clear visual distinction between status levels
- Plain language explanations of verification processes
- Immediate feedback for all safety actions
- Consistent placement across platform contexts

### User Empowerment

- Easy reporting mechanisms with clear consequences
- Self-protection tools accessible through badge interaction
- Educational opportunities embedded in safety flows
- Community-driven verification awareness

### Proactive Safety

- Context-sensitive safety tips based on entity type
- Automated risk assessment displayed through status
- Preventive action suggestions in tooltips
- Integration with platform-wide safety ecosystem

---

_This component builds trust through transparent, accessible safety indicators that empower users to make informed decisions about their community interactions._
