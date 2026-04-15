# Safety Features Implementation Handoff

## Overview

This document provides detailed implementation guidance for the safety features designed for YouAndINotAI. It includes component specifications, interaction patterns, and technical considerations necessary for accurate implementation.

## SafetyDrawer Component

### Component Structure

```jsx
<SafetyDrawer
  open={boolean}
  targetUserId={string}
  targetName={string}
  source={string}
  onClose={function}
  onActionComplete={function}
/>
```

### Props Details

- `open`: Controls visibility of the drawer (Boolean)
- `targetUserId`: ID of user being reported/restricted (String)
- `targetName`: Display name of target user (String)
- `source`: Context where drawer was opened (String)
- `onClose`: Callback when drawer closes (Function)
- `onActionComplete`: Callback when safety action completes (Function)

### Visual Implementation

1. **Drawer Header**
   - Title: "Safety Tools"
   - Close button position: Top right corner
   - Background: `--bg-primary`
   - Text color: `--text-primary`
   - Border bottom: `--border-width-thin` solid `--text-secondary`

2. **Report Concern Section**
   - Section heading: "Report Concern"
   - Report option with icon: "⚠️ Harrassment or Threats"
   - Subtext: "High priority review"
   - Text area placeholder: "Describe what happened"
   - Submit button: "Submit Report"

3. **Immediate Actions Section**
   - Section heading: "Immediate Actions"
   - Block User card with:
     - Icon: "🛡️ Block User"
     - Description: "Stops all contact"
     - Button: "Block Immediately"
   - Mute User card with:
     - Icon: "🔕 Mute User"
     - Description: "Hide messages temporarily"
     - Button: "Mute for 24 Hours"
   - Restrict Visibility card with:
     - Icon: "👁️ Restrict Visibility"
     - Description: "Limit profile access"
     - Button: "Restrict Now"
   - Freeze Conversation card with:
     - Icon: "💬 Freeze Conversation"
     - Description: "Pause messaging"
     - Button: "Freeze Chat"

### Interaction Requirements

- **Mobile Optimization**:
  - Touch targets minimum 48px in smallest dimension
  - Thumb-friendly positioning for primary actions
  - Gestural dismiss (swipe down to close)
  - Auto-focus on first actionable element when opening

- **Accessibility**:
  - All actions include screen reader labels
  - Keyboard navigation through arrow keys, Enter, Escape
  - Focus trap within drawer when open
  - ARIA live regions for action confirmations

- **State Management**:
  - Loading states for async actions with spinner indicators
  - Error handling with user-friendly messages
  - Success confirmations with undo options where applicable
  - Local state persistence during form completion

## ReportForm Component

### Component Structure

```jsx
<ReportForm
  reason={string}
  details={string}
  evidence={array}
  urgency={string}
  context={object}
  onReasonChange={function}
  onDetailsChange={function}
  onEvidenceChange={function}
  onUrgencyChange={function}
  onContextChange={function}
  onSubmit={function}
  onCancel={function}
  isLoading={boolean}
/>
```

### Props Details

- `reason`: Selected reason for report (String)
- `details`: Detailed description of incident (String)
- `evidence`: Attached evidence files (Array)
- `urgency`: Reported urgency level (String)
- `context`: Additional context checkboxes (Object)
- `onReasonChange`: Callback when reason changes (Function)
- `onDetailsChange`: Callback when details change (Function)
- `onEvidenceChange`: Callback when evidence changes (Function)
- `onUrgencyChange`: Callback when urgency changes (Function)
- `onContextChange`: Callback when context changes (Function)
- `onSubmit`: Callback when form submits (Function)
- `onCancel`: Callback when form cancels (Function)
- `isLoading`: Loading state during submission (Boolean)

### Visual Implementation

1. **Reason Selection**
   - Default selection: "Harrassment or Threats"
   - Dropdown with descriptions for each option
   - Additional reasons in expandable section

2. **Incident Details**
   - Date picker labeled "When did this happen?"
   - Text area labeled "Describe what happened"
   - Placeholder text: "I noticed..."

3. **Evidence Attachment**
   - Section header: "Add evidence (optional)"
   - Button: "+ Add Photos/Videos"
   - Thumbnail previews for attached files

4. **Urgency Selection**
   - Section header: "Is this urgent?"
   - Radio buttons: "Not Urgent", "Serious", "Critical"

5. **Context Checkboxes**
   - Section header: "Additional context"
   - Options:
     - "This affected others"
     - "I've messaged a friend about this"
     - "I feel uncomfortable meeting IRL"
     - "I've contacted authorities"

### Interaction Requirements

- **Form Validation**:
  - Real-time validation as users type
  - Clear error messages with corrective suggestions
  - Visual indicators for required fields

- **Mobile Optimization**:
  - Full-width touch targets for form controls
  - Vertical layout optimized for portrait viewing
  - Auto-zoom prevention on form fields
  - Smart keyboard types for different inputs

