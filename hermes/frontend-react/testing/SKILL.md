---
name: testing
description: "TDD loops, Playwright automation, unit/integration/e2e, test pyramids."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [testing, tdd, playwright, unit, integration, e2e]
    related_skills: [test-driven-development, frontend-react]
---

# Testing

## When to Use

- Writing unit, integration, or e2e tests
- Setting up test infrastructure
- Test-driven development workflows
- Playwright browser automation

## Quick Reference

| Type | Tool | When |
|------|------|------|
| Unit | Vitest/Jest | Pure functions, hooks |
| Integration | Testing Library | Component behavior |
| E2E | Playwright | Full user flows |
| API | Supertest/Vitest | API routes |
| Visual | Playwright/Chromium | Visual regression |

## Test Pyramid

```
        /  E2E  \         ← Few (critical paths)
       / Integration \    ← Some (feature behavior)
      /   Unit Tests   \  ← Many (logic, edge cases)
     /__________________\
```

## Unit Testing (Vitest)

```ts
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  it('respects max value', () => {
    const { result } = renderHook(() => useCounter(0, { max: 5 }));
    for (let i = 0; i < 10; i++) act(() => result.current.increment());
    expect(result.current.count).toBe(5);
  });
});
```

## Integration Testing (Testing Library)

```tsx
// LoginForm.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

it('shows error on invalid email', async () => {
  render(<LoginForm />);
  const email = screen.getByLabelText(/email/i);
  await userEvent.type(email, 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

## E2E Testing (Playwright)

```ts
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## Playwright Config

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

## Pitfalls

- **Testing implementation details** → Test behavior, not internals
- **Over-mocking** → Use real dependencies when possible
- **Flaky tests** → Add proper waits, avoid `sleep`
- **Missing error states** → Test failure paths too
- **No CI integration** → Tests must run on every PR

## Verification

- [ ] All tests pass locally
- [ ] Tests pass in CI
- [ ] Coverage ≥ 80% for critical paths
- [ ] No flaky tests (run 3x)
- [ ] E2E covers critical user flows
