# RSVPButtonGroup Component Specification

## Component Name

RSVPButtonGroup

## Overview

A component providing intuitive RSVP (Yes, Maybe, No) controls for community events. Designed with clear visual feedback, accessibility compliance, and mobile-first interaction patterns to facilitate quick decision-making for event participation.

## Props/State

### Props

| Prop           | Type                                      | Required | Description                                 |
| -------------- | ----------------------------------------- | -------- | ------------------------------------------- |
| eventId        | string                                    | Yes      | Unique identifier for the event             |
| status         | 'going' \| 'maybe' \| 'not_going' \| null | No       | Current user RSVP status                    |
| onStatusChange | function                                  | No       | Callback when user changes RSVP status      |
| size           | 'sm' \| 'md' \| 'lg'                      | No       | Button size variation (default: 'md')       |
| disabled       | boolean                                   | No       | Disable all buttons (default: false)        |
| showLabels     | boolean                                   | No       | Show text labels on buttons (default: true) |
| variant        | 'segmented' \| 'individual'               | No       | Layout variant (default: 'segmented')       |

### State

| State        | Type                                      | Description                            |
| ------------ | ----------------------------------------- | -------------------------------------- |
| localStatus  | 'going' \| 'maybe' \| 'not_going' \| null | Local state mirroring props.status     |
| isLoading    | boolean                                   | Whether an RSVP action is in progress  |
| isSuccess    | boolean                                   | Whether the last action was successful |
| errorMessage | string                                    | Error message if action failed         |

## Behavior Description

### Initial Load

1. Display buttons with appropriate visual state based on props.status
2. Apply appropriate sizing and layout based on variant
3. Set initial loading/error states to false

### Interaction Behavior

1. **Single Selection**: Only one option can be selected at a time
2. **Visual Feedback**: Selected state clearly indicated with color and style
3. **Loading States**: Show spinner during API calls
4. **Success Indication**: Brief confirmation for successful actions
5. **Error Handling**: Clear error messages with retry option

### Responsive Adaptation

1. **Mobile (<768px)**: Stacked layout for better touch targeting
2. **Tablet (768px-1024px)**: Horizontal layout with appropriate spacing
3. **Desktop (>1024px)**: Flexible layouts with optional labels

### Performance Optimization

1. Debounce rapid status changes
2. Local state updating for immediate visual feedback
3. Error boundary implementation
4. Memoization for stable callbacks

## Copy Stubs

### Button Labels

| Status    | Label (Full) | Label (Compact) |
| --------- | ------------ | --------------- |
| Going     | "I'm Going"  | "✓"             |
| Maybe     | "Maybe"      | "?"             |
| Not Going | "Can't Go"   | "✕"             |

### Status Messages

| Message | Text                                |
| ------- | ----------------------------------- |
| Loading | "Updating your RSVP..."             |
| Success | "RSVP updated successfully!"        |
| Error   | "Failed to update RSVP. Try again?" |
| Retry   | "Retry"                             |

### Empty States

- No selection: "Select your attendance"
- Loading initial: "Loading RSVP status..."

## Accessibility Notes

### Semantic HTML Structure

```jsx
<div
  className={`rsvp-button-group variant-${variant} size-${size}`}
  role="radiogroup"
  aria-label="Event attendance RSVP"
>
  <button
    className={`rsvp-button going ${status === 'going' ? 'selected' : ''}`}
    role="radio"
    aria-checked={status === 'going'}
    aria-label="I'm going to this event"
    onClick={() => handleChange('going')}
    disabled={disabled || isLoading}
  >
    <span className="rsvp-icon" aria-hidden="true">
      {status === 'going' && isSuccess ? '✓' : '✓'}
    </span>
    {showLabels && <span className="rsvp-label">I'm Going</span>}
  </button>

  <button
    className={`rsvp-button maybe ${status === 'maybe' ? 'selected' : ''}`}
    role="radio"
    aria-checked={status === 'maybe'}
    aria-label="I might attend this event"
    onClick={() => handleChange('maybe')}
    disabled={disabled || isLoading}
  >
    <span className="rsvp-icon" aria-hidden="true">
      ?
    </span>
    {showLabels && <span className="rsvp-label">Maybe</span>}
  </button>

  <button
    className={`rsvp-button not-going ${status === 'not_going' ? 'selected' : ''}`}
    role="radio"
    aria-checked={status === 'not_going'}
    aria-label="I won't attend this event"
    onClick={() => handleChange('not_going')}
    disabled={disabled || isLoading}
  >
    <span className="rsvp-icon" aria-hidden="true">
      ✕
    </span>
    {showLabels && <span className="rsvp-label">Can't Go</span>}
  </button>
</div>;

{
  isLoading && (
    <div className="rsvp-loading" role="status">
      <Spinner size="sm" />
      <span className="sr-only">Updating your RSVP...</span>
    </div>
  );
}

{
  errorMessage && (
    <div className="rsvp-error" role="alert">
      <span>Failed to update RSVP. </span>
      <button onClick={retryAction}>Try again</button>
    </div>
  );
}

{
  isSuccess && !isLoading && (
    <div className="rsvp-success" role="status">
      <span>RSVP updated!</span>
    </div>
  );
}
```

