# UserProfileSettings Component Specification

## Component Name

UserProfileSettings

## Overview

A comprehensive settings interface allowing users to manage their profile information, privacy preferences, notification controls, and account configurations. Designed with transparency and user control as core principles to build trust while maintaining accessibility and mobile-first usability.

## Props/State

### Props

| Prop             | Type            | Required | Description                             |
| ---------------- | --------------- | -------- | --------------------------------------- |
| user             | UserProfileData | Yes      | Current user's profile data             |
| onSave           | function        | No       | Callback when user saves changes        |
| onCancel         | function        | No       | Callback when user cancels edits        |
| onDeleteAccount  | function        | No       | Callback to initiate account deletion   |
| onVerifyIdentity | function        | No       | Callback to start identity verification |

### State

| State             | Type    | Description                            |
| ----------------- | ------- | -------------------------------------- |
| editedProfile     | object  | Local copy of profile being edited     |
| activeSection     | string  | Currently visible settings section     |
| isSaving          | boolean | Whether save operation is in progress  |
| saveSuccess       | boolean | Whether last save was successful       |
| saveError         | string  | Error message if save failed           |
| showDeleteConfirm | boolean | Whether delete confirmation is visible |
| showVerifyModal   | boolean | Whether verification modal is visible  |

## Behavior Description

### Initial Load

1. Load current user profile data into editable state
2. Set default active section to "Profile Information"
3. Initialize save states to default values
4. Apply appropriate accessibility attributes

### Interaction Behavior

1. **Section Navigation**: Switch between settings sections
2. **Form Editing**: Real-time validation of input fields
3. **Save Operations**: Validate and submit changes
4. **Account Actions**: Delete account or verify identity
5. **Privacy Controls**: Granular visibility settings

### Responsive Adaptation

1. **Mobile (<768px)**: Single column with accordion sections
2. **Tablet (768px-1024px)**: Two column layout (navigation + content)
3. **Desktop (>1024px)**: Full sidebar navigation with content area

### Performance Optimization

1. Debounced input validation
2. Local state management for immediate feedback
3. Efficient diff checking before save operations
4. Lazy loading of section content

## Copy Stubs

### Section Headers

| Section       | Header                     | Description                             |
| ------------- | -------------------------- | --------------------------------------- |
| Profile       | "Profile Information"      | Name, bio, location, avatar             |
| Privacy       | "Privacy Settings"         | Control who sees what information       |
| Notifications | "Notification Preferences" | Email and push notification settings    |
| Account       | "Account Settings"         | Password, email, verification, deletion |
| Safety        | "Safety & Blocking"        | Block users, report preferences         |

### Form Labels and Placeholders

| Field    | Label             | Placeholder                                 |
| -------- | ----------------- | ------------------------------------------- |
| Name     | "Full Name"       | "Enter your full name"                      |
| Username | "Username"        | "@username"                                 |
| Bio      | "Bio"             | "Tell us about yourself and your interests" |
| Location | "Location"        | "City, State"                               |
| Avatar   | "Profile Picture" | "Upload an image"                           |

### Privacy Settings

| Setting             | Options                           | Description                   |
| ------------------- | --------------------------------- | ----------------------------- |
| Profile Visibility  | Public, Connections Only, Private | Who can see your profile      |
| Name Visibility     | Public, Connections Only, Private | Who can see your full name    |
| Location Visibility | Public, Connections Only, Private | Who can see your location     |
| Bio Visibility      | Public, Connections Only, Private | Who can see your bio          |
| Event Visibility    | Public, Connections Only, Private | Who can see your events       |
| Impact Visibility   | Public, Connections Only, Private | Who can see your impact stats |

### Notification Preferences

| Category        | Options           | Description                                 |
| --------------- | ----------------- | ------------------------------------------- |
| Event Updates   | Email, Push, None | Notifications about events you're attending |
| New Connections | Email, Push, None | When someone connects with you              |
| Messages        | Email, Push, None | When you receive a new message              |
| Community News  | Email, None       | Platform updates and community news         |
| Weekly Digest   | Email, None       | Weekly summary of your activity             |

### Button Text

| Action          | Text                   |
| --------------- | ---------------------- |
| Save Changes    | "Save Changes"         |
| Cancel          | "Cancel"               |
| Delete Account  | "Delete My Account"    |
| Verify Identity | "Verify My Identity"   |
| Change Password | "Change Password"      |
| Update Email    | "Update Email Address" |

