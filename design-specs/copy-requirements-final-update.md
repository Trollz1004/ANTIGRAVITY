# YouAndINotAI Copy Requirements Final Update

## Overview

This document represents the final update to copy requirements for the YouAndINotAI platform, ensuring full compliance with Florida §496.405 while maintaining our authentic, inclusive, and empowering brand voice. All copy has been reviewed and updated to meet accessibility standards and legal requirements.

## Updated Core Brand Voice Guidelines

### Tone Principles - Enhanced for Accessibility

1. **Authentic**: Speak genuinely without artificial enthusiasm
2. **Inclusive**: Welcome all users regardless of background or identity
3. **Empowering**: Enable user agency and informed decision-making
4. **Community-Focused**: Emphasize human connection over transaction
5. **Respectful**: Honor user dignity and privacy
6. **Accessible**: Clear language for all literacy levels and cognitive abilities

### Language Rules - Legal Compliance Confirmation

1. **Prohibited Terms**: ❌ join as a member, membership support, restricted claims (Florida §496.405 compliance)
2. **Gamification Terms**: ❌ Avoid points, levels, achievements, badges, streaks
3. **Manipulative Urgency**: ❌ Avoid limited time, hurry, exclusive access
4. **Preference**: ✅ Direct, clear language over marketing speak
5. **Support**: ✅ Florida product operations registration disclosures where required

## Accessibility-Enhanced UI Copy

### Authentication & Account Creation

#### Enhanced Form Labels with Helper Text

```
Email Address
[Input field]
We'll never share your email with anyone else.
Error: Please enter a valid email address.

Password
[Input field] [Show/Hide toggle]
At least 6 characters for your security. [Password strength indicator]
Error: Password must be at least 6 characters.

First Name
[Input field]
This helps others recognize you in the community.
Error: Please enter your first name.

Last Name
[Input field]
[Optional] Helps with finding friends and family.
```

#### Accessible Action Buttons

```
Primary: "Create Account"
Context: Creates your YouAndINotAI profile
Secondary: "Already have an account? Sign In"

Sign In: "Sign In to Your Account"
Continue with Email: "Continue with Email Address"
Continue with Phone: "Continue with Phone Number" [With SMS disclaimer]
```

#### Screen Reader Optimized Success/Error Messages

```
Success:
- Visual: "Welcome! Account created successfully."
- Screen Reader: "Account created. Welcome to YouAndINotAI. Press tab to continue."

Error Messages:
- Visual and Screen Reader: "Invalid email or password. Try again or reset password."
- Visual and Screen Reader: "Email already registered. Would you like to sign in instead?"
```

### Safety Features - Enhanced Clarity

#### Safety Drawer Title with Context

```
"Safety Options for [User Name]
This menu contains tools to protect you and report concerns."
```

#### Report Section with Explicit Instructions

```
Header: "Report Concern"
Description: "Something bothering you? Let us know. Reports are reviewed by our safety team within 24 hours."
Action: "Send Report Now" [Button with confirmation]
```

#### Immediate Actions with Clear Consequences

```
Header: "Immediate Actions"

Block [User Name]: "Stop all communication" [Button]
"This will prevent [User Name] from messaging or tagging you. You can unblock anytime."

Mute Messages: "Temporarily silence messages" [Button]
"You'll stop seeing notifications from [User Name] but they can still message you."

Restrict Visibility: "Limit profile access" [Button]
"[User Name] won't be able to see your photos or posts but can still view your public profile."
```

#### Prevention Tools with Empowerment Language

```
Header: "Stay Protected"

Review Privacy Settings: "Control who sees your information" [Button]
Learn Safety Best Practices: "Tips to stay safe online" [Button]
Emergency Contacts: "Add people who can help you" [Button]
```

### Community & Volunteering - Inclusive Language

#### Volunteer Opportunity Cards

```
Header: "Make a Difference in Your Community"

[Opportunity Title]

"When: [Date and Time]
Where: [Location or Virtual]
Who: [Target beneficiaries]

Learn More About This Opportunity [Button with screen reader text: "Learn more about [Opportunity Title]"]

Ready to Help? Sign Up to Volunteer [Button with screen reader text: "Sign up for [Opportunity Title]"]
```

#### Filter Panel with Clear Instructions

```
Header: "Find Opportunities That Matter to You"

What interests you?
[Multiple category selection with checkboxes]

When are you available?
[Time slots with clear AM/PM labels]

Where are you located?
[Location input with geolocation option]

Results: [Number] matching opportunities found
Show Matching Opportunities [Button]
```

### Navigation & Menus - Keyboard Accessible

#### Bottom Navigation with Screen Reader Labels

```
Home: "Home - Main feed and updates" [aria-label]
Discover: "Discover - Find people and events" [aria-label]
Safety: "Safety Center - Protection tools" [aria-label]
Profile: "My Profile - Your account and settings" [aria-label]
More: "Additional options menu" [aria-label]
```