- **Accessibility**:
  - Proper labeling for all form fields
  - Keyboard navigation for dropdown menus
  - Alt text for attached evidence thumbnails
  - Reduced motion option for animations

## BlockConfirmationDialog Component

### Component Structure

```jsx
<BlockConfirmationDialog
  targetName={string}
  onConfirm={function}
  onCancel={function}
  isLoading={boolean}
  onMuteInstead={function}
  onRestrictInstead={function}
/>
```

### Props Details

- `targetName`: Display name of user to be blocked (String)
- `onConfirm`: Callback when block is confirmed (Function)
- `onCancel`: Callback when dialog is cancelled (Function)
- `isLoading`: Loading state during block processing (Boolean)
- `onMuteInstead`: Callback to switch to muting action (Function)
- `onRestrictInstead`: Callback to switch to restriction action (Function)

### Visual Implementation

1. **Dialog Header**
   - Title: "Block @{targetName}?" (dynamic username)
   - Close button position: Top right corner

2. **Consequences Section**
   - Header: "This prevents:"
   - List items with bullet points:
     - "Direct messages"
     - "Profile viewing"
     - "Tagging in posts"
     - "Adding as a connection"

3. **Notification Policy**
   - Text: "They won't be notified you blocked them, but they may notice some interactions no longer work."

4. **Alternatives Section**
   - Header: "Consider these alternatives first:"
   - Buttons: "🔇 Mute Instead" and "👁️ Restrict"

5. **Confirmation Section**
   - Prompt: "Want to proceed with blocking?"
   - Buttons: "Block Permanently" and "Cancel"
   - Undo option: "Undo within 5 minutes: [Undo]"

### Interaction Requirements

- **Timing Controls**:
  - Initial confirmation dialog appears immediately
  - "Processing..." state after confirmation
  - Success state shown for 5 seconds with undo option
  - Automatic dismissal after 5 seconds if no interaction

- **Accessibility**:
  - Clear heading structure with level 2 heading
  - Proper contrast for all text elements
  - Focus management on primary actions
  - Screen reader announcements for state changes

- **Mobile Optimization**:
  - Full-width buttons for easy tapping
  - Landscape-compatible information layout
  - Scrollable content area for small screens
  - Sticky action buttons at bottom of viewport

## SafetyTipBanner Component

### Component Structure

```jsx
<SafetyTipBanner
  tip={object}
  onDismiss={function}
  variant={string}
  onAction={function}
  autoDismiss={boolean}
  dismissTime={number}
/>
```

### Props Details

- `tip`: SafetyTip object containing content and metadata (Object)
- `onDismiss`: Callback when banner is dismissed (Function)
- `variant`: Visual variant ('preventive', 'warning', 'alert', 'educational') (String)
- `onAction`: Callback for primary action (Function)
- `autoDismiss`: Whether banner dismisses automatically (Boolean)
- `dismissTime`: Time in seconds before auto-dismiss (Number)

### Visual Variants Implementation

1. **Preventive (Blue)**
   - Background: #EFF6FF
   - Border color: #3B82F6
   - Icon: "ℹ️"
   - Header: "💡 Meetup Safety Tip"
   - Message: "Before meeting someone new, share your plans with a trusted contact"
   - Actions: "Learn More" and "Got it"

2. **Warning (Orange)**
   - Background: #FEF3C7
   - Border color: #F59E0B
   - Icon: "⚠️"
   - Header: "⚠️ We Noticed Something"
   - Message: "This message pattern has been reported by other users"
   - Actions: "Show Example" and "Dismiss"

3. **Alert (Red)**
   - Background: #FEE2E2
   - Border color: #EF4444
   - Icon: "🚨"
   - Header: "🚨 Potential Threat Detected"
   - Message: "This account may be impersonating someone else"
   - Actions: "Block Account" and "Report"

4. **Educational (Purple)**
   - Background: #EDE9FE
   - Border color: #8B5CF6
   - Icon: "📚"
   - Header: "📚 Safety Feature Spotlight"
   - Message: "Muting hides messages without notifying the sender"
   - Actions: "Try Muting" and "Settings"

### Interaction Requirements

- **Display Logic**:
  - Default display: 15 seconds (unless dismissed)
  - Auto-dismiss options: 5s, 10s, 15s, 30s
  - Persistence: Can remain until manually dismissed
  - Stacking: Maximum 2 banners visible simultaneously

- **Accessibility**:
  - Proper heading structure (level 3 headings)
  - Sufficient color contrast (WCAG AA minimum)
  - Screen reader friendly icons with aria-labels
  - Keyboard navigable action buttons

- **Mobile Optimization**:
  - Horizontal padding optimized for thumb reach
  - Touch-friendly minimum target sizes (48px)
  - Sticky positioning options for persistent banners
  - Landscape orientation readable widths

## API Integration Requirements

### Safety Actions Endpoints

