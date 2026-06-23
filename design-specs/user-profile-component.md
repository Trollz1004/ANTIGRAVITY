# UserProfile Component Specification

## Component Name

UserProfile

## Overview

A comprehensive user profile component that showcases authentic community members while prioritizing privacy, safety, and genuine connection. Designed for YouAndINotAI's mission of fostering real-world community connections rather than romantic relationships.

## Props/State

### Props

| Prop          | Type                             | Required | Description                                                 |
| ------------- | -------------------------------- | -------- | ----------------------------------------------------------- |
| user          | UserProfileData                  | Yes      | User profile data object                                    |
| currentUser   | boolean                          | No       | Whether this is the current user's profile (default: false) |
| onEdit        | function                         | No       | Callback when user initiates edit mode                      |
| onViewEvents  | function                         | No       | Callback to view user's upcoming events                     |
| onSendMessage | function                         | No       | Callback to initiate messaging (for connections only)       |
| onReportUser  | function                         | No       | Callback to report user                                     |
| onBlockUser   | function                         | No       | Callback to block user                                      |
| variant       | 'full' \| 'compact' \| 'preview' | No       | Display variant (default: 'full')                           |

### UserProfileData Interface

```typescript
interface UserProfileData {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  joinDate: Date;
  location?: {
    city: string;
    state: string;
  };
  bio?: string;
  interests: Array<{
    id: string;
    name: string;
    category: 'hobby' | 'cause' | 'skill' | 'topic';
  }>;
  communityRoles: Array<{
    id: string;
    title: string;
    organization?: string;
    startDate?: Date;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: Date;
    location: string;
    type: 'meetup' | 'volunteer' | 'workshop' | 'social';
  }>;
  impactStats: {
    eventsAttended: number;
    volunteerHours: number;
    connectionsMade: number;
    communityGroups: number;
  };
  privacySettings: {
    showFullName: boolean;
    showLocation: 'public' | 'connections' | 'private';
    showBio: 'public' | 'connections' | 'private';
    showEvents: 'public' | 'connections' | 'private';
    showImpact: 'public' | 'connections' | 'private';
  };
  accountStatus: 'verified' | 'pending_verification' | 'reported' | 'banned';
  trustBadges: Array<{
    type: 'community_contributor' | 'event_organizer' | 'volunteer_leader' | 'helpful_member';
    awardedDate: Date;
  }>;
  socialLinks?: Array<{
    platform: 'twitter' | 'linkedin' | 'website';
    url: string;
  }>;
}
```

### State

| State             | Type    | Description                                          |
| ----------------- | ------- | ---------------------------------------------------- |
| isEditing         | boolean | Whether profile is in edit mode                      |
| activeTab         | string  | Currently selected tab ('about', 'events', 'impact') |
| showSafetyOptions | boolean | Whether safety options are visible                   |
| imageLoaded       | boolean | Whether avatar image has loaded                      |

## Behavior Description

### Initial Load

1. Display user's profile information based on privacy settings
2. Show appropriate loading states for images
3. Determine editing permissions based on currentUser prop
4. Apply appropriate styling based on variant

### Interaction Behavior

1. **Tab Navigation**: Switch between About, Events, and Impact tabs
2. **Edit Mode**: Allow current user to modify profile information
3. **Safety Actions**: Report or block user through safety drawer
4. **Connection Actions**: Send message to connected users only
5. **Privacy Controls**: Granular control over information visibility

### Responsive Adaptation

1. **Mobile (<768px)**: Single column layout, tabs as horizontal scroll
2. **Tablet (768px-1024px)**: Two column layout with sidebar actions
3. **Desktop (>1024px)**: Full feature layout with additional statistics

### Performance Optimization

1. Lazy load images with placeholders
2. Virtualize long lists of events and interests
3. Cache profile data with expiration
4. Implement skeleton loading for initial render

## Copy Stubs

### Profile Labels

| Element            | Text                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Member since       | "Member since {date}"                                                                                                  |
| Location           | "{city}, {state}" or "Location private"                                                                                |
| Impact Stats       | "{events} events attended", "{hours} hours volunteered", "{connections} connections made", "{groups} community groups" |
| Account Status     | "Verified member", "Pending verification"                                                                              |
| Trust Badges       | "Community Contributor", "Event Organizer", "Volunteer Leader", "Helpful Member"                                       |
| Privacy Indicators | "Private", "Connections only", "Public"                                                                                |

### Action Button Text