### Keyboard Navigation

- Tab to focus the button group
- Arrow keys to navigate between options
- Space/Enter to select an option
- Escape to cancel pending actions

### Screen Reader Support

- Radiogroup role for proper announcement
- ARIA checked state for selections
- Live regions for status updates
- Proper labeling for all interactive elements
- Alert roles for error messages

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus preservation during state changes
- Return focus after closing error messages
- Skip links for keyboard users when appropriate

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .rsvp-button {
    transition: none;
  }

  .rsvp-success {
    animation: none;
  }
}
```

## Visual Design Implementation

### Segmented Variant (Default)

```
┌─────────────┬─────────────┬─────────────┐
│ ✓ I'm Going │   Maybe     │  Can't Go   │
└─────────────┴─────────────┴─────────────┘
```

### Individual Variant

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ✓ I'm Going │ │   Maybe     │ │  Can't Go   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│         ✓ I'm Going         │
├─────────────────────────────┤
│            Maybe            │
├─────────────────────────────┤
│          Can't Go           │
└─────────────────────────────┘
```

### Loading State

```
┌─────────────┬─────────────┬─────────────┐
│  ⟳ I'm Going │   Maybe     │  Can't Go   │
└─────────────┴─────────────┴─────────────┘
```

### Success State

```
┌──────────────────────────────────────────┐
│     ✓ RSVP updated successfully!        │
└──────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────┐
│ ⚠ Failed to update RSVP. [Retry]         │
└──────────────────────────────────────────┘
```

### Design membership records Usage

```css
.rsvp-button-group {
  display: flex;
  gap: var(--spacing-1);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-tertiary);
  padding: var(--spacing-1);
}

.rsvp-button {
  flex: 1;
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-duration-fast) var(--transition-easing);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.rsvp-button:hover:not(:disabled):not(.selected) {
  background-color: var(--bg-secondary);
  border-color: var(--text-secondary);
}

.rsvp-button.selected {
  background-color: var(--brand-primary);
  color: var(--text-inverse);
  border-color: var(--brand-primary);
}

.rsvp-button.going.selected {
  background-color: var(--attendance-going);
  border-color: var(--attendance-going);
}

.rsvp-button.maybe.selected {
  background-color: var(--attendance-maybe);
  border-color: var(--attendance-maybe);
}

.rsvp-button.not-going.selected {
  background-color: var(--attendance-not-going);
  border-color: var(--attendance-not-going);
}

.rsvp-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rsvp-button:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.rsvp-button:focus:not(:focus-visible) {
  outline: none;
}

.rsvp-button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.rsvp-loading {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
  margin-top: var(--spacing-2);
}

.rsvp-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  text-align: center;
  margin-top: var(--spacing-2);
}

.rsvp-success {
  color: var(--color-success);
  font-size: var(--font-size-sm);
  text-align: center;
  margin-top: var(--spacing-2);
  animation: fadeIn var(--transition-duration-fast) var(--transition-easing);
}
```

## Technical Implementation

### React Component Structure