1. **POST /api/safety/block**
   - Parameters: userId, reason (optional)
   - Returns: success status, undo token
   - Error handling: Conflict if already blocked, unauthorized if not owner

2. **POST /api/safety/mute**
   - Parameters: userId, duration (default 24h)
   - Returns: success status, expiration timestamp
   - Error handling: Validation for duration values

3. **POST /api/safety/restrict**
   - Parameters: userId, restrictions array
   - Returns: success status, active restrictions
   - Error handling: Invalid restriction types

4. **POST /api/safety/freeze**
   - Parameters: userId
   - Returns: success status, conversation frozen state
   - Error handling: Already frozen status

### Report Submission Endpoint

1. **POST /api/report**
   - Parameters:
     - targetUserId
     - reason
     - details
     - date
     - evidence (array of file IDs)
     - urgency
     - context (object)
   - Returns: report ID, expected response timeframe
   - Error handling: Validation errors, submission rate limiting

### Evidence Management Endpoints

1. **POST /api/evidence/upload**
   - Parameters: file, reportId
   - Returns: evidence ID, thumbnail URL
   - Error handling: File type/size validation, storage errors

2. **DELETE /api/evidence/{id}**
   - Parameters: evidenceId
   - Returns: success status
   - Error handling: Not found, unauthorized access

## Error Handling and Edge Cases

### Safety Drawer Edge Cases

1. **Network Failure During Action**
   - Display offline warning
   - Queue action for retry when connectivity restored
   - Provide manual retry option

2. **Invalid Target User**
   - Display user not found error
   - Redirect to safety dashboard
   - Clear action context

3. **Rate Limiting**
   - Display temporary restriction message
   - Show cooldown timer
   - Disable further safety actions temporarily

### Report Form Edge Cases

1. **Large Evidence Files**
   - Show file size warnings before upload
   - Provide compression options
   - Display upload progress indicators

2. **Form Timeout**
   - Auto-save draft functionality
   - Warning before session expiration
   - Restore draft on return

3. **Incomplete Submission**
   - Highlight missing required fields
   - Provide clear error descriptions
   - Maintain form state during correction

### Block Confirmation Edge Cases

1. **Accidental Block**
   - 5-second undo window with clear countdown
   - Confirmation email for permanent blocks
   - Easy reversal through settings page

2. **Already Blocked User**
   - Inform user of existing block state
   - Provide options to modify restrictions
   - Direct to safety settings for management

3. **Blocked by Target User**
   - Explain mutual blocking limitations
   - Suggest reporting option for concerns
   - Provide support contact if needed

## Performance Considerations

### Loading States

1. **Skeleton Screens**
   - Use for initial safety drawer loading
   - Implement for report form while fetching user data
   - Show for banner content loading

2. **Progressive Disclosure**
   - Load safety options incrementally
   - Delay-load evidence thumbnails
   - Pre-fetch commonly accessed safety data

### Caching Strategy

1. **Local Storage**
   - Cache recently used safety settings
   - Store draft report forms
   - Save banner dismissal preferences

2. **Session Management**
   - Maintain safety action context during session
   - Restore partially completed forms
   - Sync safety state across tabs/devices

### Network Optimization

1. **Batch Requests**
   - Combine multiple safety actions when possible
   - Batch evidence uploads for reports
   - Consolidate status updates

2. **Offline Support**
   - Queue safety actions for offline execution
   - Store reports locally until connectivity restored
   - Warn users of pending actions upon reconnection

## Testing Requirements

### Unit Tests

1. **Component Rendering**
   - SafetyDrawer renders with correct props
   - ReportForm displays validation errors appropriately
   - BlockConfirmationDialog shows correct user name
   - SafetyTipBanner applies correct styling per variant

2. **State Management**
   - Loading states display correctly
   - Form validation triggers appropriately
   - Undo functionality works as expected
   - Auto-dismiss timers function properly

### Integration Tests

1. **API Integration**
   - Safety actions call correct endpoints
   - Report submissions include all required data
   - Evidence uploads handle various file types
   - Error responses display user-friendly messages

2. **User Flows**
   - Complete safety action workflow from discovery to completion
   - Report submission from start to confirmation
   - Block/mute/restrict alternative selection flow
   - Banner interaction and dismissal workflows

### Accessibility Tests

1. **Screen Reader Compatibility**
   - All safety actions announced properly
   - Form fields correctly labeled
   - Banner content accessible via screen reader
   - Keyboard navigation through all components

2. **Keyboard Navigation**
   - Tab order follows visual layout
   - All actions accessible via keyboard
   - Focus indicators clearly visible
   - Shortcut keys properly implemented

3. **Visual Accessibility**
   - Color contrast meets WCAG 2.1 AA standards
   - Text scaling supported up to 200%
   - Reduced motion preferences respected
   - High contrast mode compatibility

This implementation handoff provides developers with comprehensive guidance for building the safety features according to design specifications while maintaining accessibility, performance, and user experience standards.
