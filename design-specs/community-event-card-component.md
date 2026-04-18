# CommunityEventCard Component Specification

## Component Name

CommunityEventCard

## Overview

A card component displaying community event information with key details to help users quickly understand what the event is about, when and where it's happening, and how to participate. Designed with mobile-first principles and accessibility in mind to facilitate real-world connections.

## Props/State

### Props

| Prop             | Type                                  | Required | Description                                    |
| ---------------- | ------------------------------------- | -------- | ---------------------------------------------- |
| event            | CommunityEvent                        | Yes      | Event data object containing all event details |
| variant          | 'standard' \| 'compact' \| 'featured' | No       | Visual variant (default: 'standard')           |
| onRSVP           | function                              | No       | Callback when user clicks RSVP button          |
| onDetail         | function                              | No       | Callback when user clicks for more details     |
| friendsAttending | Array<User>                           | No       | List of friends attending the event            |

### CommunityEvent Interface

```typescript
interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  organizer: {
    name: string;
    avatarUrl: string;
  };
  category: 'meetup' | 'volunteer' | 'workshop' | 'social' | 'outdoor' | 'learning';
  maxAttendees: number;
  currentAttendees: number;
  isOnline: boolean;
  imageUrl?: string;
  tags: Array<string>;
  accessibilityFeatures: Array<'wheelchair' | 'asl' | 'captioning' | 'sensory' | 'service_animal'>;
  safetyGuidelines: Array<'mask_required' | 'vaccination_required' | 'outdoor_only' | 'health_screening'>;
}
```

### State

| State          | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- | ----------- | ---- | ------------------ |
| isExpanded     | boolean | Whether card is expanded to show full details |
| userRSVPStatus | 'going' | 'maybe'                                       | 'not_going' | null | User's RSVP status |
| imageLoaded    | boolean | Whether event image has loaded                |

## Behavior Description

### Initial Load

1. Display essential event information (title, date, location)
2. Show event category with appropriate color coding
3. Display attendee count with friend indicators
4. Load event image if available with proper fallbacks

### Interaction Behavior

1. **Tap/Collapse Toggle**: Expand card to show full description and details
2. **RSVP Actions**: Quick RSVP options (Going, Maybe, Not Going) with immediate feedback
3. **Detail View**: Navigate to full event page with comprehensive information
4. **Friend Connections**: Highlight friends attending with visual indicators

### Responsive Adaptation

1. **Mobile (<768px)**: Compact card with tap-to-expand behavior
2. **Tablet (768px-1024px)**: Standard display with more visible information
3. **Desktop (>1024px)**: Featured variant with expanded preview

### Performance Optimization

1. Lazy load event images with placeholder
2. Virtualize long lists of event cards
3. Cache expanded state per user session
4. Preload images for upcoming events in viewport

## Copy Stubs

### Event Title Examples

- "Neighborhood Cleanup Day"
- "Coffee & Conversation Circle"
- "Beginner's Pottery Workshop"
- "Weekly Hiking Group"

### Event Description Examples

- "Join us for our monthly neighborhood cleanup. We'll provide supplies and refreshments. Great way to meet neighbors and make a positive impact!"
- "A casual gathering for anyone interested in meaningful conversation. Bring a discussion topic or just listen."
- "Learn pottery basics in a supportive group setting. All materials provided. No experience necessary."

### UI Text

#### Labels

- "Going" / "Maybe" / "Not Going" (RSVP actions)
- "{count} friends attending" / "You and {count} others" / "Just you"
- "{category} event" (category label)
- "Accessibility: {features}" (accessibility info)
- "Safety: {guidelines}" (safety info)
- "Virtual event" / "In-person event"
- "{current}/{max} spots filled"

#### Empty States

- No image: "{eventTitle} event image"
- Loading: "Loading event details..."
- Error: "Event details unavailable"

## Accessibility Notes

### Semantic HTML Structure

```jsx
<article className="community-event-card" aria-labelledby={`event-title-${eventId}`} role="article" tabIndex="0">
  <header className="event-header">
    <h3 id={`event-title-${eventId}`}>{event.title}</h3>
    <div className="event-meta">
      <time dateTime={event.date.toISOString()}>{formattedDate}</time>
      <span className="event-location">{event.location.name}</span>
    </div>
  </header>

  <div className="event-image-container">
    {event.imageUrl ? (
      <img src={event.imageUrl} alt={`${event.title} event`} loading="lazy" onLoad={handleImageLoad} />
    ) : (
      <div className="event-image-placeholder" aria-hidden="true">
        <Icon name="calendar" />
      </div>
    )}
  </div>

  <div className="event-details">
    <div className="event-category" aria-label={`Category: ${event.category}`}>
      <Icon name={getCategoryIcon(event.category)} />
      <span>{formatCategory(event.category)}</span>
    </div>

    <p className="event-description">{event.description}</p>

    <div className="event-attendance">
      <AttendanceIcon />
      <span>{attendeeCountText}</span>
      {friendsAttending.length > 0 && (
        <div className="friends-indicator" aria-label={`${friendsAttending.length} friends attending`}>
          {/* Friend avatars */}
        </div>
      )}
    </div>

    <div className="event-actions">
      <RSVPButtonGroup status={userRSVPStatus} onStatusChange={handleRSVPChange} aria-label="RSVP to this event" />
      <button className="detail-link" onClick={onDetail} aria-label={`View details for ${event.title}`}>
        Details
      </button>
    </div>
  </div>
</article>
```

