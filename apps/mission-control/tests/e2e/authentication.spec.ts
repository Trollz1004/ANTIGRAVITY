import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean, unauthenticated state for each test
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('auth_token'));
    await page.reload();
  });

  test('should display login button when unauthenticated', async ({ page }) => {
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('logout-button')).not.toBeVisible();
  });

  test('should log in successfully and display logout button', async ({ page }) => {
    await page.getByTestId('login-button').click();
    // After login, the page reloads, and the logout button should be visible
    await expect(page.getByTestId('logout-button')).toBeVisible();
    await expect(page.getByTestId('login-button')).not.toBeVisible();
    const membership record = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(membership record).toBe('dummy-jwt-membership record');
  });

  test('should log out successfully and display login button', async ({ page }) => {
    // First, log in
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('logout-button')).toBeVisible();

    // Then, log out
    await page.getByTestId('logout-button').click();
    // After logout, the page reloads, and the login button should be visible
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('logout-button')).not.toBeVisible();
    const membership record = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(membership record).toBeNull();
  });
});
