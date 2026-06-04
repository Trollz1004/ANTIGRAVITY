# YouAndINotAI Design System Implementation Guide

## Overview

This guide provides detailed implementation instructions for the YouAndINotAI design system. It covers setup, component usage, and best practices for developers integrating the design system into the React 19 codebase.

## System Setup

### Installation

The design system is integrated directly into the React codebase as CSS custom properties and React components. No additional installation is required beyond the standard project dependencies.

### CSS Custom Properties

All design tokens are implemented as CSS custom properties in the global stylesheet. These properties are defined in `:root` and scoped variants for dark mode.

```css
:root {
  /* Brand Colors */
  --brand-primary: #ff4f00;
  --brand-secondary: #111111;
  --brand-accent: #fff4ef;

  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-base: 1rem;

  /* Spacing */
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;

  /* And all other tokens from design-system-tokens.md */
}
```

## Component Implementation Guide

### Buttons

#### Primary Button Implementation

```jsx
import React from 'react';
import './Button.css';

const Button = ({ variant = 'primary', size = 'md', disabled = false, children, ...props }) => {
  const className = `btn btn-${variant} btn-${size} ${disabled ? 'btn-disabled' : ''}`;

  return (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
```

```css
/* Button.css */
.btn {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration-normal) var(--transition-easing);
}

.btn:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.btn-primary {
  background-color: var(--brand-primary);
  color: var(--text-inverse);
  border-radius: var(--border-radius-md);
}

.btn-primary:hover:not(.btn-disabled) {
  background-color: color-mix(in srgb, var(--brand-primary) 90%, black);
}

.btn-md {
  padding: var(--spacing-button-padding-v) var(--spacing-button-padding-h);
  font-size: var(--font-size-base);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### IconButton Implementation

```jsx
import React from 'react';
import './IconButton.css';

const IconButton = ({ icon, variant = 'primary', size = 'md', disabled = false, ...props }) => {
  const className = `icon-btn icon-btn-${variant} icon-btn-${size} ${disabled ? 'icon-btn-disabled' : ''}`;

  return (
    <button className={className} disabled={disabled} {...props}>
      <span className={`icon-${icon}`} aria-hidden="true"></span>
    </button>
  );
};

export default IconButton;
```

```css
/* IconButton.css */
.icon-btn {
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration-normal) var(--transition-easing);
  background: none;
}

.icon-btn-md {
  width: var(--spacing-8);
  height: var(--spacing-8);
  font-size: var(--font-size-xl);
}

.icon-btn-primary {
  color: var(--brand-primary);
}

.icon-btn-primary:hover:not(.icon-btn-disabled) {
  color: color-mix(in srgb, var(--brand-primary) 70%, black);
}

.icon-btn:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--border-radius-full);
}
```

### Form Components

#### Text Input Implementation

```jsx
import React from 'react';
import './TextInput.css';

const TextInput = ({ label, error, disabled = false, ...props }) => {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}
      <input
        className={`form-input ${error ? 'form-input-error' : ''} ${disabled ? 'form-input-disabled' : ''}`}
        disabled={disabled}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default TextInput;
```

```css
/* TextInput.css */
.form-field {
  margin-bottom: var(--spacing-4);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-input-padding);
  border: var(--border-width-thin) solid var(--text-secondary);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-color: var(--brand-primary);
}

.form-input-error {
  border-color: var(--color-error);
}

.form-input-disabled {
  background-color: var(--bg-tertiary);
  cursor: not-allowed;
}

.form-error {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-error);
}
```

### Card Components

#### Base Card Implementation

```jsx
import React from 'react';
import './Card.css';

const Card = ({ padding = 'md', elevated = true, children }) => {
  const className = `card ${elevated ? 'card-elevated' : ''} card-padding-${padding}`;

  return (
    <div className={className} role="region">
      {children}
    </div>
  );
};

const CardHeader = ({ children }) => <div className="card-header">{children}</div>;

const CardBody = ({ children }) => <div className="card-body">{children}</div>;