### Keyboard Navigation

- Tab to focus entire card
- Enter/Space to expand/collapse card
- Tab navigates through interactive elements within card
- Arrow keys navigate between RSVP options when focused
- Escape closes expanded view

### Screen Reader Support

- ARIA live regions for dynamic content updates
- Proper landmark structure with article role
- Descriptive labels for all interactive controls
- Hidden but accessible labels for decorative elements
- Alert messages for RSVP confirmation

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus trapped within expanded card when active
- Return focus to triggering element after closing
- Skip links for quick access to main actions

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .event-card {
    transition: none;
  }

  .expand-animation {
    animation: none;
  }
}
```

## Visual Design Implementation

### Standard Variant (Default)

```
┌─────────────────────────────────────────────────────────┐
│  Neighborhood Cleanup Day                              │
│  Saturday, April 22 • Riverside Park                   │
├─────────────────────────────────────────────────────────┤
│  [Event Image Placeholder]                             │
├─────────────────────────────────────────────────────────┤
│  [outdoor] Outdoor Activity                            │
│                                                        │
│  Join us for our monthly neighborhood cleanup.         │
│                                                        │
│  ┌───┐ ┌───┐ ┌───┐                                     │
│  │ 😊 │ │ 😊 │ │+3 │    You and 3 others                │
│  └───┘ └───┘ └───┘                                     │
│                                                        │
│  [Going] [Maybe] [Not Going]    [Details]              │
└─────────────────────────────────────────────────────────┘
```

### Compact Variant (Mobile First)

```
┌─────────────────────────────────────────────────┐
│ Neighborhood Cleanup Day                       │
│ Sat, Apr 22 • Riverside Park                   │
├─────────────────────────────────────────────────┤
│ [outdoor]                                       │
│ 😊😊+3 | [Going] [Details]                     │
└─────────────────────────────────────────────────┘
```

### Featured Variant (Prominent Display)

```
┌─────────────────────────────────────────────────────────┐
│  NEIGHBORHOOD CLEANUP DAY                             │
│  FEATURED COMMUNITY EVENT                             │
├─────────────────────────────────────────────────────────┤
│  [Large Event Image]                                   │
├─────────────────────────────────────────────────────────┤
│  Saturday, April 22 from 9:00 AM - 12:00 PM           │
│  Riverside Park, 123 Clean Street, Riverside           │
│                                                        │
│  Join us for our monthly neighborhood cleanup.        │
│  We'll provide supplies and refreshments.             │
│                                                        │
│  Category: [outdoor] Outdoor Activity                 │
│  Accessibility: Wheelchair accessible                 │
│  Safety: Outdoor only                                 │
│                                                        │
│  📈 Impact: Helped remove 200 lbs of litter last month │
│                                                        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                        │
│  │ 😊 │ │ 😊 │ │ 😊 │ │ 😊 │ │+5 │    You and 5 others │
│  └───┘ └───┘ └───┘ └───┘ └───┘                        │
│                                                        │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │    Going     │    Maybe     │  Not Going   │        │
│  │  [SELECTED]  │              │              │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                        │
│  [ View Full Details ]                                 │
│                                                        │
│  Share [Twitter] [Facebook] [Copy Link]                │
└─────────────────────────────────────────────────────────┘
```

### Design Tokens Usage

```css
.community-event-card {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-duration-fast) var(--transition-easing);
}

.community-event-card:hover {
  box-shadow: var(--shadow-md);
}

.event-title {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-2);
}

.event-meta {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.event-category {
  background-color: var(--volunteer-community);
  color: var(--text-inverse);
  border-radius: var(--border-radius-full);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
}

.event-description {
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-3) 0;
}

