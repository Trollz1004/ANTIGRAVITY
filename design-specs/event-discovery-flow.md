# Event Discovery Flow Specification

## Overview

A comprehensive design specification for the event discovery experience within YouAndINotAI, connecting users with meaningful community events through an intuitive, accessible, and mobile-first interface. This specification integrates the CommunityEventCard, RSVPButtonGroup, and other supporting components into a cohesive flow.

## User Journey Map

### Phase 1: Discovery

1. User browses event feed or uses search/filter
2. Events presented as CommunityEventCards
3. Key information visible at a glance
4. Quick actions available (RSVP, Details)

### Phase 2: Evaluation

1. User taps for more information
2. Card expands to show full event details
3. Accessibility and safety features highlighted
4. Friend connections shown

### Phase 3: Decision

1. User selects RSVP status using RSVPButtonGroup
2. Immediate visual confirmation of selection
3. Optional addition to personal calendar
4. Sharing options for inviting friends

### Phase 4: Follow-up

1. Calendar reminders sent before event
2. Pre-event preparation information
3. Post-event reflection prompts
4. Connection suggestions based on shared events

## Screen Flows

### Home Feed with Events Section

```
┌─────────────────────────────────────────────────────────┐
│  YouAndINotAI                                          ≡ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Upcoming Events Near You                               │
│                                                         │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│                                                         │
│  [View All Events]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Dedicated Events Feed

```
┌─────────────────────────────────────────────────────────┐
│  ← Events                                              ≡ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Filter] [Sort] [Map/List]                             │
│                                                         │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│  [CommunityEventCard]                                   │
│                                                         │
│  [Load More]                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Event Detail View

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                                                ≡ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Neighborhood Cleanup Day                              ★ │
│  Saturday, April 22 • 9:00 AM - 12:00 PM               │
│  Riverside Park, 123 Clean Street                      │
│                                                         │
│  [Event Image]                                          │
│                                                         │
│  Join us for our monthly neighborhood cleanup.         │
│  We'll provide supplies and refreshments.              │
│                                                         │
│  Category: [outdoor] Outdoor Activity                  │
│  Accessibility: ♿ Wheelchair accessible               │
│  Safety: 🌳 Outdoor only                               │
│                                                         │
│  Impact: Helped remove 200 lbs of litter last month    │
│                                                         │
│  😊 😊 😊 +5 friends attending                          │
│                                                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │    Going     │    Maybe     │  Not Going   │        │
│  │  [SELECTED]  │              │              │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  [ Add to Calendar ]  [ Share Event ]                  │
│                                                         │
│  Organizer: Sarah Johnson                              │
│  Contact: sarah@example.com                            │
│                                                         │
│  Discussion (3 comments)                               │
│  👤 Jane Doe: Looking forward to this!                 │
│  👤 Mike Chen: Bringing work gloves, see you there!    │
│  [ Add a comment... ]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Event Filtering Options

```
┌─────────────────────────────────────────────────────────┐
│  ← Back    Filter                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  When                                               ›   │
│  □ Today              □ This Weekend                   │
│  □ Tomorrow           □ Next Week                      │
│                                                         │
│  Categories                                             │
│  ■ Meetups (12)       □ Workshops (8)                  │
│  ■ Volunteering (15)  □ Social Events (22)             │
│  □ Outdoors (9)       □ Learning (5)                   │
│                                                         │
│  Distance                                               │
│  ◉ Within 5 miles     ○ Within 10 miles                │
│                                                         │
│  Accessibility                                          │
│  □ Wheelchair Access  □ ASL Interpretation             │
│  □ Captioning         □ Service Animals Welcome       │
│                                                         │
│  [Reset] [Apply Filters]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Integration

### CommunityEventCard within Event Feed

```jsx
<EventFeed>
  {events.map((event) => (
    <CommunityEventCard
      key={event.id}
      event={event}
      variant={isFeatured(event) ? 'featured' : 'standard'}
      onRSVP={(eventId, status) => handleRSVP(eventId, status)}
      onDetail={() => navigateToEventDetail(event.id)}
      friendsAttending={getFriendsAttending(event.id)}
    />
  ))}
