# Safety Components

This directory contains enhanced safety components for the YouAndiNotAi platform.

## Components

### SafetyDrawer

Enhanced safety drawer with additional actions:

- Mute User (temporarily hide messages)
- Restrict Visibility (limit profile access)
- Freeze Conversation (pause messaging)

### ReportForm

Enhanced reporting form with:

- Date picker for when incident occurred
- Evidence attachment option
- Urgency level selector
- Additional context checkboxes

### BlockConfirmationDialog

Clear confirmation dialog for blocking actions with consequences explanation.

### SafetyTipBanner

Proactive safety suggestions banner for preventive measures.

## Usage

```jsx
import { SafetyDrawer, ReportForm, BlockConfirmationDialog, SafetyTipBanner } from './components';

// SafetyDrawer usage
<SafetyDrawer
  open={isSafetyDrawerOpen}
  targetUserId="user-123"
  targetName="John Doe"
  source="profile"
  onClose={() => setIsSafetyDrawerOpen(false)}
  onBlocked={() => console.log('User blocked')}
  onActionComplete={(action) => console.log('Action completed:', action)}
/>

// ReportForm usage
<ReportForm
  onSubmit={(data) => console.log('Report submitted:', data)}
  onCancel={() => console.log('Report cancelled')}
  isLoading={false}
/>

// BlockConfirmationDialog usage
<BlockConfirmationDialog
  targetName="John Doe"
  onConfirm={() => console.log('User blocked')}
  onCancel={() => console.log('Block cancelled')}
  isLoading={false}
/>

// SafetyTipBanner usage
<SafetyTipBanner
  tip={{
    id: 'tip-1',
    title: 'Protect Your Privacy',
    description: 'Always meet in public places for first encounters.',
    action: 'Learn More',
    variant: 'preventive'
  }}
  onDismiss={(id) => console.log('Tip dismissed:', id)}
  onAction={(tip) => console.log('Tip action:', tip)}
/>
```

## Mobile Optimization

All components are designed with mobile-first approach:

- Thumb-friendly touch targets
- Landscape-optimized layouts
- Accessible focus states
- Screen reader compatibility