| Action       | Text                     |
| ------------ | ------------------------ |
| Edit Profile | "Edit Profile"           |
| Message      | "Send Message"           |
| Connect      | "Add Connection"         |
| Report       | "Report Concern"         |
| Block        | "Block User"             |
| View Events  | "View All Events"        |
| View Impact  | "See Full Impact Report" |

### Empty States

| State        | Message                                   |
| ------------ | ----------------------------------------- |
| No Bio       | "This user hasn't added a bio yet"        |
| No Events    | "No upcoming events"                      |
| No Impact    | "Impact information is private"           |
| Private Info | "This information is not shared publicly" |

## Accessibility Notes

### Semantic HTML Structure

```jsx
<section className="user-profile" aria-labelledby={`profile-name-${userId}`} role="region" tabIndex="0">
  <header className="profile-header">
    <div className="profile-avatar-container">
      <img
        src={user.avatarUrl}
        alt={`${user.name}'s profile picture`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="profile-avatar"
      />
      {user.accountStatus === 'verified' && (
        <span className="verification-badge" aria-label="Verified member" role="img" aria-hidden="false">
          ✓
        </span>
      )}
    </div>

    <div className="profile-basic-info">
      <h1 id={`profile-name-${userId}`}>{user.privacySettings.showFullName ? user.name : user.username}</h1>
      <p className="profile-username">@{user.username}</p>

      {user.location && user.privacySettings.showLocation !== 'private' && (
        <p className="profile-location">
          {user.privacySettings.showLocation === 'public'
            ? `${user.location.city}, ${user.location.state}`
            : 'Location shared with connections only'}
        </p>
      )}

      <time className="profile-join-date" dateTime={user.joinDate.toISOString()}>
        Member since {formatDate(user.joinDate)}
      </time>
    </div>

    <div className="profile-actions">
      {currentUser ? (
        <Button variant="primary" onClick={onEdit} aria-label="Edit profile">
          Edit Profile
        </Button>
      ) : (
        <ConnectionActions
          userId={user.id}
          isConnected={isConnected}
          onSendMessage={onSendMessage}
          onConnect={onConnect}
        />
      )}

      {!currentUser && <SafetyMenu onReport={onReportUser} onBlock={onBlockUser} aria-label="Safety options" />}
    </div>
  </header>

  <nav className="profile-tabs" role="tablist">
    <TabButton
      active={activeTab === 'about'}
      onClick={() => setActiveTab('about')}
      role="tab"
      aria-selected={activeTab === 'about'}
    >
      About
    </TabButton>

    <TabButton
      active={activeTab === 'events'}
      onClick={() => setActiveTab('events')}
      role="tab"
      aria-selected={activeTab === 'events'}
    >
      Events
    </TabButton>

    <TabButton
      active={activeTab === 'impact'}
      onClick={() => setActiveTab('impact')}
      role="tab"
      aria-selected={activeTab === 'impact'}
    >
      Impact
    </TabButton>
  </nav>

  <div className="profile-content" role="tabpanel">
    {activeTab === 'about' && <AboutTab user={user} currentUser={currentUser} onEdit={onEdit} />}

    {activeTab === 'events' && (
      <EventsTab events={user.upcomingEvents} privacyLevel={user.privacySettings.showEvents} onViewAll={onViewEvents} />
    )}

    {activeTab === 'impact' && (
      <ImpactTab stats={user.impactStats} badges={user.trustBadges} privacyLevel={user.privacySettings.showImpact} />
    )}
  </div>
</section>
```

### Keyboard Navigation

- Tab to navigate through interactive elements
- Arrow keys to navigate between tabs
- Enter/Space to activate buttons and links
- Escape to close safety menu
- Focus trap within safety menu when open

### Screen Reader Support

- Semantic heading structure (h1 for name)
- ARIA live regions for dynamic content updates
- Descriptive labels for all interactive controls
- Proper tab panel implementation
- Landmark roles for major sections

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus preserved during tab switching
- Return focus after closing dialogs
- Skip links for keyboard users

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .profile-animation {
    transition: none;
    animation: none;
  }
}
```

## Visual Design Implementation

