# CommunitySpotlight Component Specification

## Component Name

CommunitySpotlight

## Overview

A carousel component showcasing real users and their meaningful connections formed through YouAndINotAI, emphasizing the platform's impact on building genuine community relationships.

## Props/State

### Props

| Prop       | Type                                     | Required | Description                             |
| ---------- | ---------------------------------------- | -------- | --------------------------------------- |
| stories    | Array<CommunityStory>                    | Yes      | Collection of community stories         |
| autoplay   | boolean                                  | No       | Enable/disable autoplay (default: true) |
| interval   | number                                   | No       | Autoplay interval in ms (default: 5000) |
| showDots   | boolean                                  | No       | Show navigation dots (default: true)    |
| showArrows | boolean                                  | No       | Show navigation arrows (default: true)  |
| variant    | 'standard' \| 'compact' \| 'testimonial' | No       | Visual variant                          |

### CommunityStory Interface

```typescript
interface CommunityStory {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    location: string;
  };
  connection: {
    name: string;
    avatarUrl: string;
  };
  story: string;
  impact: {
    hoursSpentTogether: number;
    activitiesDone: number;
    friendshipDuration: string; // e.g., "8 months"
  };
  media?: {
    type: 'image' | 'video';
    url: string;
    caption?: string;
  };
  tags: Array<'meetup' | 'volunteer' | 'friends' | 'mentor' | 'neighborhood'>;
}
```

### State

| State        | Type    | Description                   |
| ------------ | ------- | ----------------------------- |
| currentIndex | number  | Currently visible story index |
| isPlaying    | boolean | Autoplay status               |
| isHovered    | boolean | Mouse hover state             |
| isLoaded     | boolean | Media loading state           |

## Behavior Description

### Initial Load

1. Render skeleton loader while fetching stories
2. Display first story with fade-in animation
3. Initialize autoplay timer if enabled
4. Apply appropriate ARIA attributes for accessibility

### Navigation Behavior

1. **Automatic Rotation**: Advance to next story at specified interval
2. **Manual Navigation**: Users can pause autoplay and navigate manually
3. **Keyboard Control**: Arrow keys for navigation, space to pause/play
4. **Swipe Gestures**: Touch swipe support on mobile devices

### Responsive Adaptation

1. **Mobile (<768px)**: Single column layout, simplified controls
2. **Tablet (768px-1024px)**: Two-column layout with condensed information
3. **Desktop (>1024px)**: Full featured layout with media integration

### Performance Optimization

1. Lazy load story media content
2. Prefetch adjacent stories for smooth transitions
3. Implement virtual scrolling for large story collections
4. Use CSS containment for isolated repaints

## Copy Stubs

### Story Examples

```json
[
  {
    "id": "story_001",
    "user": {
      "name": "Maya Rodriguez",
      "avatarUrl": "/avatars/maya.jpg",
      "location": "Austin, TX"
    },
    "connection": {
      "name": "David Kim",
      "avatarUrl": "/avatars/david.jpg"
    },
    "story": "We met at the community garden volunteer event and bonded over our love of sustainable farming. Now we co-organize monthly cleanups and have introduced 12 new families to urban gardening!",
    "impact": {
      "hoursSpentTogether": 84,
      "activitiesDone": 9,
      "friendshipDuration": "14 months"
    },
    "tags": ["volunteer", "friends", "community"]
  },
  {
    "id": "story_002",
    "user": {
      "name": "James Thompson",
      "avatarUrl": "/avatars/james.jpg",
      "location": "Portland, OR"
    },
    "connection": {
      "name": "Sarah Johnson",
      "avatarUrl": "/avatars/sarah.jpg"
    },
    "story": "As new parents, we connected at the family-friendly meetup. Now our kids play together weekly, and we've organized 3 parent networking events that have brought together 40 local families.",
    "impact": {
      "hoursSpentTogether": 62,
      "activitiesDone": 15,
      "friendshipDuration": "11 months"
    },
    "tags": ["meetup", "friends", "community"]
  }
]
```

