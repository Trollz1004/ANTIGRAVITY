# YouAndINotAI Component Library

## Overview

This document defines the reusable UI components for the YouAndINotAI platform. All components are designed with mobile-first principles, accessibility compliance, and trust-building in mind.

## Core Components

### Buttons

#### Primary Button

```jsx
<Button variant="primary" size="md" disabled={false} onClick={handleClick}>
  Label
</Button>
```

**Props:**

- `variant`: "primary" | "secondary" | "danger" | "success"
- `size`: "sm" | "md" | "lg"
- `disabled`: Boolean
- `onClick`: Function
- `children`: Node

**Design membership records Used:**

- Background: `--brand-primary` for primary variant
- Text: `--text-inverse`
- Padding: `--spacing-button-padding-v` vertical, `--spacing-button-padding-h` horizontal
- Border radius: `--border-radius-md`
- Focus ring: `--focus-ring-color`

#### Secondary Button

```jsx
<Button variant="secondary" size="md" disabled={false} onClick={handleClick}>
  Label
</Button>
```

**Props:** Same as Primary Button

**Design membership records Used:**

- Background: `--bg-secondary`
- Border: `--border-width-thin` solid `--text-secondary`
- Text: `--text-primary`
- Padding: `--spacing-button-padding-v` vertical, `--spacing-button-padding-h` horizontal
- Border radius: `--border-radius-md`

#### Icon Button

```jsx
<IconButton icon="heart" variant="primary" size="md" disabled={false} onClick={handleClick} />
```

**Props:**

- `icon`: String (icon name)
- `variant`: "primary" | "secondary" | "danger" | "success"
- `size`: "sm" | "md" | "lg"
- `disabled`: Boolean
- `onClick`: Function

**Design membership records Used:**

- Size: Square based on `--spacing-8` for md size
- Background: `--brand-primary` for primary variant
- Border radius: `--border-radius-full`

### Inputs

#### Text Input

```jsx
<TextInput label="Label" placeholder="Placeholder" error="" disabled={false} onChange={handleChange} value={value} />
```

**Props:**

- `label`: String
- `placeholder`: String
- `error`: String (error message)
- `disabled`: Boolean
- `onChange`: Function
- `value`: String

**Design membership records Used:**

- Border: `--border-width-thin` solid `--text-secondary`
- Border radius: `--border-radius-md`
- Padding: `--spacing-input-padding`
- Error border: `--color-error`

#### Textarea

```jsx
<Textarea
  label="Label"
  placeholder="Placeholder"
  error=""
  disabled={false}
  onChange={handleChange}
  value={value}
  rows={4}
/>
```

**Props:**

- `label`: String
- `placeholder`: String
- `error`: String (error message)
- `disabled`: Boolean
- `onChange`: Function
- `value`: String
- `rows`: Number

**Design membership records Used:**

- Border: `--border-width-thin` solid `--text-secondary`
- Border radius: `--border-radius-md`
- Padding: `--spacing-input-padding`

#### Select

```jsx
<Select
  label="Label"
  options={[{ value: '1', label: 'Option 1' }]}
  error=""
  disabled={false}
  onChange={handleChange}
  value={value}
/>
```

**Props:**

- `label`: String
- `options`: Array<{value: String, label: String}>
- `error`: String (error message)
- `disabled`: Boolean
- `onChange`: Function
- `value`: String

**Design membership records Used:**

- Border: `--border-width-thin` solid `--text-secondary`
- Border radius: `--border-radius-md`
- Padding: `--spacing-input-padding`

### Cards

#### Base Card

```jsx
<Card padding="md" elevated={true}>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

**Props:**

- `padding`: "none" | "sm" | "md" | "lg"
- `elevated`: Boolean
- `children`: Node

**Subcomponents:**

- `Card.Header`: Header section
- `Card.Body`: Main content section
- `Card.Footer`: Footer section

**Design membership records Used:**

- Background: `--bg-primary`
- Border radius: `--border-radius-lg`
- Padding: Based on size prop (`--spacing-4` for md)
- Shadow: `--shadow-md` when elevated

### Navigation

#### Tab Bar

```jsx
<TabBar>
  <TabItem active={true} onClick={handleClick}>
    Tab 1
  </TabItem>
  <TabItem active={false} onClick={handleClick}>
    Tab 2
  </TabItem>
</TabBar>
```

**Props:**

- `children`: Node

**Subcomponents:**

- `TabItem`: Individual tab item
  - Props: `active`: Boolean, `onClick`: Function, `children`: Node

**Design membership records Used:**

- Border: `--border-width-thin` solid `--text-secondary`
- Active indicator: `--brand-primary` with height `--border-width-thick`

#### Bottom Navigation

```jsx
<BottomNavigation>
  <NavItem icon="home" active={true} onClick={handleClick}>
    Home
  </NavItem>
  <NavItem icon="events" active={false} onClick={handleClick}>
    Events
  </NavItem>
</BottomNavigation>
```

**Props:**

- `children`: Node

**Subcomponents:**

- `NavItem`: Individual navigation item
  - Props: `icon`: String, `active`: Boolean, `onClick`: Function, `children`: Node

**Design membership records Used:**

- Background: `--bg-primary`
- Height: 56px minimum
- Icon size: `--spacing-6`
- Text size: `--font-size-xs`

## Feature-Specific Components

### Safety Components

#### Safety Drawer

```jsx
<SafetyDrawer open={true} targetUserId="123" targetName="User" onClose={handleClose}>
  <SafetyDrawer.ReportSection />
  <SafetyDrawer.ImmediateActions />
  <SafetyDrawer.PreventionTools />
