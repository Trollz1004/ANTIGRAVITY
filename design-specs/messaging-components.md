# Messaging Components Specification

## Overview

A comprehensive set of components for enabling secure, accessible, and trust-building communication between community members on YouAndINotAI. These components facilitate genuine connections while maintaining user safety and privacy.

## Component Structure

### MessageThread

Primary container for a conversation between users

### MessageBubble

Individual message display with sender information and content

### MessageInput

Input area for composing and sending messages

### ConversationList

Sidebar or list view of active conversations

### TypingIndicator

Visual indicator showing when contacts are typing

### MessageActions

Dropdown or context menu for message actions (reply, report, etc.)

## Component Specifications

### MessageThread

#### Props

| Prop          | Type           | Required | Description                             |
| ------------- | -------------- | -------- | --------------------------------------- |
| messages      | Array<Message> | Yes      | Array of message objects                |
| participants  | Array<User>    | Yes      | Users in the conversation               |
| currentUser   | User           | Yes      | Currently logged in user                |
| onSendMessage | Function       | Yes      | Callback when user sends a message      |
| onLoadMore    | Function       | No       | Callback to load earlier messages       |
| isLoading     | Boolean        | No       | Whether loading older messages          |
| hasMore       | Boolean        | No       | Whether there are more messages to load |

#### Message Interface

```typescript
interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachments?: Array<Attachment>;
  reactions?: Array<Reaction>;
}

interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name?: string;
  size?: number;
}

interface Reaction {
  emoji: string;
  userIds: Array<string>;
}
```

#### Behavior

- Display messages in chronological order
- Scroll to bottom when new messages arrive
- Show loading indicators when fetching older messages
- Support for message reactions and attachments
- Accessibility-compliant message threading

### MessageBubble

#### Props

| Prop          | Type     | Required | Description                               |
| ------------- | -------- | -------- | ----------------------------------------- |
| message       | Message  | Yes      | Message object to display                 |
| sender        | User     | Yes      | User who sent the message                 |
| isCurrentUser | Boolean  | Yes      | Whether this message is from current user |
| onReaction    | Function | No       | Callback when user reacts to message      |
| onReply       | Function | No       | Callback when user replies to message     |
| onReport      | Function | No       | Callback when user reports message        |

#### Visual Design

- Different styling for current user vs other participants
- Timestamp display with relative time formatting
- Avatar display for participant messages
- Support for text, image, and document attachments
- Reaction display below messages
- Status indicators (sent, delivered, read)

### MessageInput

#### Props

| Prop        | Type     | Required | Description                            |
| ----------- | -------- | -------- | -------------------------------------- |
| onSubmit    | Function | Yes      | Callback when message is submitted     |
| onTyping    | Function | No       | Callback when user starts/stops typing |
| placeholder | String   | No       | Input placeholder text                 |
| disabled    | Boolean  | No       | Whether input is disabled              |
| maxLength   | Number   | No       | Maximum message length                 |

#### Features

- Text input with multiline support
- Emoji picker integration
- Attachment button for images/documents
- Typing indicators
- Send button and Enter key submission
- Character count display
- Draft message persistence

### ConversationList

#### Props

| Prop                  | Type                | Required | Description                             |
| --------------------- | ------------------- | -------- | --------------------------------------- |
| conversations         | Array<Conversation> | Yes      | List of conversation objects            |
| currentConversationId | String              | No       | ID of currently selected conversation   |
| onSelectConversation  | Function            | Yes      | Callback when user selects conversation |
| onArchive             | Function            | No       | Callback to archive conversation        |
| onDelete              | Function            | No       | Callback to delete conversation         |

#### Conversation Interface

```typescript
interface Conversation {
  id: string;
  participants: Array<User>;
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
  lastActive: Date;
}
```

#### Visual Design

- Collapsible sidebar on mobile
- List view with participant names and avatars
- Last message preview with ellipsis
- Unread message counters
- Online status indicators
- Search/filter functionality

### TypingIndicator

#### Props

| Prop    | Type        | Required | Description              |
| ------- | ----------- | -------- | ------------------------ |
| typists | Array<User> | Yes      | Users currently typing   |
| style   | Object      | No       | Custom styling overrides |

#### Behavior

- Display animated ellipsis when users are typing
- Show names of up to 3 typing users
- Collapse additional users into "+X more" format
- Disappear automatically after typing stops
- Accessibility announcement for screen readers

### MessageActions

#### Props

| Prop      | Type     | Required | Description                |
| --------- | -------- | -------- | -------------------------- |
| message   | Message  | Yes      | Message for actions        |
| canReply  | Boolean  | No       | Whether reply is allowed   |
| canReport | Boolean  | No       | Whether report is allowed  |
| canDelete | Boolean  | No       | Whether delete is allowed  |
| onReply   | Function | No       | Callback for reply action  |
| onReport  | Function | No       | Callback for report action |
| onDelete  | Function | No       | Callback for delete action |

#### Features

- Context menu or dropdown for message actions
- Report and block functionality integrated with safety system
- Reply action that quotes original message
- Delete action with confirmation
- Emoji reaction picker

## Design Tokens

### Color Tokens