### UI Text

- Header: "Real Connections. Real Stories."
- Subheader: "Meet people who genuinely care through our community"
- CTA: "Create Your Story"
- Empty State: "No stories available at this time"

## Accessibility Notes

### Semantic HTML Structure

```jsx
<section
  className="community-spotlight"
  aria-label="Community Stories Carousel"
  aria-describedby="community-spotlight-desc"
  role="region"
>
  <h2 id="community-spotlight-title">Real Connections. Real Stories.</h2>
  <p id="community-spotlight-desc">
    See how people are forming genuine relationships and making impact through YouAndINotAI.
  </p>

  <div
    className="spotlight-carousel"
    role="group"
    aria-roledescription="carousel"
    aria-labelledby="community-spotlight-title"
  >
    {/* Story items with proper ARIA */}
  </div>

  <div className="carousel-controls">
    <button className="carousel-prev" aria-label="Previous story" onClick={goToPrev}>
      ←
    </button>

    <div className="carousel-indicators" role="tablist">
      {stories.map((_, index) => (
        <button
          key={index}
          role="tab"
          aria-selected={index === currentIndex}
          aria-label={`Story ${index + 1}`}
          onClick={() => goToIndex(index)}
        />
      ))}
    </div>

    <button className="carousel-next" aria-label="Next story" onClick={goToNext}>
      →
    </button>
  </div>
</section>
```

### Keyboard Navigation

- Tab to navigate between interactive elements
- Left/Right arrow keys to navigate stories
- Space bar to toggle autoplay
- Home/End keys to jump to first/last story
- PageUp/PageDown for 5-story jumps

### Screen Reader Support

- Live region announces story changes
- ARIA live="polite" for non-interruptive updates
- Descriptive labels for all interactive controls
- Proper heading structure (H2 for component title)

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus traps within modal dialogs if applicable
- Programmatic focus movement on navigation
- Skip links for keyboard users

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .story-transition {
    transition: none;
  }

  .autoplay-indicator {
    animation: none;
  }
}
```

## Visual Design Implementation

### Standard Variant

```
┌─────────────────────────────────────────────────────────────┐
│  Real Connections. Real Stories.                            │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Maya Rodriguez • Austin, TX                         │  │
│  │  Connected with David Kim                            │  │
│  │                                                       │  │
│  │  ┌─────────────┐                                      │  │
│  │  │             │  We met at the community garden...   │  │
│  │  │    Media    │  Now we co-organize monthly cleanups  │  │
│  │  │             │  and have introduced 12 new families │  │
│  │  └─────────────┘  to urban gardening!                │  │
│  │                                                       │  │
│  │  Impact: 84 hours together • 9 activities • 14 months │  │
│  │  Tags: [volunteer] [friends] [community]             │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ◀ ○○○○○○○○○○○○○○○○○○○ ○▶                                 │
└─────────────────────────────────────────────────────────────┘
```

### Compact Variant (Mobile)

```
┌─────────────────────────────────────────────────┐
│  Real Stories                                   │
├─────────────────────────────────────────────────┤
│  Maya R.                                        │
│  Connected with David K                         │
│                                                 │
│  "We met at the community garden and now co-   │
│  organize monthly cleanups!"                   │
│                                                 │
│  84 hrs together • 9 activities • 14 months    │
├─────────────────────────────────────────────────┤
│  ● ○ ○ ○ ○                                    │
└─────────────────────────────────────────────────┘
```

### Design Tokens Usage

```css
.community-spotlight {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-mobile-padding);
  box-shadow: var(--shadow-md);
}

.story-header {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-4);
}

.story-content {
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}

