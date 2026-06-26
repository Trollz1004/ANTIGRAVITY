import { expect, test } from '@playwright/test';

test('Mission Control memory GUI loads from the bundled server', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Mission Control');
  await expect(page.locator('[data-testid="topbar"]')).toContainText('Business Ops');
  await expect(page.locator('[data-testid="sidebar"]').getByText('Ops Control')).toBeVisible();
  await expect(page.locator('[data-testid="sidebar"]').getByText('Agent Memory')).toBeVisible();
  await expect(page.locator('[data-testid="agent-memory-panel"]')).toContainText('Agent Memory Mesh');
  await expect(page.getByRole('button', { name: /copy boot context/i })).toBeVisible();
});

test('memory endpoints are available from the GUI server', async ({ request }) => {
  const response = await request.get('/memory/status');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.paperclip_excluded).toBe(true);
  expect(body.lanes.some((lane: { id: string }) => lane.id === 'codex')).toBe(true);
  expect(body.nodes.some((node: { id: string }) => node.id === 't5500')).toBe(true);
});
