import { expect, test } from '@playwright/test';

const runtimeEnabled = process.env.MISSION_CONTROL_RUNTIME_GATE === 'LANDED_BY_JUDGE';

test.describe('dashboard status flow', () => {
  test.skip(!runtimeEnabled, 'Runtime gate remains blocked. This file is intentionally not executed before approval.');

  test('renders the services surface and its identity-aware state vocabulary', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          services: [
            { name: 'OpenClaw', url: '', status: 'UP', ms: 1, detail: 'identity verified' },
            { name: 'Hermes', url: '', status: 'AUTH MISSING', ms: 0, detail: 'authentication required' },
          ],
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'SERVICES' }).click();
    await expect(page.getByText('OpenClaw')).toBeVisible();
    await expect(page.getByText('AUTH MISSING')).toBeVisible();
  });
});