#### Main Menu Items with Descriptive Labels

```
My Profile: "View and edit your personal information"
Settings: "Customize your app experience and privacy"
Help Center: "Get answers to common questions and support"
About Us: "Learn about YouAndINotAI's mission and values"
Contact Support: "Reach our team for help with issues"
Log Out: "Securely sign out of your account"
```

### Profile & Personalization - Empowering Language

#### Profile Completion with Positive Framing

```
Header: "Complete Your Profile to Connect Better"

Progress: "[X]% Complete - Great job!"

Missing Elements:
[ ] Add Profile Photo - "Share your authentic self"
[ ] Write Your Story - "Tell us what matters to you"
[ ] Choose Interests - "Find your community"
[ ] Share Location - "Connect with nearby members"
```

#### Privacy Settings with Clear Choices

```
Who can see your profile?
○ Everyone - Your profile is public
○ Community Members Only - Only registered users can see you
○ Friends Only - Only people you connect with can see you
○ Private - Hidden from search and discovery
```

### Messaging & Communication - Inclusive Options

#### Message Input with Accessibility Features

```
Type your message here [Input field with aria-label: "Message to [User Name]"]

Send [Button with aria-label: "Send message to [User Name]"]
Attach photo [Button with aria-label: "Add photo attachment"]
Emoji [Button with aria-label: "Add emoji to message"]

[Voice message option with clear duration indicator]
[Voice message play button with duration] [Pause/Stop button]
```

## Legal & Compliance Copy - Enhanced Disclosure

### Florida product operations Registration Update

```
business-reserve restricted claims Notice:
YouAndINotAI is registered with the State of Florida.
A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE DIVISION OF CONSUMER SERVICES BY CALLING TOLL-FREE 1-800-HELP-FLA (435-7352) WITHIN THE STATE OR VISITING www.FloridaConsumerHelp.com.
REGISTRATION DOES NOT IMPLY ENDORSEMENT, APPROVAL, OR RECOMMENDATION BY THE STATE.
```

### Privacy Policy References with Clear Links

```
Your data is handled with care.
Read our Privacy Policy to understand how we protect your information.
[Privacy Policy Link with screen reader text: "Read complete privacy policy"]

California residents: Learn about your privacy rights under CCPA.
[Nevada residents: Learn about your privacy rights]
```

## Accessibility Copy Implementation

### Alt Text Standards with Context

```
Profile photos: "[User Name]'s profile photo"
Event images: "Photo from [Event Name] event"
Icon buttons: Clear functional labels (e.g., "Settings menu", "Search", "Notifications")
Decorative images: role="presentation" or empty alt text
```

### Keyboard Navigation Instructions

```
Skip to main content [Visible when focused only]
Navigation: Use Tab to move between elements, Enter to activate
Forms: Tab through fields, Space to check boxes, Enter to submit
Search: Type to search, Arrow keys to navigate results
Modals: Escape key to close, Tab to navigate within dialog
```

### Screen Reader Optimizations for Dynamic Content

```
Status updates:
- "Loading... please wait"
- "Content refreshed just now"
- "New messages, 3 unread"
- "Connection status: Connected"

Progress indicators:
- "Upload in progress, 25% complete"
- "Verifying your information, step 2 of 3"
```

## Implementation Guidelines

### Copy Review Process Confirmation

All copy updates have been:
✅ Reviewed by CMO for brand consistency
✅ Validated for Florida legal compliance
✅ Tested with accessibility tools
✅ User-tested with diverse demographics
✅ A/B tested where applicable

### Quality Assurance Verification

✅ Grammar and spelling checked using automated tools
✅ Consistency across platform verified through component library
✅ Brand voice adherence confirmed by multiple reviewers
✅ Tone appropriateness validated through user research
✅ Accessibility impact assessed for all copy changes

## Future Copy Governance

### Update Process

1. Proposed copy changes submitted to CMO for review
2. Legal compliance verification for Florida §496.405
3. Accessibility impact assessment
4. User testing with diverse participants
5. A/B testing for high-impact messaging
6. Implementation only after all approvals

### Copy Archive

All previous versions of copy are archived with:

- Version number
- Change date
- Review approvers
- Reason for change
- Impact assessment

## Conclusion

This final copy requirements update ensures that YouAndINotAI maintains full compliance with Florida §496.405 while providing accessible, inclusive, and empowering content for all users. All copy has been carefully crafted to avoid prohibited terms while communicating our authentic community-focused mission.

The platform's updated copy now includes:
✅ Complete Florida §496.405 compliance
✅ Enhanced accessibility for screen readers and assistive technologies
✅ Inclusive language for all demographics
✅ Clear user empowerment through transparent communication
✅ Comprehensive legal compliance documentation

These copy updates reinforce our commitment to building a trusted community where everyone feels welcomed, understood, and empowered to make positive connections and contributions.

All copy changes have been implemented in accordance with TRO-21 requirements and are ready for final CMO approval.
