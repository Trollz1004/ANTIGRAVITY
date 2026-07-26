---
name: agent-browser
description: |
  Browser automation skill for AI agents. Navigate pages, fill forms,
  click buttons, take screenshots, extract data, and test web apps.
  Use when work depends on rendered DOM state, logged-in dashboards,
  or interactive browser workflows.
metadata:
  version: 1.0.0
  author: antigravity
  category: automation
---

# Agent Browser — Browser Automation

## Purpose

Interact with live web pages, web apps, and Electron desktop apps through
browser automation. Use when static fetch won't work — logged-in states,
forms, SPAs, JavaScript-rendered content, or interactive testing.

## When to Use

- User asks to "open a website", "fill out a form", "click a button"
- Need to test a web app's rendered state
- Need screenshots of live pages
- Scraping JavaScript-rendered content
- Testing Electron apps (VS Code, Slack, Discord, Figma)
- Debugging browser-specific issues
- Checking logged-in dashboards or CMS flows

## Capabilities

### Navigation
- Open URLs
- Click elements (buttons, links, tabs)
- Fill forms (text inputs, dropdowns, checkboxes)
- Submit forms
- Scroll pages
- Navigate back/forward

### Data Extraction
- Get page text content
- Extract HTML structure
- Screenshot full page or specific elements
- Get element attributes and text
- Extract data from tables

### Testing
- Verify element visibility
- Check text content matches expectations
- Validate form states
- Test responsive layouts
- Check console for errors

### Automation
- Multi-step workflows
- Login flows
- File uploads/downloads
- Cookie/session management
- Wait for elements to appear

## Workflow

### Basic Page Interaction
1. Open target URL
2. Wait for page load
3. Identify target elements
4. Perform action (click/fill/extract)
5. Verify result
6. Screenshot if needed

### Web App Testing
1. Navigate to app URL
2. Perform user flow steps
3. Capture state at each step
4. Verify expected outcomes
5. Report results with screenshots

### Dashboard Inspection
1. Navigate to dashboard
2. Handle login if needed
3. Extract relevant metrics
4. Compare against expectations
5. Flag anomalies

## Output Format

```markdown
## Browser Task: [Description]

### Steps Performed
1. [Action] → [Result]
2. [Action] → [Result]

### Findings
- [Observation]

### Screenshots
- [step-name].png

### Issues Found
- [issue description]
```

## Rules

- Don't submit forms with real data without explicit permission
- Take screenshots for evidence (especially for QA tasks)
- Handle errors gracefully — report what happened, don't just fail
- Use caveman mode for status updates during browser work
- Log browser interactions in state.md for session continuity

## Integration

- **With agent-reach:** Use reach for static content, browser for dynamic
- **With caveman:** Compress browser task reports
- **With self-improvement:** Log browser automation patterns that work
