# Design Specification: Enhanced Safety Features

## Overview

Strengthen the safety and trust infrastructure to create a secure environment while maintaining ease of use and clear communication.

## Current State Analysis

The current SafetyDrawer component provides solid foundational safety tools but could benefit from:

- More intuitive reporting pathways
- Clearer consequences communication
- Enhanced prevention features
- Better incident tracking
- Mobile-optimized interaction flows

## Design Goals

1. **Prevention First** - Help users avoid unsafe situations before they occur
2. **Clear Consequences** - Make reporting and blocking outcomes transparent
3. **Empower Users** - Give people confidence in protective actions
4. **Support Moderation** - Provide moderators with rich context
5. **Mobile Optimization** - Ensure safety features work seamlessly on small screens

## Proposed Enhancements

### 1. Enhanced Safety Drawer Interface

```
┌─────────────────────────────────────┐
│  Safety Tools               [✕]    │
├─────────────────────────────────────┤
│                                     │
│  Report Concern                    │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Harrassment or Threats   │   │
│  │ High priority review        │   │
│  │ ┌─────────────────────────┐ │   │
│  │ │ Describe what happened  │ │   │
│  │ │ [Text Area]             │ │   │
│  │ └─────────────────────────┘ │   │
│  │ [Submit Report]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Immediate Actions                 │
│  ┌─────────────────────────────┐   │
│  │ 🛡️ Block User             │   │
│  │ Stops all contact           │   │
│  │ [Block Immediately]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔕 Mute User               │   │
│  │ Hide messages temporarily   │   │
│  │ [Mute for 24 Hours]         │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 2. Safety Education Integration

- Interactive tutorials for new users
- Contextual tips during onboarding
- Proactive safety suggestions
- Community guideline reinforcement

### 3. Incident Investigation Panel

- Timeline view of interactions
- Evidence collection assistance
- Support resource linking
- Escalation pathway guidance

## Component Specifications

### SafetyDrawer

**Props:**

- open: Boolean
- targetUserId: String
- targetName: String
- source: String
- onClose: Function
- onBlocked: Function

**Sections:**

1. Report for Review
2. Immediate Actions
3. Prevention Tools

**Actions:**

- Submit detailed report
- Block user permanently
- Mute user temporarily
- Restrict profile visibility
- Freeze conversation

### Enhanced SafetyDrawer Component Specification

**Overview:**
The enhanced SafetyDrawer provides users with clear, accessible safety tools optimized for mobile interaction. The component emphasizes prevention, clear consequences, and user empowerment.

**Props:**

- open: Boolean - Controls visibility of the drawer
- targetUserId: String - ID of the user being reported/restricted
- targetName: String - Display name of the target user
- source: String - Context where the drawer was opened
- onClose: Function - Callback when drawer is closed
- onActionComplete: Function - Callback when safety action completes

**Visual Structure:**

```
┌─────────────────────────────────────┐
│  Safety Tools               [✕]    │
├─────────────────────────────────────┤
│                                     │
│  Report Concern                    │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Harrassment or Threats   │   │
│  │ High priority review        │   │
│  │ ┌─────────────────────────┐ │   │
│  │ │ Describe what happened  │ │   │
│  │ │ [Text Area]             │ │   │
│  │ └─────────────────────────┘ │   │
│  │ [Submit Report]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Immediate Actions                 │
│  ┌─────────────────────────────┐   │
│  │ 🛡️ Block User             │   │
│  │ Stops all contact           │   │
│  │ [Block Immediately]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔕 Mute User               │   │
│  │ Hide messages temporarily   │   │
│  │ [Mute for 24 Hours]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👁️ Restrict Visibility    │   │
│  │ Limit profile access        │   │
│  │ [Restrict Now]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 Freeze Conversation     │   │
│  │ Pause messaging             │   │
│  │ [Freeze Chat]               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Accessibility Features:**

- All actions include screen reader labels
- High contrast mode support
- Keyboard navigation (arrow keys, Enter, Escape)
- Focus trap within drawer when open
- ARIA live regions for action confirmations

**Mobile Optimizations:**

- Thumb-friendly touch targets (minimum 48px)
- Landscape-compatible form layouts
- Persistent close button
- Gestural dismiss (swipe down)
- Auto-focus on first actionable element

**Behavior Description:**
When a user opens the SafetyDrawer, they can immediately take protective actions or report concerns. All actions provide clear confirmation and explanation of consequences. Blocking a user is permanent but reversible through settings. Muting lasts 24 hours by default but can be extended. Restricting limits profile visibility without ending communication. Freezing pauses messaging but allows existing conversations to remain visible.

**Copy Stubs:**

