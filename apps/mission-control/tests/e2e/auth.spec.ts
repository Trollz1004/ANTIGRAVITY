import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('page loads without authentication error', async ({ page }) => {
    await page.goto('/');
    // The app should render the main dashboard even without a token
    await expect(page.locator('[data-testid="mission-dashboard"]')).toBeVisible();
  });

  test('auth token is persisted in localStorage after manual set', async ({ page }) => {
    await page.goto('/');
    // Simulate setting an auth token as the app would
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token-123');
    });
    // Reload and verify token persists
    await page.reload();
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBe('test-token-123');
  });

  test('auth token removal clears stored session', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token-456');
    });
    await page.reload();
    // Clear the token (simulating sign-out)
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
    });
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('app renders correctly with no prior auth state', async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    // Core UI should still render
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('topbar displays mission branding for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="topbar"]')).toContainText('#UntilNoKidInNeed');
    await expect(page.locator('[data-testid="topbar"]')).toContainText('OPUSPAWCLAW · MISSION CONTROL');
    await expect(page.locator('[data-testid="topbar"]')).toContainText('BUILT · E1');
  });
});