| Token                        | Value              | Usage                                |
| ---------------------------- | ------------------ | ------------------------------------ |
| `--message-bubble-user-bg`   | `--brand-primary`  | Background for current user messages |
| `--message-bubble-other-bg`  | `--bg-secondary`   | Background for other user messages   |
| `--message-status-sent`      | `--text-tertiary`  | Sent message status color            |
| `--message-status-delivered` | `--color-info`     | Delivered message status color       |
| `--message-status-read`      | `--color-success`  | Read message status color            |
| `--typing-indicator`         | `--text-secondary` | Typing indicator animation color     |

### Typography Tokens

| Token                     | Value                  | Usage                 |
| ------------------------- | ---------------------- | --------------------- |
| `--font-size-message`     | `--font-size-base`     | Regular message text  |
| `--font-size-timestamp`   | `--font-size-xs`       | Timestamp text        |
| `--font-weight-message`   | `--font-weight-normal` | Message text weight   |
| `--font-weight-timestamp` | `--font-weight-medium` | Timestamp text weight |

### Spacing Tokens

| Token                      | Value              | Usage                                |
| -------------------------- | ------------------ | ------------------------------------ |
| `--spacing-message-margin` | `var(--spacing-3)` | Vertical spacing between messages    |
| `--spacing-bubble-padding` | `var(--spacing-3)` | Internal padding for message bubbles |
| `--spacing-thread-padding` | `var(--spacing-4)` | Padding around message thread        |
| `--spacing-input-padding`  | `var(--spacing-3)` | Padding for message input            |

## Accessibility Features

### Keyboard Navigation

- Tab navigation through conversation list
- Up/down arrow keys for message selection
- Enter key to open message actions
- Escape key to close context menus
- Shortcut keys for common actions

### Screen Reader Support

- Proper labeling of message sender and timestamp
- Live region announcements for new messages
- ARIA attributes for message status
- Focus management during message composition
- Alternative text for attachments

### Visual Design for Accessibility

- High contrast message bubbles
- Clear visual distinction between users
- Sufficient color contrast for text
- Resizable text support
- Reduced motion options

## Mobile-First Implementation

### Responsive Behavior

- Single column layout on mobile
- Conversation list becomes overlay on small screens
- Thumb-friendly touch targets (minimum 48px)
- Landscape orientation support
- Progressive disclosure of features

### Performance Optimization

- Virtualized message list rendering
- Image lazy loading with placeholders
- Message batching for large conversations
- Efficient scroll position preservation
- Local storage caching of recent messages

## Trust-Building Features

### Safety Integration

- Report message action connects to safety system
- Block user option within conversations
- Content filtering for inappropriate content
- Emergency contact notification capability
- Conversation history preservation for safety reviews

### Privacy Controls

- End-to-end encryption indicators
- Message retention settings
- Screenshot detection and warnings
- Disappearing message options
- Granular permission controls

### Transparency

- Clear indication of message delivery status
- Visible online/offline status of contacts
- Explicit consent for message receipt
- Transparent data handling policies
- User control over message archives

## Implementation Guidelines

### React Component Structure

```jsx
const MessagingSystem = ({ conversations, currentConversation, currentUser, onSendMessage, onConversationSelect }) => {
  return (
    <div className="messaging-container">
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={onConversationSelect}
      />

      {currentConversation && (
        <MessageThread
          messages={currentConversation.messages}
          participants={currentConversation.participants}
          currentUser={currentUser}
          onSendMessage={onSendMessage}
        />
      )}

      {!currentConversation && <EmptyState message="Select a conversation to start messaging" />}
    </div>
  );
};
```

### State Management

```javascript
const useMessaging = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Message subscription
  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages((prev) => [...prev, ...newMessages]);
    });

    return unsubscribe;
  }, [conversationId]);

  return { messages, isLoading, isTyping };
};
```

## Security Considerations

### Data Protection

- Client-side encryption for sensitive content
- Secure storage of encryption keys
- Regular security audits of messaging infrastructure
- Compliance with data privacy regulations
- Automatic logout after inactivity

### Content Safety

- Automated scanning for prohibited content
- User reporting mechanisms
- Moderator review processes
- Blocking and filtering capabilities
- Age-appropriate content controls

## Testing Requirements

### Unit Tests

- Message rendering with various content types
- Input validation and error handling
- Accessibility feature verification
- Performance with large message volumes
- Security boundary testing

### Integration Tests

- End-to-end message delivery
- Cross-device synchronization
- Safety feature integration
- Privacy setting enforcement
- Performance under network constraints

## Success Metrics

### Engagement Metrics

- Messages sent per active user per day
- Conversation initiation rate
- Response time to messages
- Message attachment usage
- Emoji and reaction utilization

### Safety Metrics

- Report submission rate
- Block usage frequency
- Content violation detection rate
- User safety satisfaction scores
- False positive reporting rate

### Performance Metrics

- Message delivery latency
- Interface load times
- Battery consumption during usage
- Network efficiency measures
- Accessibility compliance scores

---

_Component specification supports YouAndINotAI's mission of genuine community connection while maintaining user safety, privacy, and accessibility as core values._