- "Safety Tools" - Drawer header
- "Report Concern" - Section heading
- "⚠️ Harassment or Threats" - Report option with high priority indicator
- "High priority review" - Explanation of report severity
- "Describe what happened" - Text area placeholder
- "Submit Report" - Button text
- "🛡️ Block User" - Immediate action with protection icon
- "Stops all contact" - Explanation of blocking
- "Block Immediately" - Blocking button
- "🔕 Mute User" - Immediate action with notification icon
- "Hide messages temporarily" - Explanation of muting
- "Mute for 24 Hours" - Muting button with duration
- "👁️ Restrict Visibility" - Immediate action with visibility icon
- "Limit profile access" - Explanation of restricting
- "Restrict Now" - Restriction button
- "💬 Freeze Conversation" - Immediate action with chat icon
- "Pause messaging" - Explanation of freezing
- "Freeze Chat" - Freezing button

**State Management:**

- Loading states for all async actions
- Error handling with user-friendly messages
- Success confirmations with undo options (where applicable)
- Local state persistence during form completion
- Offline support with queueing

### ReportForm

**Props:**

- reason: String
- details: String
- onReasonChange: Function
- onDetailsChange: Function
- onSubmit: Function
- onCancel: Function

**Fields:**

- Reason dropdown (with descriptions)
- Detailed context textarea
- Evidence attachment option
- Urgency level selector
- Additional context checkboxes

### Enhanced ReportForm Component Specification

**Overview:**
The enhanced ReportForm gathers rich context to help moderators understand and respond to safety concerns effectively. The form balances thoroughness with user empathy, ensuring people feel heard without feeling interrogated.

**Props:**

- reason: String - Selected reason for report
- details: String - Detailed description of incident
- evidence: Array - Attached evidence files
- urgency: String - Reported urgency level
- context: Object - Additional context checkboxes
- onReasonChange: Function - Callback when reason changes
- onDetailsChange: Function - Callback when details change
- onEvidenceChange: Function - Callback when evidence is added/removed
- onUrgencyChange: Function - Callback when urgency level changes
- onContextChange: Function - Callback when context checkboxes change
- onSubmit: Function - Callback when form is submitted
- onCancel: Function - Callback when form is cancelled
- isLoading: Boolean - Loading state during submission

**Visual Structure:**

```
┌─────────────────────────────────────┐
│  Report Concern            [✕]     │
├─────────────────────────────────────┤
│                                     │
│ Select a reason for your report     │
│ [▼ Harrassment or Threats]          │
│  Includes bullying, stalking,       │
│  threats of violence, hate speech   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ More reasons                    │ │
│ │ [Fraud or Scams]                │ │
│ │ [Inappropriate Content]         │ │
│ │ [Underage User]                 │ │
│ │ [Impersonation]                 │ │
│ │ [Spam or Solicitation]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ When did this happen?               │
│ [.calendar. Feb 15, 2024 ▼]         │
│                                     │
│ Describe what happened              │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ I noticed...                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Add evidence (optional)             │
│ [＋ Add Photos/Videos]              │
│ File preview thumbnails appear here │
│                                     │
│ Is this urgent?                     │
│ ○ Not Urgent  ● Serious  ○ Critical │
│                                     │
│ Additional context                  │
│ ☐ This affected others              │
│ ☐ I've messaged a friend about this │
│ ☐ I feel uncomfortable meeting IRL  │
│ ☐ I've contacted authorities        │
│                                     │
│ [Submit Report] [Cancel]            │
│                                     │
└─────────────────────────────────────┘
```

**Accessibility Features:**

- Proper labeling for all form fields
- Keyboard navigation for dropdown menus
- Alt text for attached evidence thumbnails
- Clear error messaging with suggestions
- Reduced motion option for animations
- High contrast mode support for all elements

**Mobile Optimizations:**

- Full-width touch targets for form controls
- Vertical layout optimized for portrait viewing
- Auto-zoom prevention on form fields
- Gesture-friendly date picker alternative
- Chunked form sections with progress indicators
- Smart keyboard types for different inputs

**Behavior Description:**
When a user opens the ReportForm, they are guided through a step-by-step process to describe their concern. The form provides contextually relevant prompts based on the selected reason. Evidence attachment is encouraged but optional to reduce barriers to reporting. Users can specify urgency levels to help moderators prioritize. Context checkboxes help identify broader issues or personal impacts.

**Copy Stubs:**