### Full Variant (Detailed Profile)

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                         Edit Profile    ⋮      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 Jane Smith           @janesmith                      │
│  Jacksonville, FL        Member since Jan 2026          │
│                                                         │
│  Passionate about community gardening and sustainable   │
│  living. Volunteer coordinator for local environmental  │
│  group. Love hiking and coffee.                         │
│                                                         │
│  Community Coordinator at Green Earth Initiative        │
│                                                         │
│  [Hiking] [Gardening] [Environment] [Coffee]            │
│                                                         │
│  ┌─────┬─────┬─────┬─────┐                              │
│  │About│Events│Impact│Settings│                          │
│  └─────┴─────┴─────┴─────┘                              │
│                                                         │
│  ABOUT TAB SELECTED                                     │
│                                                         │
│  Upcoming Events                                        │
│  🗓️ Community Garden Workday                           │
│    Sat, Apr 22 • 9:00 AM • Riverside Park               │
│  🗓️ Coffee & Conversation Circle                       │
│    Sun, Apr 23 • 10:00 AM • Downtown Café               │
│                                                         │
│  [View All Events]                                      │
│                                                         │
│  Verified Member ✓        Community Contributor Badge   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Compact Variant (Preview)

```
┌─────────────────────────────────────────────────┐
│  👤 Jane Smith           @janesmith            │
│  Jacksonville, FL        Member since Jan 2026 │
│                                                 │
│  Passionate about community gardening [...]    │
│                                                 │
│  [Hiking] [Gardening] [Environment]             │
│                                                 │
│  [Message] [⋮ Safety]                           │
└─────────────────────────────────────────────────┘
```

### Preview Variant (List Item)

```
┌─────────────────────────────────────────────┐
│ 👤 Jane Smith      @janesmith              │
│ Jacksonville, FL    12 events attended     │
│ Community Gardener • Environmental Activist │
└─────────────────────────────────────────────┘
```

### Design membership records Usage

```css
.user-profile {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.profile-header {
  background-color: var(--bg-secondary);
  padding: var(--spacing-6);
  border-bottom: var(--border-width-thin) solid var(--text-tertiary);
}

.profile-name {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-1);
}

.profile-username {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  margin: 0 0 var(--spacing-3);
}

.profile-bio {
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-4);
}

.profile-tabs {
  display: flex;
  border-bottom: var(--border-width-thin) solid var(--text-tertiary);
  background-color: var(--bg-primary);
}

.profile-tab-button {
  background: none;
  border: none;
  border-bottom: var(--border-width-thick) solid transparent;
  color: var(--text-secondary);
  padding: var(--spacing-4) var(--spacing-6);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-easing);
}

.profile-tab-button.active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.profile-tab-button:hover:not(:disabled) {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

.profile-tab-panel {
  padding: var(--spacing-6);
}

.verification-badge {
  color: var(--color-success);
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--color-success);
  border-radius: var(--border-radius-full);
  width: var(--spacing-6);
  height: var(--spacing-6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  margin-left: var(--spacing-2);
}

.trust-badge {
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

.interest-tag {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--border-radius-full);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  display: inline-block;
  margin-right: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.privacy-indicator {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-style: italic;
  margin-left: var(--spacing-2);
}
```

## Technical Implementation

### React Component Structure