const CardFooter = ({ children }) => <div className="card-footer">{children}</div>;

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
```

```css
/* Card.css */
.card {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.card-elevated {
  box-shadow: var(--shadow-md);
}

.card-padding-none {
  padding: 0;
}

.card-padding-sm {
  padding: var(--spacing-3);
}

.card-padding-md {
  padding: var(--spacing-4);
}

.card-padding-lg {
  padding: var(--spacing-6);
}

.card-header {
  margin-bottom: var(--spacing-4);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.card-body {
  margin-bottom: var(--spacing-4);
  color: var(--text-secondary);
}

.card-footer {
  border-top: var(--border-width-thin) solid var(--bg-secondary);
  padding-top: var(--spacing-4);
  color: var(--text-tertiary);
}
```

## Navigation Components

### Tab Bar Implementation

```jsx
import React from 'react';
import './TabBar.css';

const TabBar = ({ children }) => {
  return (
    <nav className="tab-bar" role="tablist">
      {children}
    </nav>
  );
};

const TabItem = ({ active = false, onClick, children }) => {
  return (
    <button
      className={`tab-item ${active ? 'tab-item-active' : ''}`}
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

TabBar.Item = TabItem;

export default TabBar;
```

```css
/* TabBar.css */
.tab-bar {
  display: flex;
  border-bottom: var(--border-width-thin) solid var(--text-secondary);
  background-color: var(--bg-primary);
}

.tab-item {
  flex: 1;
  padding: var(--spacing-4) var(--spacing-2);
  background: none;
  border: none;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
}

.tab-item:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.tab-item-active {
  color: var(--brand-primary);
}

.tab-item-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--border-width-thick);
  background-color: var(--brand-primary);
}
```

### Bottom Navigation Implementation

```jsx
import React from 'react';
import './BottomNavigation.css';

const BottomNavigation = ({ children }) => {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {children}
    </nav>
  );
};

const NavItem = ({ icon, active = false, onClick, children }) => {
  return (
    <button
      className={`nav-item ${active ? 'nav-item-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`nav-icon icon-${icon}`} aria-hidden="true"></span>
      <span className="nav-label">{children}</span>
    </button>
  );
};

BottomNavigation.Item = NavItem;

export default BottomNavigation;
```

```css
/* BottomNavigation.css */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 56px;
  background-color: var(--bg-primary);
  border-top: var(--border-width-thin) solid var(--bg-secondary);
  z-index: var(--z-index-fixed);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
}

.nav-item:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.nav-item-active {
  color: var(--brand-primary);
}

.nav-icon {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-1);
}

.nav-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
```

## Feature-Specific Components

### Safety Components

#### Safety Drawer Implementation

```jsx
import React from 'react';
import './SafetyDrawer.css';

const SafetyDrawer = ({ open, targetName, onClose, onActionComplete, children }) => {
  if (!open) return null;

  return (
    <div className="safety-drawer-overlay" onClick={onClose}>
      <div
        className="safety-drawer"
        role="dialog"
        aria-labelledby="safety-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="safety-drawer-header">
          <h2 id="safety-drawer-title">Safety Options for {targetName}</h2>
          <button className="safety-drawer-close" onClick={onClose} aria-label="Close safety options">
            <span className="icon-close" aria-hidden="true">
              ×
            </span>
          </button>
        </div>
        <div className="safety-drawer-content">{children}</div>
      </div>
    </div>
  );
};

const ReportSection = () => (
  <section className="safety-section">
    <h3>Report Concern</h3>
    <p>Report inappropriate behavior to our moderation team.</p>
    {/* Report form implementation */}
  </section>
);

const ImmediateActions = () => (
  <section className="safety-section">
    <h3>Immediate Actions</h3>
    <div className="safety-action-buttons">{/* Block, mute, restrict buttons */}</div>
  </section>
);

const PreventionTools = () => (
  <section className="safety-section">
    <h3>Prevention Tools</h3>
    <p>Adjust your privacy settings to prevent similar situations.</p>
    {/* Settings links */}
  </section>
);

SafetyDrawer.ReportSection = ReportSection;
SafetyDrawer.ImmediateActions = ImmediateActions;
SafetyDrawer.PreventionTools = PreventionTools;

export default SafetyDrawer;
```

```css
/* SafetyDrawer.css */
.safety-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: var(--z-index-modal);
}

.safety-drawer {
  background-color: var(--bg-primary);
  border-top-left-radius: var(--border-radius-lg);
  border-top-right-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.safety-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: var(--border-width-thin) solid var(--bg-secondary);
}

.safety-drawer-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full);
}

.safety-drawer-close:hover,
.safety-drawer-close:focus {
  background-color: var(--bg-secondary);
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.safety-section {
  padding: var(--spacing-4);
  border-bottom: var(--border-width-thin) solid var(--bg-secondary);
}

.safety-section:last-child {
  border-bottom: none;
}

.safety-action-buttons {
  display: flex;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}
```

## Responsive Implementation

### Media Queries

The design system implements responsive behavior through CSS media queries that align with our breakpoint tokens:

```css
/* Base mobile-first styles */
.component {
  /* Mobile styles by default */
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .component {
    /* sm breakpoint styles */
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .component {
    /* md breakpoint styles */
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .component {
    /* lg breakpoint styles */
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .component {
    /* xl breakpoint styles */
  }
}
```

### Example Responsive Component

```css
.event-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-4);
  border-radius: var(--border-radius-lg);
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-4);
}

@media (min-width: 768px) {
  .event-card {
    flex-direction: row;
  }

  .event-card-image {
    width: 200px;
    height: 150px;
    margin-right: var(--spacing-4);
  }
}

@media (min-width: 992px) {
  .event-card {
    max-width: 800px;
    margin: 0 auto var(--spacing-4);
  }
}
```

## Accessibility Implementation

### ARIA Attributes

Implement proper ARIA attributes for accessibility:

```jsx
// For interactive elements with complex behavior
<button
  aria-expanded={isOpen}
  aria-controls="menu-content"
  onClick={toggleMenu}
>
  Menu
</button>

// For status messages
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// For error messages
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Focus Management

Implement proper focus management for modals and overlays:

```jsx
import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening modal
      previousFocusRef.current = document.activeElement;

      // Focus the modal when opened
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Return focus to the element that had focus before opening
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    // Cleanup on unmount
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} tabIndex="-1" role="dialog" aria-modal="true">
        {children}
        <button onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </div>
    </div>
  );
};
```

## Performance Best Practices

### Code Splitting

Implement component-level code splitting where appropriate:

```jsx
import React, { Suspense } from 'react';

const LazyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

### Image Optimization

Use responsive images with appropriate sources:

```jsx
const ResponsiveImage = ({ src, alt, sizes = '(max-width: 768px) 100vw, 50vw' }) => (
  <img
    src={src}
    alt={alt}
    srcSet={`${src}-small.jpg 480w, ${src}-medium.jpg 768w, ${src}-large.jpg 1200w`}
    sizes={sizes}
    loading="lazy"
    decoding="async"
  />
);
```

## Testing Guidelines

### Unit Testing Components

Use React Testing Library for component testing:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Testing

Integrate accessibility testing in your workflow:

```jsx
import { axe } from 'jest-axe';

test('should have no accessibility violations', async () => {
  const { container } = render(<Button>Accessible Button</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Deployment Considerations

### CSS Optimization

Ensure CSS is minified and purged in production builds:

```javascript
// webpack.config.js or similar build configuration
module.exports = {
  // ... other config
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new PurgeCSSPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
    }),
  ],
};
```

### Modern CSS Features

Use progressive enhancement with modern CSS features:

```css
.component {
  /* Modern CSS features with fallbacks */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4);

  /* CSS custom properties for theming */
  color: var(--text-primary);
  background-color: var(--bg-primary);

  /* Container queries for responsive components */
  container-type: inline-size;
}

@container (min-width: 400px) {
  .component {
    padding: var(--spacing-6);
  }
}
```

## Maintenance Guidelines

### Version Control

Tag design system releases appropriately:

```bash
# For design system updates
git tag -a v1.2.0 -m "Design system v1.2.0 - Added dark mode support"

# For breaking changes
git tag -a v2.0.0 -m "Design system v2.0.0 - Breaking change: Updated color palette"
```

### Documentation Updates

Update this implementation guide when making changes to:

1. Component APIs
2. CSS architecture
3. Accessibility patterns
4. Performance optimizations
5. Responsive behavior

This guide ensures consistent implementation of the YouAndINotAI design system across all React components while maintaining our commitments to accessibility, mobile-first design, and trust-building through transparent interfaces.