### Confirmation Messages

| Action          | Message                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Save Success    | "Your profile has been updated successfully!"                          |
| Save Error      | "There was an error saving your changes. Please try again."            |
| Delete Account  | "Are you sure you want to delete your account? This cannot be undone." |
| Verify Identity | "Identity verification helps build trust in our community."            |

## Accessibility Notes

### Semantic HTML Structure

```jsx
<form className="user-profile-settings" aria-labelledby="settings-title" onSubmit={handleSubmit}>
  <h1 id="settings-title">Profile Settings</h1>

  <nav className="settings-navigation" role="navigation" aria-label="Settings sections">
    <ul role="tablist">
      {settingsSections.map((section) => (
        <li key={section.id}>
          <button
            role="tab"
            aria-selected={activeSection === section.id}
            aria-controls={`section-${section.id}`}
            onClick={() => setActiveSection(section.id)}
            className={activeSection === section.id ? 'active' : ''}
          >
            {section.title}
          </button>
        </li>
      ))}
    </ul>
  </nav>

  <section
    id={`section-${activeSection}`}
    className="settings-content"
    role="tabpanel"
    aria-labelledby={`tab-${activeSection}`}
  >
    {/* Section content based on activeSection */}

    {activeSection === 'profile' && (
      <ProfileInformationSection profile={editedProfile} onChange={handleProfileChange} errors={validationErrors} />
    )}

    {activeSection === 'privacy' && (
      <PrivacySettingsSection privacy={editedProfile.privacySettings} onChange={handlePrivacyChange} />
    )}

    {activeSection === 'notifications' && (
      <NotificationSettingsSection
        notifications={editedProfile.notificationPreferences}
        onChange={handleNotificationChange}
      />
    )}

    {activeSection === 'account' && (
      <AccountSettingsSection
        account={editedProfile.accountInfo}
        onChange={handleAccountChange}
        onDeleteAccount={onDeleteAccount}
        onVerifyIdentity={onVerifyIdentity}
      />
    )}
  </section>

  <footer className="settings-actions">
    <Button type="submit" variant="primary" disabled={isSaving} aria-live="polite">
      {isSaving ? 'Saving...' : 'Save Changes'}
    </Button>

    <Button type="button" variant="secondary" onClick={onCancel}>
      Cancel
    </Button>

    {saveSuccess && (
      <div className="save-success" role="status" aria-live="polite">
        Your profile has been updated successfully!
      </div>
    )}

    {saveError && (
      <div className="save-error" role="alert" aria-live="assertive">
        {saveError}
      </div>
    )}
  </footer>
</form>
```

### Keyboard Navigation

- Tab to navigate through form elements
- Arrow keys to navigate between section tabs
- Enter/Space to activate section tabs
- Escape to close modals
- Form navigation with standard tab order

### Screen Reader Support

- Proper form labeling with htmlFor associations
- ARIA live regions for save status updates
- Descriptive error messages linked to inputs
- Section headings for content organization
- Modal dialog accessibility patterns

### Focus Management

- Visible focus ring using `--focus-ring-color`
- Focus trapped within modals when open
- Return focus after closing modals
- Skip links for efficient navigation

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .settings-animation {
    transition: none;
    animation: none;
  }

  .slide-in-enter,
  .slide-in-exit {
    transform: none;
  }
}
```

## Visual Design Implementation

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Profile Settings                              ← Close  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Profile Information      Privacy Settings              │
│  [Active]                 Notifications                 │
│  Account Settings         Safety & Blocking             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Name                                              │  │
│  │ [Jane Smith_______________________________]       │  │
│  │                                                   │  │
│  │ Username                                          │  │
│  │ [@janesmith_______________________________]       │  │
│  │                                                   │  │
│  │ Bio                                               │  │
│  │ [Tell us about yourself and your interests_______ │  │
│  │ _______________________________________________]  │  │
│  │                                                   │  │
│  │ Location                                          │  │
│  │ [Jacksonville, FL_________________________]       │  │
│  │                                                   │  │
│  │ Profile Picture                                   │  │
│  │ [👤 Avatar] [Upload New] [Remove]                 │  │
│  │                                                   │  │
│  │ [Save Changes] [Cancel]                           │  │
│  │                                                   │  │
│  │ Last saved: Today at 2:30 PM                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────────────────────────┐
│  ← Profile Settings                            ≡│
├─────────────────────────────────────────────────┤
│                                                 │
│  [+] Profile Information                        │
│  [-] Privacy Settings                           │
│      Notifications                              │
│      Account Settings                           │
│      Safety & Blocking                          │
│                                                 │
│  PROFILE INFORMATION                            │
│                                                 │
│  Name                                           │
│  [Jane Smith_________________]                  │
│                                                 │
│  Username                                       │
│  [@janesmith_________________]                  │
│                                                 │
│  Bio                                            │
│  [Tell us about yourself_____                  │
│   _________________________]                    │
│                                                 │
│  [Save Changes] [Cancel]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Design membership records Usage

```css
.user-profile-settings {
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-tertiary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  max-width: 1200px;
  margin: 0 auto;
}

