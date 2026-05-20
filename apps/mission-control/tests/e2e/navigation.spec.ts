import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation & Panel Switching', () => {
  test('sidebar renders all 9 mode buttons', async ({ page }) => {
    await page.goto('/');
    const modes = [
      'Mission Control',
      'Mission Ledger',
      'AI Roundtable',
      'Tasks',
      'Code Mode',
      'Create · Banana',
      'Research Mode',
      'Chat Mode',
      'File Uploads',
    ];
    for (const mode of modes) {
      await expect(
        page.locator('[data-testid="sidebar"]').getByText(mode, { exact: true })
      ).toBeVisible();
    }
  });

  test('NEW badges appear on the correct mode buttons', async ({ page }) => {
    await page.goto('/');
    const newModes = ['Mission Control', 'Mission Ledger', 'AI Roundtable', 'Tasks', 'File Uploads'];
    for (const mode of newModes) {
      const btn = page.locator('[data-testid="sidebar"]').getByText(mode, { exact: true }).locator('..');
      await expect(btn.getByText('NEW')).toBeVisible();
    }
  });

  test('non-NEW modes do not display NEW badges', async ({ page }) => {
    await page.goto('/');
    const noNewModes = ['Code Mode', 'Create · Banana', 'Research Mode', 'Chat Mode'];
    for (const mode of noNewModes) {
      const btn = page.locator('[data-testid="sidebar"]').getByText(mode, { exact: true }).locator('..');
      await expect(btn.getByText('NEW')).toHaveCount(0);
    }
  });

  test('clicking a sidebar mode button switches the active panel', async ({ page }) => {
    await page.goto('/');
    // Default active panel should be Mission Control
    await expect(page.getByText('Powered by Ollama Local Runtime')).toBeVisible();
    // Click Tasks mode
    await page.locator('[data-testid="sidebar"]').getByText('Tasks', { exact: true }).click();
    // The task input should now be visible in the Tasks panel
    await expect(page.getByTestId('task-input')).toBeVisible();
  });

  test('sidebar contains History, DAO, Settings sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="sidebar"]').getByText('History')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]').getByText('Settings')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]').getByText('for the kids · #UntilNoKidInNeed')).toBeVisible();
  });

  test('navigating to File Uploads shows the upload panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="sidebar"]').getByText('File Uploads', { exact: true }).click();
    await expect(page.locator('[data-testid="upload-progress-panel"]')).toBeVisible();
    await expect(page.getByText('Drag \'n\' drop some files here, or click to select files')).toBeVisible();
  });
});