</SafetyDrawer>
```

**Props:**

- `open`: Boolean
- `targetUserId`: String
- `targetName`: String
- `source`: String
- `onClose`: Function
- `onActionComplete`: Function
- `children`: Node

**Subcomponents:**

- `SafetyDrawer.ReportSection`: Report concern section
- `SafetyDrawer.ImmediateActions`: Immediate action buttons
- `SafetyDrawer.PreventionTools`: Prevention tools section

#### Report Form

```jsx
<ReportForm
  reason=""
  details=""
  evidence={[]}
  urgency="not_urgent"
  context={{}}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Props:**

- `reason`: String
- `details`: String
- `evidence`: Array
- `urgency`: "not_urgent" | "serious" | "critical"
- `context`: Object
- `onSubmit`: Function
- `onCancel`: Function

#### Block Confirmation Dialog

```jsx
<BlockConfirmationDialog targetName="User" onConfirm={handleConfirm} onCancel={handleCancel} isLoading={false} />
```

**Props:**

- `targetName`: String
- `onConfirm`: Function
- `onCancel`: Function
- `isLoading`: Boolean

#### Safety Tip Banner

```jsx
<SafetyTipBanner tip={tipObject} variant="preventive" onDismiss={handleDismiss} onAction={handleAction} />
```

**Props:**

- `tip`: SafetyTip object
- `variant`: "preventive" | "warning" | "alert" | "educational"
- `onDismiss`: Function
- `onAction`: Function

### Volunteer Components

#### Volunteer Opportunity Card

```jsx
<VolunteerOpportunityCard
  opportunity={opportunityData}
  onSignup={handleSignup}
  onDetail={handleDetail}
  friendsAttending={[]}
/>
```

**Props:**

- `opportunity`: VolunteerData object
- `onSignup`: Function
- `onDetail`: Function
- `friendsAttending`: Array<User>

#### Volunteer Filter Panel

```jsx
<VolunteerFilterPanel
  categories={[]}
  selectedCategory=""
  timeAvailability={[]}
  onCategoryChange={handleChange}
  onTimeChange={handleChange}
  onApplyFilters={handleApply}
/>
```

**Props:**

- `categories`: Array<Category>
- `selectedCategory`: String
- `timeAvailability`: Array<String>
- `onCategoryChange`: Function
- `onTimeChange`: Function
- `onApplyFilters`: Function

#### Impact Dashboard

```jsx
<ImpactDashboard stats={statsObject} milestones={[]} onShare={handleShare} />
```

**Props:**

- `stats`: ImpactStats object
- `milestones`: Array<Milestone>
- `onShare`: Function

### Event Components

#### Event Discovery Card

```jsx
<EventDiscoveryCard event={eventData} onRSVP={handleRSVP} onDetail={handleDetail} isNearby={false} />
```

**Props:**

- `event`: EventData object
- `onRSVP`: Function
- `onDetail`: Function
- `isNearby`: Boolean

#### Location Filter Panel

```jsx
<LocationFilterPanel
  currentLocation={{ lat: 0, lng: 0 }}
  radius={10}
  onRadiusChange={handleChange}
  onApplyFilters={handleApply}
/>
```

**Props:**

- `currentLocation`: Coords
- `radius`: Number
- `onRadiusChange`: Function
- `onApplyFilters`: Function

## Mobile-Specific Guidelines

### Touch Targets

- All interactive elements must be at least 48px in their smallest dimension
- Use adequate spacing between touch targets (`--spacing-2` minimum)
- Consider thumb-friendly placement for primary actions

### Gestures

- Swipe gestures should have clear visual affordances
- Long press actions should have haptic feedback where supported
- Shake gestures should be used sparingly and with clear purpose

### Orientation

- All components should adapt to both portrait and landscape orientations
- Primary actions should be reachable in both orientations
- Content should reflow gracefully when orientation changes

## Accessibility Guidelines

### Semantic HTML

- Use appropriate HTML elements for their purpose
- Maintain proper heading hierarchy (h1-h6)
- Use ARIA attributes where native semantics are insufficient

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators required for all interactive elements
- Logical tab order should match visual layout

### Screen Reader Support

- All images must have alt text or role="presentation"
- Form elements must have associated labels
- Dynamic content changes should be announced

### Contrast Requirements

- Text must have minimum 4.5:1 contrast ratio against background
- UI controls must meet 3:1 contrast ratio
- Use `--text-primary` and `--bg-primary` for body text as default

## Trust-Building Patterns

### Transparency

- Clearly indicate when actions are irreversible
- Explain consequences before user commits to actions
- Show progress indicators for asynchronous operations

### Consistency

- Maintain consistent visual language across components
- Use standardized interaction patterns
- Preserve user expectations through familiar behaviors

### Control

- Provide clear exit points from all flows
- Allow undo for destructive actions where possible
- Respect user privacy and data control preferences

These components and guidelines ensure a consistent, accessible, and trustworthy experience across the YouAndINotAI platform.