.settings-title {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-6);
  padding: var(--spacing-6) var(--spacing-6) 0;
}

.settings-navigation {
  background-color: var(--bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--text-tertiary);
  padding: 0 var(--spacing-6);
}

.settings-navigation ul {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
  gap: var(--spacing-2);
}

.settings-navigation button {
  background: none;
  border: none;
  border-bottom: var(--border-width-thick) solid transparent;
  color: var(--text-secondary);
  padding: var(--spacing-4) var(--spacing-2);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-easing);
}

.settings-navigation button.active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.settings-navigation button:hover:not(:disabled):not(.active) {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.settings-content {
  padding: var(--spacing-6);
}

.settings-section-title {
  color: var(--text-primary);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-4);
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-label {
  display: block;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-2);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  background-color: var(--bg-primary);
  border: var(--border-width-thin) solid var(--text-secondary);
  border-radius: var(--border-radius-md);
  color: var(--text-primary);
  padding: var(--spacing-input-padding);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-color: var(--brand-primary);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: var(--color-error);
}

.form-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}

.privacy-option {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.privacy-option input[type='radio'] {
  margin-right: var(--spacing-2);
}

.privacy-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}

.settings-actions {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  border-top: var(--border-width-thin) solid var(--text-tertiary);
  background-color: var(--bg-secondary);
}

.save-success {
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  margin-left: var(--spacing-4);
  align-self: center;
}

.save-error {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
  margin-left: var(--spacing-4);
  align-self: center;
}

.delete-account-button {
  background-color: var(--color-error);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  margin-top: var(--spacing-6);
}

.delete-account-button:hover:not(:disabled) {
  background-color: var(--safety-blocked);
}

.verify-identity-button {
  background-color: var(--color-info);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  margin-top: var(--spacing-3);
}

