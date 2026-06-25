# Enhanced Event Creation Flow Specification

## Overview

This specification outlines an improved event creation experience for YouAndINotAI that emphasizes mobile-first design, location awareness, and streamlined form completion. The goal is to reduce friction while maintaining security and trust.

## Design Goals

1. **Mobile-First**: Optimized touch interactions and minimal form fields
2. **Location-Aware**: Smart defaults with explicit user consent
3. **Streamlined**: Reduce steps from idea to published event
4. **Inclusive**: Accessible to all users regardless of ability
5. **Trust-Building**: Clear privacy controls and consent mechanisms

## User Journey

### Current State Analysis

From reviewing `Events.tsx` and `MeetupsDiscovery.tsx`, the current flow requires:

- Title input
- Description text area
- Location field
- Date/time picker
- Max attendees (optional)
- Separate create button

### Proposed Enhanced Flow

#### Step 1: Event Intent

```
┌─────────────────────────────────────────────────┐
│  ← Create Event                                ≡│
├─────────────────────────────────────────────────┤
│                                                 │
│  What kind of gathering are you planning?       │
│                                                 │
│  [_community cleanup_] [book club_] [potluck_]  │
│  [volunteer drive_] [game night_] [other_]      │
│                                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │ Describe your event (required)              │ │
│  │ We're organizing a neighborhood cleanup...  │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  [ Continue ]                                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Step 2: Location & Timing

```
┌─────────────────────────────────────────────────┐
│  ← Back            Create Event               ≡ │
├─────────────────────────────────────────────────┤
│                                                 │
│  Where and when will this happen?               │
│                                                 │
│  [Use My Location] Pin on Map] [Manual Entry_]  │
│                                                 │
│  Location (required)                            │
│  ┌─────────────────────────────────────────────┐ │
│  │ 123 Main St, Orlando FL                    ⊙│ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  Date & Time (required)                         │
│  ┌─────────┐  ┌─────────────┐                   │
│  │ Apr 25  │  │  2:00 PM    │                   │
│  └─────────┘  └─────────────┘                   │
│                                                 │
│  Duration (optional)                            │
│  ┌─────────────┐  ┌─────────┐                   │
│  │ 2 hours     │  │ +       │                   │
│  └─────────────┘  └─────────┘                   │
│                                                 │
│  [ Continue ]                                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Step 3: Details & Safety

```
┌─────────────────────────────────────────────────┐
│  ← Back            Create Event               ≡ │
├─────────────────────────────────────────────────┤
│                                                 │
│  Event Details                                  │
│                                                 │
│  Category                                       │
│  ┌─────────────────────────────────────────────┐ │
│  │ [outdoor] Outdoor Activity                 ∨│ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  Who can join?                                  │
│  ◎ Public (anyone can join)                     │
│  ○ Private (invite only)                        │
│  ○ Friends of Friends                           │
│                                                 │
│  Size Limit                                     │
│  ┌─────────────────────────────────────────────┐ │
│  │ No limit                                   ∨│ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  Safety Features                                │
│  [Accessibility info] [Emergency contact] [...] │
│                                                 │
│  [ Publish Event ]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Component Specifications

### LocationSelector Component

```jsx
<LocationSelector
  initialValue={null}
  onLocationSelect={(coords) => handleLocationChange(coords)}
  onAddressChange={(address) => handleAddressChange(address)}
  onError={(error) => handleLocationError(error)}
/>
```

Props:

- `initialValue`: Initial location state (Coords | null)
- `onLocationSelect`: Callback when GPS location is selected
- `onAddressChange`: Callback when manual address is entered
- `onError`: Error handler for location services

Sub-components:

1. LocationMethodToggle: GPS/Manual selector
2. GPSPermissionHandler: Request and handle geolocation
3. AddressAutocomplete: Searchable address input
4. MiniMapPreview: Visual location confirmation

### DateTimePicker Component

```jsx
<DateTimePicker
  value={selectedDateTime}
  onChange={(dateTime) => handleDateTimeChange(dateTime)}
  showDuration={true}
  minDate={new Date()}
/>
```

Props:

- `value`: Current datetime selection
- `onChange`: Update handler for datetime changes
- `showDuration`: Display duration controls
- `minDate`: Earliest selectable date (default: today)

Features:

- Date selection with calendar view
- Time selection with 30-minute increments
- Duration calculator
- Timezone awareness

### EventIntentSelector Component

```jsx
<EventIntentSelector
  onSelect={(intent) => handleIntentSelect(intent)}
  onDescriptionChange={(desc) => handleDescriptionChange(desc)}