- "Report Concern" - Form header
- "Select a reason for your report" - Prompt text
- "Harrassment or Threats" - Default reason option
- "Includes bullying, stalking, threats of violence, hate speech" - Reason description
- "More reasons" - Expandable section for additional options
- "When did this happen?" - Date prompt
- "Describe what happened" - TextArea label
- "I noticed..." - TextArea placeholder
- "Add evidence (optional)" - Evidence section header
- "＋ Add Photos/Videos" - Evidence attachment button
- "File preview thumbnails appear here" - Evidence area description
- "Is this urgent?" - Urgency selector prompt
- "Not Urgent" / "Serious" / "Critical" - Urgency options
- "Additional context" - Checkbox section header
- "This affected others" - Context checkbox option
- "I've messaged a friend about this" - Context checkbox option
- "I feel uncomfortable meeting IRL" - Context checkbox option
- "I've contacted authorities" - Context checkbox option
- "Submit Report" - Submission button
- "Cancel" - Cancellation button

**Validation & Feedback:**

- Real-time validation as users type
- Helpful error messages with corrective suggestions
- Auto-save draft functionality
- Progress indicators for multi-step forms
- Success confirmation with expected response time
- Option to track report status through dashboard

**Privacy Considerations:**

- Clear explanation of what information is shared with whom
- Option to report anonymously where legally permissible
- Consent checkboxes for evidence sharing
- Ability to redact sensitive information from evidence
- Information about data retention and deletion policies

### BlockConfirmationDialog

**Props:**

- targetName: String
- onConfirm: Function
- onCancel: Function
- isLoading: Boolean

**Content:**

- Clear consequences explanation
- Action reversal information
- Alternative suggestions
- Confirmation buttons

### SafetyTipBanner

**Props:**

- tip: SafetyTip object
- onDismiss: Function
- variant: String

**Variants:**

- Preventive (blue)
- Warning (orange)
- Alert (red)
- Educational (purple)

## Visual Design Enhancements

### Color Palette

- Safety Primary: #FF4F00 (Alert Orange)
- Blocked/Restricted: #EF4444 (Danger Red)
- Muted/Cautious: #F59E0B (Warning Amber)
- Protected/Safe: #10B981 (Safe Green)
- Neutral Information: #6B7280 (Gray)

### Safety Status Indicators

- Verified Badge: Blue shield with checkmark
- Reported Badge: Orange exclamation in triangle
- Blocked Badge: Red circle with slash
- Restricted Badge: Yellow triangle with exclamation
- Protected Badge: Green shield with lock

### Typography Approach

- Clear, direct language
- Avoid technical jargon
- Use active voice
- Emphasize user control
- Include consequence clarity

## Mobile Optimization Features

- Thumb-friendly action buttons
- Gestural shortcuts for common actions
- Landscape-optimized reporting forms
- Quick access from conversation headers
- Persistent safety status indicators

## Proactive Safety Features

- Behavior pattern recognition
- Risk level assessment scoring
- Automated warning suggestions
- Community trust network indicators
- Safety check-in reminders

## User Education Components

- Interactive safety walkthrough
- Scenario-based learning modules
- Regular safety tip rotations
- Community guidelines digest
- Incident response flowcharts

## Moderation Support Tools

- Rich context reporting forms
- Standardized classification system
- Evidence preservation workflows
- Escalation pathway visualization
- Resolution feedback loops

## Privacy Preservation

- Anonymous reporting options
- Data minimization in reports
- Clear retention policies
- User consent for investigations
- Transparent moderation process

## Implementation Priority

### Phase 1 (High Priority)

- Enhanced safety drawer with clearer actions
- Additional immediate action options (mute, restrict)
- Improved report form with better context gathering
- Safety status indicators on profiles/messages
- Mobile-optimized safety access points

### Phase 2 (Medium Priority)

- Proactive safety suggestion system
- Interactive safety education components
- Enhanced moderation support tools
- Community trust scoring visibility
- Incident investigation assistance

### Phase 3 (Low Priority)

- AI-powered behavior pattern recognition
- Automated risk assessment scoring
- Advanced safety check-in systems
- Peer safety network features
- Comprehensive incident resolution tracking

## Accessibility Considerations

- High contrast safety indicators
- Screen reader descriptions for all actions
- Keyboard navigation for safety tools
- Clear focus states for interactive elements
- Simple language in all safety communications

## Success Metrics

- Increased reporting of safety concerns
- Faster resolution of reported incidents
- Reduced repeat offenses from blocked users
- Higher user confidence in platform safety
- Improved moderation efficiency scores
- Decreased user anxiety around interactions

## Trust Building Elements

- Transparency in moderation processes
- Clear communication of consequences
- User empowerment in safety decisions
- Community involvement in guidelines
- Regular safety feature updates
- Responsive support team interactions

## Crisis Response Integration

- Immediate escalation pathways
- Temporary protection measures
- Support resource linking
- Family notification options
- Law enforcement coordination procedures