.event-actions button {
  background-color: var(--brand-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  font-weight: var(--font-weight-semibold);
  transition: background-color var(--transition-duration-fast) var(--transition-easing);
}

.event-actions button:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.rsvp-going {
  background-color: var(--color-success);
}

.rsvp-maybe {
  background-color: var(--color-warning);
}

.rsvp-not-going {
  background-color: var(--color-neutral);
}
```

## Technical Implementation

### React Component Structure

```jsx
const CommunityEventCard = ({ event, variant = 'standard', onRSVP, onDetail, friendsAttending = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRSVPStatus, setUserRSVPStatus] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleRSVP = (status) => {
    setUserRSVPStatus(status);
    if (onRSVP) {
      onRSVP(event.id, status);
    }
  };

  const formattedDate = formatDate(event.date);
  const attendeeCount = event.currentAttendees;
  const remainingSpots = event.maxAttendees - event.currentAttendees;

  return (
    <article
      className={`community-event-card variant-${variant} ${isExpanded ? 'expanded' : ''}`}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsExpanded(!isExpanded);
        }
      }}
      tabIndex="0"
    >
      <header className="event-header">
        <h3>{event.title}</h3>
        <div className="event-meta">
          <time dateTime={event.date.toISOString()}>
            {formattedDate} • {event.startTime}
          </time>
          <span className="event-location">{event.isOnline ? 'Virtual Event' : event.location.name}</span>
        </div>
      </header>

      <div className="event-image-container" onClick={() => !event.isOnline && setIsExpanded(!isExpanded)}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={`${event.title} event`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              setImageLoaded(false);
            }}
          />
        ) : (
          <div className="event-image-placeholder" aria-hidden="true">
            <Icon name={event.isOnline ? 'video' : 'calendar'} size="lg" />
          </div>
        )}
      </div>

      <div className="event-details">
        <div className="event-category">
          <Icon name={getCategoryIcon(event.category)} />
          <span>{formatCategory(event.category)}</span>
        </div>

        {isExpanded && <p className="event-description">{event.description}</p>}

        <div className="event-accessibility">
          {event.accessibilityFeatures.map((feature) => (
            <span key={feature} className="accessibility-badge">
              {getAccessibilityIcon(feature)}
              <span className="sr-only">{formatAccessibilityFeature(feature)}</span>
            </span>
          ))}
        </div>

        <div className="event-attendance">
          <Icon name="users" />
          <span>
            {attendeeCount} attending
            {remainingSpots < 10 && remainingSpots > 0 && ` • ${remainingSpots} spots left`}
          </span>
          {friendsAttending.length > 0 && (
            <div className="friends-indicator" aria-label={`${friendsAttending.length} friends attending`}>
              {friendsAttending.slice(0, 3).map((friend) => (
                <img key={friend.id} src={friend.avatarUrl} alt={friend.name} className="friend-avatar" />
              ))}
              {friendsAttending.length > 3 && <span className="more-friends">+{friendsAttending.length - 3}</span>}
            </div>
          )}
        </div>

        <div className="event-actions">
          <RSVPButtonGroup status={userRSVPStatus} onStatusChange={handleRSVP} />
          <button className="detail-link" onClick={onDetail}>
            Details
          </button>
        </div>
      </div>
    </article>
  );
};
```

### CSS Transitions and Animations

```css
.event-card {
  transition: all var(--transition-duration-normal) var(--transition-easing);
}

.expand-animation {
  animation: expandCard var(--transition-duration-slow) var(--transition-easing);
}

@keyframes expandCard {
  from {
    transform: scaleY(0.95);
    opacity: 0.8;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn var(--transition-duration-fast) var(--transition-easing);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-card,
  .expand-animation,
  .fade-in {
    transition: none;
    animation: none;
  }
}
```

### Virtualization for Performance

```jsx
// For event lists with many cards
const VirtualizedEventList = ({ events, ...props }) => {
  const [containerRef, visibleEvents] = useVisibleItems(events, {
    itemHeight: 200, // Approximate card height
    buffer: 5, // Number of off-screen items to render
  });

  return (
    <div ref={containerRef} className="virtualized-event-list">
      {visibleEvents.map(([index, event]) => (
        <CommunityEventCard key={event.id} event={event} index={index} {...props} />
      ))}
    </div>
  );
};
```

## Dependencies

- React 19 (front-end framework)
- Design system tokens (CSS variables)
- Icons from design system
- CSS animations and transitions
- Intersection Observer API for lazy loading
- Optional: Virtualization library for large lists

## Testing Requirements

1. Unit tests for RSVP functionality
2. Accessibility audit with screen readers
3. Cross-browser compatibility verification
4. Mobile responsiveness testing across device sizes
5. Performance testing with 50+ event cards
6. Keyboard navigation testing
7. Focus management validation
8. Image loading and error handling tests

## Integration Requirements

### For CTO (b02a21c7)

1. API endpoint for fetching community events
2. Real-time attendee count updates
3. Image optimization pipeline for event photos
4. Geolocation services for nearby events
5. Push notifications for event reminders
6. Calendar integration endpoints

### For CMO (2c40ae74)

1. Copy approval for event descriptions
2. Brand voice guidelines for event titles
3. Legal compliance verification for event listings
4. Accessibility copy review
5. Safety messaging standards alignment

## Success Metrics Framework

### Engagement Metrics

- Event detail view rate
- RSVP conversion rate
- Friend invitation acceptance rate
- Event attendance vs RSVP rate
- Average time spent viewing events

### Community Impact Indicators

- Number of events created monthly
- Attendee diversity metrics
- Repeat event attendance rates
- New connection formation rate through events
- Community feedback sentiment scores

### Performance Benchmarks

- Initial render time < 100ms for card
- Image load time < 2 seconds
- RSVP action response < 300ms
- Accessibility audit score > 95%
- Mobile Lighthouse performance score > 85

---

_Component specification aligns with YouAndINotAI's mobile-first, accessibility-first approach while facilitating real-world community connections through engaging event discovery._