```jsx
const RSVPButtonGroup = ({
  eventId,
  status = null,
  onStatusChange,
  size = 'md',
  disabled = false,
  showLabels = true,
  variant = 'segmented'
}) => {
  const [localStatus, setLocalStatus] = useState(status);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync local state with prop changes
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const handleChange = async (newStatus) => {
    // Early return if no change or disabled
    if (newStatus === localStatus || disabled || isLoading) {
      return;
    }

    // Optimistic update for immediate feedback
    setLocalStatus(newStatus);
    setIsSuccess(false);
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Call the provided callback or API function
      if (onStatusChange) {
        await onStatusChange(eventId, newStatus);
      }

      // Show success state briefly
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      // Handle error state
      setLocalStatus(status); // Revert to previous state
      setErrorMessage('Failed to update RSVP. Try again?');
    } finally {
      setIsLoading(false);
    }
  };

  const retryAction = () => {
    setErrorMessage('');
    if (localStatus) {
      handleChange(localStatus);
    }
  };

  return (
    <div
      className={`rsvp-button-group variant-${variant} size-${size}`}
      role="radiogroup"
      aria-label="Event attendance RSVP"
    >
      <button
        className={`rsvp-button going ${localStatus === 'going' ? 'selected' : ''}`}
        role="radio"
        aria-checked={localStatus === 'going'}
        aria-label="I'm going to this event"
        onClick={() => handleChange('going')}
        disabled={disabled || isLoading}
      >
        <span className="rsvp-icon" aria-hidden="true">
          {(localStatus === 'going' && isSuccess) ? '✓' : '✓'}
        </span>
        {showLabels && <span className="rsvp-label">I'm Going</span>}
      </button>

      <button
        className={`rsvp-button maybe ${localStatus === 'maybe' ? 'selected' : ''}`}
        role="radio"
        aria-checked={localStatus === 'maybe'}
        aria-label="I might attend this event"
        onClick={() => handleChange('maybe')}
        disabled={disabled || isLoading}
      >
        <span className="rsvp-icon" aria-hidden="true">?</span>
        {showLabels && <span className="rsvp-label">Maybe</span>}
      </button>

      <button
        className={`rsvp-button not-going ${localStatus === 'not_going' ? 'selected' : ''}`}
        role="radio"
        aria-checked={localStatus === 'not_going'}
        aria-label="I won't attend this event"
        onClick={() => handleChange('not_going')}
        disabled={disabled || isLoading}
      >
        <span className="rsvp-icon" aria-hidden="true">✕</span>
        {showLabels && <span className="rsvp-label">Can't Go</span>}
      </button>
    </div>

    {isLoading && (
      <div className="rsvp-loading" role="status">
        <Spinner size="sm" />
        <span className="sr-only">Updating your RSVP...</span>
      </div>
    )}

    {errorMessage && (
      <div className="rsvp-error" role="alert">
        <span>{errorMessage}</span>
        <button onClick={retryAction}>Retry</button>
      </div>
    )}

    {isSuccess && !isLoading && (
      <div className="rsvp-success" role="status">
        <span>RSVP updated successfully!</span>
      </div>
    )}
  );
};
```

### CSS Animation Definitions

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(var(--spacing-1));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

.rsvp-button.selected {
  animation: pulse var(--transition-duration-fast) var(--transition-easing);
}

.rsvp-success {
  animation: fadeIn var(--transition-duration-fast) var(--transition-easing);
}

@media (prefers-reduced-motion: reduce) {
  .rsvp-button.selected,
  .rsvp-success {
    animation: none;
  }
}
```

### Utility Hook for Enhanced Functionality

```jsx
// Custom hook for RSVP logic
const useRSVP = (initialStatus) => {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateRSVP = useCallback(
    async (eventId, newStatus) => {
      setIsLoading(true);
      setError(null);

      try {
        // Optimistic update
        const prevStatus = status;
        setStatus(newStatus);

        // API call
        await api.updateEventRSVP(eventId, newStatus);

        return true;
      } catch (err) {
        // Rollback on error
        setStatus(status);
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [status],
  );

  return { status, isLoading, error, updateRSVP };
};
```

## Dependencies

- React 19 (front-end framework)
- Design system membership records (CSS variables)
- Spinner/Loading component from design system
- Icons from design system
- CSS animations and transitions
- Error boundary components (optional)

## Testing Requirements

1. Unit tests for status change logic
2. Accessibility audit with screen readers
3. Cross-browser compatibility verification
4. Mobile interaction testing
5. Keyboard navigation testing
6. Focus management validation
7. Loading state behavior validation
8. Error handling and recovery testing

## Integration Requirements

### For CTO (b02a21c7)

1. API endpoint for updating event RSVPs
2. Real-time sync with attendee counts
3. Notification system for event updates
4. Database schema for storing RSVP status
5. Authenticated user context validation

### For CMO (2c40ae74)

1. Copy approval for all button labels and status messages
2. Brand voice alignment for error messages
3. Legal compliance verification for RSVP terminology
4. Translation requirements for international markets
5. A/B testing framework for different variants

## Success Metrics Framework

### Engagement Metrics

- RSVP completion rate
- Time to RSVP decision
- Change rate of RSVP status
- Conversion from view to RSVP

### Performance Benchmarks

- Status update response time < 500ms
- Visual feedback delay < 100ms
- Accessibility audit score > 95%
- Mobile Lighthouse performance score > 85

### User Satisfaction Indicators

- User survey feedback on RSVP ease
- Support tickets related to RSVP confusion
- Retention rate of users who RSVP
- Event attendance vs RSVP correlation

---

_Component specification enables intuitive event participation while maintaining YouAndINotAI's commitment to accessibility, mobile-first design, and trust-building interactions._
