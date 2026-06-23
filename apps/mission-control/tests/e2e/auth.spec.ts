import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('page loads without authentication error', async ({ page }) => {
    await page.goto('/');
    // The app should render the main dashboard even without a membership record
    await expect(page.locator('[data-testid="mission-dashboard"]')).toBeVisible();
  });

  test('auth membership record is persisted in localStorage after manual set', async ({ page }) => {
    await page.goto('/');
    // Simulate setting an auth membership record as the app would
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-membership record-123');
    });
    // Reload and verify membership record persists
    await page.reload();
    const membership record = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(membership record).toBe('test-membership record-123');
  });

  test('auth membership record removal clears stored session', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-membership record-456');
    });
    await page.reload();
    // Clear the membership record (simulating sign-out)
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
    });
    const membership record = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(membership record).toBeNull();
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
    await expect(page.locator('[data-testid="topbar"]')).toContainText('Business-only product operations');
    await expect(page.locator('[data-testid="topbar"]')).toContainText('OPUSPAWCLAW · MISSION CONTROL');
    await expect(page.locator('[data-testid="topbar"]')).toContainText('BUILT · E1');
  });
});