</EventFeed>
```

### RSVPButtonGroup in Event Detail

```jsx
<EventDetailView event={currentEvent}>
  {/* Event details content */}

  <RSVPButtonGroup
    eventId={currentEvent.id}
    status={userRSVPStatus}
    onStatusChange={(eventId, status) => handleRSVPUpdate(eventId, status)}
    size="lg"
    variant="segmented"
  />

  {rsvpSuccess && <CalendarIntegrationPrompt event={currentEvent} onAddToCalendar={handleAddToCalendar} />}
</EventDetailView>
```

### Filtering System

```jsx
<EventFilters
  filters={currentFilters}
  onFilterChange={handleFilterChange}
  onApply={applyFilters}
  onReset={resetFilters}
>
  <DateFilter />
  <CategoryFilter />
  <DistanceFilter />
  <AccessibilityFilter />
</EventFilters>
```

## Responsive Design Patterns

### Mobile Phone (320px - 480px)

```
┌─────────────────────────────┐
│ Events                     ≡│
├─────────────────────────────┤
│[Filter]                     │
│                             │
│[Card compact]               │
│Title & date only            │
│                             │
│[Card compact]               │
│                             │
│[Load More]                  │
└─────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌─────────────────────────────────────────────────┐
│ ← Events                                       ≡│
├────────┬────────────────────────────────────────┤
│Filters │ [Card standard]                        │
│        │ Neighborhood Cleanup Day              │
│        │ Apr 22 • Riverside Park               │
│        │ [outdoor] [Accessibility]             │
│        │                                       │
│        │ [Card standard]                       │
│        │ Coffee & Conversation                 │
│        │ Apr 23 • Downtown Cafe                │
│        │ [social]                              │
│        │                                       │
└────────┴────────────────────────────────────────┘
```

### Desktop (1024px+)

```
┌─────────────────────────────────────────────────────────┐
│ ← Events                                               ≡│
├────────┬────────────────────────────────────────────────┤
│Filters │ [Card featured]                               │
│        │ NEIGHBORHOOD CLEANUP DAY                      │
│        │ Featured Community Event                     │
│        │ [Image]                                       │
│        │ Apr 22 • 9:00 AM - 12:00 PM • Riverside Park │
│        │ [outdoor] [Accessibility] [Safety]            │
│        │                                               │
│        │ [Card standard]                              │
│        │ Coffee & Conversation                        │
│        │ Apr 23 • Downtown Cafe                       │
│        │ [social]                                     │
│        │                                               │
│        │ [Load More]                                   │
└────────┴────────────────────────────────────────────────┘
```

## Accessibility Implementation

### Navigation Flow

1. **Landmark Structure**:
   - `banner` for header/navigation
   - `main` for primary content
   - `complementary` for filters/sidebar
   - `contentinfo` for footer

2. **Skip Links**:
   - "Skip to event feed"
   - "Skip to filters"
   - "Skip to main content"

3. **Focus Management**:
   - Trap focus in modals/filters
   - Return focus after closing overlays
   - Visible focus indicators throughout

### Screen Reader Experience

1. **Live Regions**:
   - Announce filter results
   - Confirm RSVP status changes
   - Notify of network errors

2. **ARIA Attributes**:
   - `aria-live` for dynamic updates
   - `aria-describedby` for contextual help
   - `aria-expanded` for collapsible sections

3. **Semantic Markup**:
   - Proper heading hierarchy (h1 → h3)
   - List structures for event collections
   - Definition lists for event metadata

## Performance Optimization

### Loading Strategies

1. **Skeleton Loading**:

   ```jsx
   {
     isLoading ? <EventCardSkeleton count={5} /> : <EventFeed events={events} />;
   }
   ```

2. **Virtualized Lists**:

   ```jsx
   <VirtualizedEventList events={allEvents} itemHeight={200} overscan={5} />
   ```

3. **Image Optimization**:
   - Lazy loading with `loading="lazy"`
   - Responsive images with `srcset`
   - WebP format where supported

### Data Management

1. **Client-side Caching**:
   - Recent event data persisted locally
   - Expire after 1 hour to maintain freshness
   - Offline support for bookmarked events

2. **Pagination Strategy**:
   - Infinite scroll with 10 events per page
   - Pre-fetch next page when nearing bottom
   - Manual "Load More" fallback for slow connections

3. **Search Optimization**:
   - Debounced search input (300ms delay)
   - Client-side filtering for instant response
   - Server-side search for complex queries

## Copy Guidelines

### Voice and Tone

1. **Inclusive**: Language that welcomes all community members
2. **Encouraging**: Positive framing that promotes participation
3. **Clear**: Direct, actionable language without jargon
4. **Trustworthy**: Honest representation of event details

### Key Phrases

| Context         | Recommended Copy                              |
| --------------- | --------------------------------------------- |
| Event Title     | Verbs first: "Clean," "Connect," "Create"     |
| Calls to Action | "Join us," "Be part of," "Make an impact"     |
| Status Updates  | "You're going!" "Added to calendar"           |
| Empty States    | "No upcoming events nearby" "Check back soon" |
| Error Messages  | "Having trouble? Try refreshing"              |

### Legal Compliance

1. **Florida §496.405 Adherence**:
   - No "join as a member" or "membership support" in event descriptions
   - "Support" or "contribute" used instead
   - Clear distinction between nonprofit and commercial events

2. **Privacy Considerations**:
   - Explicit consent for photo/video sharing
   - Clear opt-out mechanisms
   - Data retention policies communicated

## Technical Specifications

### API Integration Points

1. **Event Discovery Endpoints**:

   ```http
   GET /api/events?lat=:lat&lng=:lng&radius=:radius&categories=:cats
   POST /api/events/search
   GET /api/events/:id
   ```

2. **RSVP Management**:

   ```http
   POST /api/events/:id/rsvp
   DELETE /api/events/:id/rsvp
   GET /api/users/:userId/rsvps
   ```

3. **Filtering System**:
   ```http
   GET /api/events/categories
   GET /api/events/accessibility-options
   GET /api/events/filters?query=:query
   ```

### State Management

```javascript
// Global state structure for events
{
  events: {
   .byId: {
      "event_123": { /* event data */ },
      "event_456": { /* event data */ }
    },
    allIds: ["event_123", "event_456"],
    filters: {
      categories: [],
      dateRange: null,
      distance: 10,
      accessibility: []
    },
    sort: "date",
    pagination: {
      page: 1,
      hasNext: true,
      totalCount: 42
    }
  },
  rsvp: {
    byEventId: {
      "event_123": "going",
      "event_456": "maybe"
    }
  }
}
```

## Success Metrics Framework

### Key Performance Indicators

1. **Engagement Metrics**:
   - Event view-to-RSVP conversion rate
   - Average time spent on event detail pages
   - Number of events attended per active user
   - Friend invitation acceptance rate

2. **Community Impact**:
   - Total event attendance hours
   - New connections formed through events
   - Volunteer hours contributed
   - Positive feedback sentiment ratio

3. **Technical Performance**:
   - Event feed load time < 2 seconds
   - RSVP action response time < 500ms
   - Accessibility audit score > 95%
   - Mobile Lighthouse performance > 85

### Monitoring & Reporting

1. **Event Tracking**:
   - "Event Card Tapped"
   - "RSVP Button Clicked"
   - "Filters Applied"
   - "Event Shared"

2. **Error Tracking**:
   - RSVP submission failures
   - Event detail load errors
   - Filter application timeouts
   - Calendar integration issues

3. **A/B Testing Opportunities**:
   - Card layout variations
   - RSVP button placement
   - Filter panel position
   - Default sort order

## Coordination Requirements

### For CTO (b02a21c7)

1. **Backend Services**:
   - RESTful API for event management
   - Real-time WebSocket for RSVP updates
   - Geolocation service integration
   - Image CDN configuration

2. **Infrastructure**:
   - Auto-scaling for event feeds
   - Caching strategy for frequently accessed events
   - Security measures for event submissions
   - Backup and disaster recovery

### For CMO (2c40ae74)

1. **Content Strategy**:
   - Event title and description templates
   - Category definitions and usage guidelines
   - Accessibility copy standards
   - Community storytelling framework

2. **Brand Alignment**:
   - Messaging tone consistency
   - Visual treatment of featured events
   - Crisis communication protocols
   - Seasonal campaign integration

---

This specification provides a comprehensive framework for event discovery within YouAndINotAI, prioritizing user experience while maintaining the platform's core values of authenticity, inclusivity, and community building.
