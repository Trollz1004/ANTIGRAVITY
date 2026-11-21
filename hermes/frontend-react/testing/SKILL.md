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
    baseURL: 'http://192.168.0.40:3000',
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

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
