# Safety Features Implementation Guide

This guide provides instructions for integrating the enhanced safety features into the YouAndINotAI platform.

## Overview

The enhanced safety features include:

1. Improved Safety Drawer with additional options
2. Enhanced Report Form with better context gathering
3. Improved Block Confirmation Dialog with alternatives
4. Safety Tip Banner with multiple visual variants
5. WebSocket connections for real-time notifications
6. Offline support for safety actions
7. Audit logging for all safety-related actions

## Components

### 1. EnhancedSafetyDrawer

Location: `src/app/components/EnhancedSafetyDrawer.tsx`

Key enhancements:

- Added configurable mute duration options (1h, 6h, 12h, 24h, 7d)
- Improved UI with better spacing and visual hierarchy
- Enhanced error handling and success messaging
- Integrated with EnhancedBlockConfirmationDialog

### 2. EnhancedBlockConfirmationDialog

Location: `src/app/components/EnhancedBlockConfirmationDialog.tsx`

Key enhancements:

- Clear list of what blocking prevents
- Alternative action buttons (Mute Instead, Restrict)
- Undo option with 5-minute timer
- Better visual design with improved warnings

### 3. EnhancedReportForm

Location: `src/app/components/EnhancedReportForm.tsx`

Key enhancements:

- Improved reason selection with descriptions
- Better evidence attachment handling
- Enhanced urgency level selection
- Additional context checkboxes

### 4. EnhancedSafetyTipBanner

Location: `src/app/components/EnhancedSafetyTipBanner.tsx`

Key enhancements:

- Auto-dismiss timer display
- Improved visual styling for all variants
- Better spacing and typography

### 5. SafetyService

Location: `src/lib/safetyService.ts`

Key features:

- WebSocket connection management
- Offline action queuing and processing
- Retry mechanism for failed actions
- Audit logging integration
- Event subscription system

## Integration Instructions

### 1. Replace existing components

In your components that currently use safety features, replace imports:

```javascript
// Before
import {
  SafetyDrawer,
  ReportForm,
  BlockConfirmationDialog,
  SafetyTipBanner,
} from './components';

// After
import {
  EnhancedSafetyDrawer as SafetyDrawer,
  EnhancedReportForm as ReportForm,
  EnhancedBlockConfirmationDialog as BlockConfirmationDialog,
  EnhancedSafetyTipBanner as SafetyTipBanner,
} from './components';
```

### 2. Initialize WebSocket connection

In your main application component or authentication handler:

```javascript
import { safetyService } from '../lib/safetyService';

// After successful login
safetyService.initWebSocket(authToken);
safetyService.loadOfflineActions();
```

### 3. Subscribe to safety events

```javascript
import { safetyService } from '../lib/safetyService';

useEffect(() => {
  const unsubscribe = safetyService.subscribe(event => {
    // Handle safety events (notifications, updates, etc.)
    console.log('Safety event:', event);
  });

  return () => unsubscribe();
}, []);
```

### 4. Use safety actions with retry mechanism

When implementing safety actions in your components:

```javascript
import { safetyService } from '../lib/safetyService';

async function handleMute(userId, duration) {
  try {
    await safetyService.executeSafetyAction('mute', userId, { duration });
    // Handle success
  } catch (error) {
    // Handle error
  }
}
```

## API Endpoints

The enhanced safety features expect the following API endpoints:

1. POST `/safety/users/{userId}/mute` - Mute a user
2. POST `/safety/users/{userId}/restrict` - Restrict user visibility
3. POST `/safety/users/{userId}/freeze` - Freeze conversation
4. POST `/safety/users/{userId}/block` - Block a user
5. POST `/safety/users/{userId}/report` - Report a user
6. POST `/safety/audit` - Log safety actions

## Styling

All components use the existing application styling classes:

- `app-button-outline` and `app-button-accent` for buttons
- `app-input` for form inputs
- `glass-strong` and `glass-highlight` for container backgrounds
- Custom color classes for visual variants

## Testing

### Unit Tests

Each component should be tested for:

- Proper rendering with all props
- Event handling (onClick, onChange, etc.)
- Error state display
- Loading state handling
- Accessibility features

### Integration Tests

Integration tests should cover:

- WebSocket connection and event handling
- Offline action queuing and processing
- API error handling and retries
- Audit logging functionality

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Sufficient color contrast
- Semantic HTML structure
- Focus management

## Performance Considerations

- WebSocket connections are managed properly to prevent memory leaks
- Offline actions are persisted to localStorage
- Retry mechanisms have exponential backoff
- Components are optimized for re-rendering

## Security

- All API calls use authenticated requests
- User data is properly sanitized
- Error messages don't expose sensitive information
- WebSocket connections use secure transport