.verify-identity-button:hover:not(:disabled) {
  background-color: var(--privacy-primary);
}
```

## Technical Implementation

### React Component Structure

```jsx
const UserProfileSettings = ({ user, onSave, onCancel, onDeleteAccount, onVerifyIdentity }) => {
  const [editedProfile, setEditedProfile] = useState({ ...user });
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle profile field changes
  const handleProfileChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field if it existed
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle privacy setting changes
  const handlePrivacyChange = (setting, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [setting]: value,
      },
    }));
  };

  // Handle notification preference changes
  const handleNotificationChange = (category, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [category]: value,
      },
    }));
  };

  // Validate form before saving
  const validateForm = () => {
    const errors = {};

    // Validate required fields
    if (!editedProfile.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!editedProfile.username.trim()) {
      errors.username = 'Username is required';
    } else if (editedProfile.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      if (onSave) {
        await onSave(editedProfile);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm account deletion
  const confirmDeleteAccount = async () => {
    if (onDeleteAccount) {
      await onDeleteAccount();
    }
    setShowDeleteConfirm(false);
  };

  // Handle identity verification
  const handleVerifyIdentity = () => {
    setShowVerifyModal(true);
  };

  return (
    <form className="user-profile-settings" aria-labelledby="settings-title" onSubmit={handleSubmit}>
      <div className="settings-header">
        <h1 id="settings-title">Profile Settings</h1>
        <IconButton icon="close" onClick={onCancel} aria-label="Close settings" />
      </div>

      <nav className="settings-navigation" role="navigation" aria-label="Settings sections">
        <ul role="tablist">
          {['profile', 'privacy', 'notifications', 'account', 'safety'].map((section) => (
            <li key={section}>
              <button
                role="tab"
                aria-selected={activeSection === section}
                aria-controls={`section-${section}`}
                onClick={() => setActiveSection(section)}
                className={activeSection === section ? 'active' : ''}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section
        id={`section-${activeSection}`}
        className="settings-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeSection}`}
      >
        {activeSection === 'profile' && (
          <ProfileInformationSection profile={editedProfile} onChange={handleProfileChange} errors={validationErrors} />
        )}

        {activeSection === 'privacy' && (
          <PrivacySettingsSection privacy={editedProfile.privacySettings} onChange={handlePrivacyChange} />
        )}

        {activeSection === 'notifications' && (
          <NotificationSettingsSection
            notifications={editedProfile.notificationPreferences}
            onChange={handleNotificationChange}
          />
        )}

        {activeSection === 'account' && (
          <AccountSettingsSection
            account={editedProfile.accountInfo}
            onChange={handleAccountChange}
            onDeleteAccount={handleDeleteAccount}
            onVerifyIdentity={handleVerifyIdentity}
          />
        )}

        {activeSection === 'safety' && (
          <SafetySettingsSection
            blockedUsers={editedProfile.blockedUsers}
            onUnblockUser={handleUnblockUser}
            onReportSettingsChange={handleReportSettingsChange}
          />
        )}
      </section>

      <footer className="settings-actions">
        <Button type="submit" variant="primary" disabled={isSaving} aria-live="polite">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        {saveSuccess && (
          <div className="save-success" role="status" aria-live="polite">
            Your profile has been updated successfully!
          </div>
        )}

        {saveError && (
          <div className="save-error" role="alert" aria-live="assertive">
            {saveError}
          </div>
        )}
      </footer>

      {showDeleteConfirm && (
        <DeleteConfirmationModal onConfirm={confirmDeleteAccount} onCancel={() => setShowDeleteConfirm(false)} />
      )}

      {showVerifyModal && (
        <IdentityVerificationModal
          onComplete={() => setShowVerifyModal(false)}
          onCancel={() => setShowVerifyModal(false)}
        />
      )}
    </form>
  );
};
```

### Form Validation Hooks

```jsx
// Custom hook for form validation
const useProfileValidation = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isValid = () => {
    const fieldErrors = {};
    Object.keys(values).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) fieldErrors[name] = error;
    });
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid,
    setValues,
  };
};
```

## Dependencies

- React 19 (front-end framework)
- Design system membership records (CSS variables)
- Form validation utilities
- Modal and dialog components
- Icons from design system
- CSS animations and transitions

## Testing Requirements

1. Unit tests for form validation logic
2. Accessibility audit with screen readers
3. Cross-browser compatibility verification
4. Mobile responsiveness testing
5. Performance testing with large form datasets
6. Keyboard navigation testing
7. Focus management validation
8. Error handling and recovery testing

## Integration Requirements

### For CTO (b02a21c7)

1. API endpoints for profile update and retrieval
2. Image upload and optimization service
3. Account deletion workflow and data purging
4. Identity verification integration
5. Notification preference management
6. Privacy setting enforcement at API level

### For CMO (2c40ae74)

1. Copy approval for all settings-related text
2. Brand voice alignment for form labels
3. Legal compliance verification for privacy settings
4. Translation requirements for international users
5. Messaging consistency for account actions

## Success Metrics Framework

### User Engagement Metrics

- Settings completion rate per user
- Time spent in settings per session
- Most frequently modified settings
- Settings save success rate
- Form abandonment rate

### Trust Indicators

- Privacy setting adjustment frequency
- Account verification initiation rate
- Identity verification completion rate
- Notification preference customization
- Safety feature utilization

### Technical Performance

- Form load time < 500ms
- Save operation response time < 1 second
- Validation feedback time < 200ms
- Accessibility audit score > 95%
- Mobile Lighthouse performance > 85

### User Satisfaction

- Settings usability survey scores
- Support tickets related to settings confusion
- Feature request frequency for settings
- Account deletion rate (should be low)
- Identity verification satisfaction ratings

---

_Component specification empowers users with control over their digital identity while maintaining YouAndINotAI's commitment to privacy, safety, and accessibility._
