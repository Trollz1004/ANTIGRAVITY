# Event Feature Color Tokens

## Overview

This document defines specialized color tokens for the event features within YouAndINotAI. These tokens extend the base design system to provide consistent visual language for community events, meetups, and gatherings.

## Event Category Colors

| Token               | Value            | Usage                                |
| ------------------- | ---------------- | ------------------------------------ |
| `--event-meetup`    | #8B5CF6 (Purple) | Social meetups and casual gatherings |
| `--event-volunteer` | #06B6D4 (Cyan)   | Volunteer opportunities              |
| `--event-workshop`  | #F59E0B (Amber)  | Educational workshops and classes    |
| `--event-social`    | #EC4899 (Pink)   | Social activities and parties        |
| `--event-outdoor`   | #10B981 (Green)  | Outdoor activities and adventures    |
| `--event-learning`  | #3B82F6 (Blue)   | Learning-focused events              |

## Event Status Colors

| Token               | Value           | Usage                      |
| ------------------- | --------------- | -------------------------- |
| `--event-draft`     | #9CA3AF (Gray)  | Unpublished/private events |
| `--event-published` | #10B981 (Green) | Published public events    |
| `--event-cancelled` | #EF4444 (Red)   | Cancelled events           |
| `--event-ongoing`   | #F59E0B (Amber) | Currently happening events |
| `--event-completed` | #6B7280 (Gray)  | Past events                |

## Attendance Status Colors

| Token                    | Value            | Usage                          |
| ------------------------ | ---------------- | ------------------------------ |
| `--attendance-going`     | #10B981 (Green)  | Confirmed attendance           |
| `--attendance-maybe`     | #F59E0B (Amber)  | Tentative attendance           |
| `--attendance-not-going` | #EF4444 (Red)    | Declined attendance            |
| `--attendance-invited`   | #3B82F6 (Blue)   | Pending invitation response    |
| `--attendance-waitlist`  | #8B5CF6 (Purple) | On waiting list for full event |

## Accessibility Feature Colors

| Token                            | Value            | Usage                              |
| -------------------------------- | ---------------- | ---------------------------------- |
| `--accessibility-wheelchair`     | #3B82F6 (Blue)   | Wheelchair accessible              |
| `--accessibility-asl`            | #10B981 (Green)  | American Sign Language interpreter |
| `--accessibility-captioning`     | #8B5CF6 (Purple) | Live captioning available          |
| `--accessibility-sensory`        | #F59E0B (Amber)  | Sensory-friendly accommodations    |
| `--accessibility-service-animal` | #06B6D4 (Cyan)   | Service animal welcome             |

## Safety Feature Colors

| Token                       | Value           | Usage                            |
| --------------------------- | --------------- | -------------------------------- |
| `--safety-mask-required`    | #F59E0B (Amber) | Face coverings required          |
| `--safety-vaccination`      | #10B981 (Green) | Vaccination documentation needed |
| `--safety-outdoor-only`     | #10B981 (Green) | Outdoor-only venues              |
| `--safety-health-screening` | #F59E0B (Amber) | Health screening procedures      |
| `--safety-contact-tracing`  | #3B82F6 (Blue)  | Contact tracing protocols        |

## RSVP Action Colors

| Token                     | Value            | Usage                  |
| ------------------------- | ---------------- | ---------------------- |
| `--rsvp-action-primary`   | #FF4F00 (Orange) | Primary RSVP action    |
| `--rsvp-action-secondary` | #6B7280 (Gray)   | Secondary RSVP actions |
| `--rsvp-action-danger`    | #EF4444 (Red)    | Cancel/remove RSVP     |

## Implementation Guidelines

### Consistent Usage

1. Use category colors consistently across all event-related components
2. Apply status colors to badges, labels, and status indicators
3. Match accessibility icons with corresponding colors
4. Use RSVP action colors for all RSVP-related buttons

### Accessibility Compliance

1. All text colors on event backgrounds must maintain 4.5:1 contrast ratio
2. Use appropriate ARIA labels when using color alone to convey meaning
3. Ensure sufficient color differentiation for colorblind users
4. Provide alternative indicators beyond color for critical information

### Mobile-First Considerations

1. Use high-contrast colors for small touch targets
2. Ensure colors are distinguishable on various screen types
3. Test color visibility under different lighting conditions
4. Maintain consistent meaning across all breakpoints

These color tokens should be implemented as CSS custom properties and imported into the main design system stylesheet.

```css
/* Event Feature Color Tokens */
--event-meetup: #8b5cf6;
--event-volunteer: #06b6d4;
--event-workshop: #f59e0b;
--event-social: #ec4899;
--event-outdoor: #10b981;
--event-learning: #3b82f6;

--event-draft: #9ca3af;
--event-published: #10b981;
--event-cancelled: #ef4444;
--event-ongoing: #f59e0b;
--event-completed: #6b7280;

--attendance-going: #10b981;
--attendance-maybe: #f59e0b;
--attendance-not-going: #ef4444;
--attendance-invited: #3b82f6;
--attendance-waitlist: #8b5cf6;

--accessibility-wheelchair: #3b82f6;
--accessibility-asl: #10b981;
--accessibility-captioning: #8b5cf6;
--accessibility-sensory: #f59e0b;
--accessibility-service-animal: #06b6d4;

--safety-mask-required: #f59e0b;
--safety-vaccination: #10b981;
--safety-outdoor-only: #10b981;
--safety-health-screening: #f59e0b;
--safety-contact-tracing: #3b82f6;

--rsvp-action-primary: #ff4f00;
--rsvp-action-secondary: #6b7280;
--rsvp-action-danger: #ef4444;
```

These tokens ensure visual consistency across all event components while maintaining accessibility standards and supporting YouAndINotAI's mobile-first, trust-building design philosophy.