.impact-stats {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.tag {
  background-color: var(--volunteer-community);
  color: var(--text-inverse);
  border-radius: var(--border-radius-full);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.carousel-control {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-full);
  color: var(--text-primary);
  width: var(--spacing-8);
  height: var(--spacing-8);
}

.carousel-control:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

## Technical Implementation

### React Component Structure

```jsx
const CommunitySpotlight = ({
  stories,
  autoplay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  variant = 'standard',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Autoplay effect
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const timer = setTimeout(() => {
      goToNext();
    }, interval);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, isHovered, interval]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        goToPrev();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case ' ':
        e.preventDefault();
        setIsPlaying(!isPlaying);
        break;
    }
  };

  return (
    <section
      className={`community-spotlight variant-${variant}`}
      aria-label="Community Stories Carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="spotlight-header">
        <h2>Real Connections. Real Stories.</h2>
        <p>See how people are forming genuine relationships through YouAndINotAI.</p>
      </div>

      <div className="spotlight-carousel" role="group" aria-roledescription="carousel">
        {stories.map((story, index) => (
          <StoryItem
            key={story.id}
            story={story}
            isActive={index === currentIndex}
            isVisible={Math.abs(index - currentIndex) <= 1}
            variant={variant}
          />
        ))}
      </div>

      <Controls
        showDots={showDots}
        showArrows={showArrows}
        currentIndex={currentIndex}
        totalStories={stories.length}
        onPrev={goToPrev}
        onNext={goToNext}
        onDotClick={goToIndex}
      />
    </section>
  );
};
```

### CSS Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(var(--spacing-2));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.story-item {
  animation: fadeIn var(--transition-duration-normal) var(--transition-easing);
}

@media (prefers-reduced-motion: reduce) {
  .story-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Performance Considerations

```jsx
// Memoized story item component
const StoryItem = memo(({ story, isActive, isVisible, variant }) => {
  // Only render full content when visible
  if (!isVisible) {
    return <div className="story-placeholder" />;
  }

  return (
    <div className={`story-item ${isActive ? 'active' : ''} variant-${variant}`} aria-hidden={!isActive}>
      {/* Story content */}
    </div>
  );
});

// Virtualized list for many stories
const StoryCarousel = ({ stories }) => {
  const visibleRange = 3; // Render 3 stories at a time
  const startIndex = Math.max(0, currentIndex - 1);
  const endIndex = Math.min(stories.length, currentIndex + visibleRange);

  return <div className="carousel-wrapper">{stories.slice(startIndex, endIndex).map(/* render items */)}</div>;
};
```

## Dependencies

- React 19 (front-end framework)
- Design system tokens (CSS variables)
- CSS animations and transitions
- Intersection Observer API (optional enhancement)
- Swipe detection library for touch gestures

## Testing Requirements

1. Unit tests for navigation logic
2. Accessibility audit with screen readers
3. Cross-browser compatibility verification
4. Mobile responsiveness testing
5. Performance testing with large story collections
6. Keyboard navigation testing
7. Focus management validation

## Integration Requirements

### For CTO (b02a21c7)

1. API endpoint for fetching community stories
2. Media optimization pipeline for story images/videos
3. Content moderation system for user-generated stories
4. Analytics tracking for engagement metrics
5. CDN configuration for media delivery

### For CMO (2c40ae74)

1. Copy approval for story presentation format
2. Guidelines for story selection criteria
3. Legal compliance verification for user testimonials
4. Brand voice alignment for community messaging
5. Translation requirements for international markets

## Success Metrics Framework

### Engagement Metrics

- Story view duration average
- Manual navigation frequency
- Social sharing of stories
- Click-through to related features

### Impact Indicators

- Increase in meetup/event participation
- Rise in volunteer opportunity signups
- Growth in friend connection requests
- Positive sentiment in user feedback

### Performance Benchmarks

- Initial render time < 1.5 seconds
- Story transition smoothness > 60fps
- Memory consumption < 50MB during active use
- Accessibility audit score > 95%

---

_Component specification aligns with YouAndINotAI's mobile-first, accessibility-first approach while showcasing genuine community connections that reflect the platform's core values._
