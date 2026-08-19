import { expect, test } from '@playwright/test';

const runtimeEnabled = process.env.MISSION_CONTROL_RUNTIME_GATE === 'LANDED_BY_JUDGE';

test.describe('council read flow', () => {
  test.skip(!runtimeEnabled, 'Runtime gate remains blocked. This file is intentionally not executed before approval.');

  test('renders official seats and immutable records without operational send controls', async ({ page }) => {
    await page.route('**/api/official-votes/view', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          roster: { state: 'signed', bindingEnabled: true },
          seats: [{ platform: 'gemini', label: 'GEMINI', state: 'UP', detail: 'official identity verified' }],
          ballots: [{ id: 'B-1', subject: 'Configuration update', status: 'OPEN', decisions: 1 }],
          events: [{ id: 'E-1', actor: 'official-account', platform: 'gemini', timestamp: '2026-08-19T00:00:00.000Z', subject: 'Configuration update', decision: 'approve', binding: true }],
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'COUNCIL' }).click();
    await expect(page.getByText('OFFICIAL SEATS')).toBeVisible();
    await expect(page.getByText('IMMUTABLE DECISION LOG')).toBeVisible();
    await expect(page.getByText('ROSTER SIGNED')).toBeVisible();
    await expect(page.getByText(/send/i)).toHaveCount(0);
    await expect(page.getByPlaceholder(/message/i)).toHaveCount(0);
  });
});