/>
```

Props:

- `onSelect`: Handler for predefined intent selection
- `onDescriptionChange`: Handler for custom description

Options:

- Community cleanup
- Book club meeting
- Potluck dinner
- Volunteer drive
- Game night
- Other (custom)

### SafetyFeaturesPanel Component

```jsx
<SafetyFeaturesPanel features={selectedFeatures} onChange={(features) => handleSafetyFeaturesChange(features)} />
```

Props:

- `features`: Array of selected safety features
- `onChange`: Handler for feature selection changes

Features:

- Accessibility accommodations
- Emergency contact information
- Background check reminders
- Code of conduct agreement
- Weather contingency plans

## Interaction Design

### Touch Targets

All interactive elements follow WCAG guidelines:

- Minimum 48px touch targets for primary actions
- 32px minimum for secondary actions
- Adequate spacing (minimum 8px) between interactive elements

### Gestures

- Horizontal swipe to switch between creation steps
- Long press on location for map preview
- Double tap on date for quick selection

### Keyboard Navigation

- Tab order follows visual layout
- Enter key submits forms
- Escape key cancels/modifies selections
- Arrow keys navigate radio/checkbox groups

## Accessibility Features

### Screen Reader Support

- ARIA labels for all interactive elements
- Live regions for form validation
- Semantic HTML structure
- Skip link to main content

### Visual Design

- Minimum 4.5:1 color contrast ratios
- Focus indicators for keyboard navigation
- Reduced motion option support
- Text resizing compatibility

### Cognitive Considerations

- Clear step progression
- Undo/redo capability
- Plain language labels
- Consistent iconography

## Privacy & Consent

### Location Privacy

- Explicit opt-in for GPS usage
- Clear explanation of data usage
- Session-only location storage
- One-tap location clearing

### Data Collection Transparency

- Just-in-time disclosure of required information
- Clear indication of optional vs. required fields
- Preview of public event information before publishing
- Easy access to privacy settings

## Responsive Design

### Mobile (320px - 480px)

- Single column layout
- Large touch targets
- Minimal text inputs
- Fixed footer action bar

### Tablet (768px - 1024px)

- Split-screen preview
- Expanded form fields
- Contextual help tooltips
- Step progress indicator

### Desktop (1024px+)

- Multi-panel wizard layout
- Real-time event preview
- Advanced scheduling options
- Keyboard shortcuts

## Animation & Microinteractions

### Loading States

- Skeleton screens for form fields
- Progress indicators during geolocation
- Success animations after publication

### Feedback Animations

- Field validation states
- Step completion transitions
- GPS acquisition spinner

### Transition Patterns

- Slide transitions between steps
- Fade in for new content
- Bounce effect for successful actions

## Error Handling

### Form Validation

- Real-time validation as user types
- Clear error messaging
- Visual indicators for invalid fields
- Prevent submission with errors

### Location Services

- Handle denied permissions gracefully
- Provide manual fallback entry
- Cache last known good location
- Explain why location is beneficial

## Technical Specifications

### State Management

```javascript
const eventCreationState = {
  step: 1,
  intent: null,
  description: '',
  location: {
    method: 'manual', // or "gps"
    coords: null,
    address: '',
  },
  dateTime: {
    date: null,
    time: null,
    duration: null,
  },
  details: {
    category: 'general',
    visibility: 'public',
    sizeLimit: null,
  },
  safety: [],
  validation: {
    errors: {},
    isValid: false,
  },
};
```

### API Integration

```http
POST /api/events
{
  "intent": "community_cleanup",
  "description": "Neighborhood cleanup day",
  "location": {
    "latitude": 28.5383,
    "longitude": -81.3792,
    "address": "123 Main St, Orlando FL"
  },
  "event_date": "2026-04-25T14:00:00Z",
  "duration_minutes": 120,
  "category": "outdoor",
  "visibility": "public",
  "max_attendees": null,
  "safety_features": ["accessibility_info"]
}
```

## Success Metrics

### Engagement KPIs

- Event creation completion rate (target: >85%)
- Time from start to publish (target: <3 minutes)
- Mobile vs desktop completion rates
- Location service adoption rate

### Quality Metrics

- Events with complete location information
- Events with safety features enabled
- User satisfaction rating (post-creation survey)
- Percentage of events with accurate timing

### Business Impact

- New events created per week
- RSVP conversion rate for new events
- Community engagement with newly created events
- Retention of event organizers

## Implementation Roadmap

### Phase 1: Core Flow

1. Implement simplified 3-step creation wizard
2. Add LocationSelector component with GPS/manual options
3. Create EventIntentSelector with predefined templates
4. Basic validation and error handling

### Phase 2: Enhanced Features

1. Add SafetyFeaturesPanel with accessibility options
2. Implement DateTimePicker with duration controls
3. Add preview functionality before publishing
4. Create responsive layouts for all device sizes

### Phase 3: Refinement

1. Add animation and microinteraction polish
2. Implement detailed analytics tracking
3. Conduct accessibility audit and remediation
4. User testing and iteration

## Coordination Requirements

### For CTO (b02a21c7)

1. Backend API endpoint for enhanced event creation
2. Geocoding service integration for address validation
3. Database schema updates for new event properties
4. Rate limiting for event creation to prevent abuse

### For CMO (2c40ae74)

1. Copywriting for event intent templates
2. Safety feature descriptions and guidance
3. Onboarding messaging for new event creators
4. Content moderation policies for event descriptions

### For Development Team

1. Component implementation following design system tokens
2. Unit tests for validation logic
3. Responsive implementation across breakpoints
4. Accessibility compliance testing