```jsx
const UserProfile = ({
  user,
  currentUser = false,
  onEdit,
  onViewEvents,
  onSendMessage,
  onReportUser,
  onBlockUser,
  variant = 'full',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showSafetyOptions, setShowSafetyOptions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle tab selection with keyboard
  const handleTabKeyDown = (e, tab) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tab);
    }
  };

  // Handle safety menu toggle
  const toggleSafetyMenu = () => {
    setShowSafetyOptions(!showSafetyOptions);
  };

  // Close safety menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSafetyOptions && !e.target.closest('.safety-menu')) {
        setShowSafetyOptions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSafetyOptions]);

  return (
    <section className={`user-profile variant-${variant}`} aria-labelledby={`profile-name-${user.id}`} role="region">
      <header className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s profile picture`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              setImageLoaded(false);
            }}
            className="profile-avatar"
          />
          {user.accountStatus === 'verified' && (
            <span className="verification-badge" aria-label="Verified member" role="img">
              ✓
            </span>
          )}
        </div>

        <div className="profile-basic-info">
          <h1 id={`profile-name-${user.id}`}>
            {user.privacySettings.showFullName || currentUser ? user.name : user.username}
          </h1>
          <p className="profile-username">@{user.username}</p>

          {user.location && user.privacySettings.showLocation !== 'private' && (
            <p className="profile-location">
              {user.privacySettings.showLocation === 'public'
                ? `${user.location.city}, ${user.location.state}`
                : 'Location shared with connections only'}
            </p>
          )}

          <time className="profile-join-date" dateTime={user.joinDate.toISOString()}>
            Member since {formatDate(user.joinDate)}
          </time>
        </div>

        <div className="profile-actions">
          {currentUser ? (
            <Button variant="primary" onClick={onEdit} aria-label="Edit profile">
              Edit Profile
            </Button>
          ) : (
            <ConnectionActions
              userId={user.id}
              isConnected={isConnected}
              onSendMessage={onSendMessage}
              onConnect={onConnect}
            />
          )}

          {!currentUser && (
            <SafetyMenu
              isOpen={showSafetyOptions}
              onToggle={toggleSafetyMenu}
              onReport={onReportUser}
              onBlock={onBlockUser}
              aria-label="Safety options"
            />
          )}
        </div>
      </header>

      <nav className="profile-tabs" role="tablist">
        <TabButton
          active={activeTab === 'about'}
          onClick={() => setActiveTab('about')}
          onKeyDown={(e) => handleTabKeyDown(e, 'about')}
          role="tab"
          aria-selected={activeTab === 'about'}
        >
          About
        </TabButton>

        <TabButton
          active={activeTab === 'events'}
          onClick={() => setActiveTab('events')}
          onKeyDown={(e) => handleTabKeyDown(e, 'events')}
          role="tab"
          aria-selected={activeTab === 'events'}
        >
          Events
        </TabButton>

        <TabButton
          active={activeTab === 'impact'}
          onClick={() => setActiveTab('impact')}
          onKeyDown={(e) => handleTabKeyDown(e, 'impact')}
          role="tab"
          aria-selected={activeTab === 'impact'}
        >
          Impact
        </TabButton>
      </nav>

      <div className="profile-content" role="tabpanel">
        {activeTab === 'about' && (
          <AboutTab
            user={user}
            currentUser={currentUser}
            onEdit={onEdit}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            events={user.upcomingEvents}
            privacyLevel={user.privacySettings.showEvents}
            onViewAll={onViewEvents}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactTab
            stats={user.impactStats}
            badges={user.trustBadges}
            privacyLevel={user.privacySettings.showImpact}
          />
        )}
      </div>
    </section>
  );
};
```

### CSS Animations

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

.profile-content {
  animation: fadeIn var(--transition-duration-normal) var(--transition-easing);
}

.tab-enter {
  opacity: 0;
  transform: translateX(100%);
}

.tab-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity var(--transition-duration-fast),
    transform var(--transition-duration-fast);
}

.tab-exit {
  opacity: 1;
  transform: translateX(0);
}

.tab-exit-active {
  opacity: 0;
  transform: translateX(-100%);
  transition:
    opacity var(--transition-duration-fast),
    transform var(--transition-duration-fast);
}

@media (prefers-reduced-motion: reduce) {
  .profile-content,
  .tab-enter-active,
  .tab-exit-active {
    transition: none;
    animation: none;
  }
}
```

## Dependencies

- React 19 (front-end framework)
- Design system membership records (CSS variables)
- Icons from design system
- CSS animations and transitions
- Date formatting utility
- Accessibility utilities

## Testing Requirements

1. Unit tests for privacy setting enforcement
2. Accessibility audit with screen readers
3. Cross-browser compatibility verification
4. Mobile responsiveness testing
5. Performance testing with large profile data sets
6. Keyboard navigation testing
7. Focus management validation
8. Image loading and error handling tests

## Integration Requirements

### For CTO (b02a21c7)

1. API endpoints for profile retrieval and update
2. Image upload and optimization service
3. Privacy setting enforcement at API level
4. Verification status management
5. Trust badge awarding system
6. Connection relationship database

### For CMO (2c40ae74)

1. Copy approval for all profile-related text
2. Brand voice alignment for user bios
3. Legal compliance verification for trust badges
4. Translation requirements for international profiles
5. Community storytelling framework integration

## Success Metrics Framework

### Engagement Metrics

- Profile view rate among connections
- Time spent viewing profiles
- Profile completion rate
- Bio engagement (reads/shares)
- Interest tagging adoption

### Trust Indicators

- Verification completion rate
- Trust badge earning rate
- Safety feature usage (report/block)
- Privacy setting adjustments
- Connection initiation from profiles

### Community Building

- Cross-profile connection rate
- Event discovery through profiles
- Message initiation from profiles
- Community role sharing frequency
- Impact stat sharing preferences

### Performance Benchmarks

- Profile load time < 1.5 seconds
- Image optimization completion < 2 seconds
- Accessibility audit score > 95%
- Mobile Lighthouse performance > 85
- Tab switching response < 200ms

---

_Component specification supports YouAndINotAI's mission of genuine community connection while maintaining user safety, privacy, and accessibility as core values._
