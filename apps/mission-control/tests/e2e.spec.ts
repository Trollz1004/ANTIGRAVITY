import { test, expect } from '@playwright/test';

test('page loads with title Mission Control', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveTitle('Mission Control');
});

test('TopBar contains required text', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.locator('[data-testid="topbar"]')).toContainText('#UntilNoKidInNeed');
  await expect(page.locator('[data-testid="topbar"]')).toContainText('OPUSPAWCLAW · MISSION CONTROL');
  await expect(page.locator('[data-testid="topbar"]')).toContainText('BUILT · E1');
});

test('Sidebar renders 8 mode buttons with NEW pills', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  const buttons = ['Mission Control', 'Mission Ledger', 'AI Roundtable', 'Tasks', 'Code Mode', 'Create · Banana', 'Research Mode', 'Chat Mode'];
  for (const btn of buttons) {
    await expect(page.locator('[data-testid="sidebar"]').getByText(btn)).toBeVisible();
  }
  for (const btn of buttons.slice(0,4)) {
    await expect(page.locator('[data-testid="sidebar"]').getByText(btn).locator('..').getByText('NEW')).toBeVisible();
  }
});

test('LAUNCH panel has Ollama text', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByText('Powered by Ollama Local Runtime')).toBeVisible();
});

test('HERMES ROUTER chips', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  const chips = ['hermes', 'hermes-deep', 'cfo', 'code', 'marketing', 'kimi', 'fast'];
  for (const c of chips) {
    await expect(page.getByTestId(`hermes-chip-${c}`)).toBeVisible();
  }
});

test('Code chip POSTs to /hermes/active', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  let body = null;
  await page.route('**/hermes/active', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.getByTestId('hermes-chip-code').click();
  expect(body).toEqual({ model: 'code' });
});

test('Paperclip Worker details', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByText('c7bc9665-3923-4977-acd7-2033838cd56e')).toBeVisible();
  await expect(page.getByText('c:\Antigravity\infra\cloudflare\paperclip-hq.yml')).toBeVisible();
});

test('T5500 stack', async ({ page }) => {
  await page.route('**/health/t5500', async (route) => {
    await route.fulfill({ json: {
      status: 'ok', checked_at: '', latency_ms: 1, error: null,
      details: { host: '192.168.0.15', ok: 4, total: 4, services: [
        { service: 'postgres', status: 'ok', port: 5432, latency_ms: 1, error: null },
        { service: 'qdrant', status: 'ok', port: 6333, latency_ms: 1, error: null },
        { service: 'redis', status: 'ok', port: 6379, latency_ms: 1, error: null },
        { service: 'openclaw_api', status: 'ok', port: 3200, latency_ms: 1, error: null },
      ]}
    }});
  });
  await page.goto('http://localhost:5173/');
  await expect(page.getByText('uandinotai-postgres')).toBeVisible();
  await expect(page.getByText('qdrant vectors')).toBeVisible();
  await expect(page.getByText('redis cache')).toBeVisible();
  await expect(page.getByText('OpenClaw API')).toBeVisible();
});

test('Runbooks list', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.route('**/runbooks/list', async (route) => {
    await route.fulfill({ json: [{ filename: 'x.md', size: 1, mtime: '' }] });
  });
  await expect(page.getByText('x.md')).toBeVisible();
});

test('Task dispatch', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  let body = null;
  await page.route('**/tasks/dispatch', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { task_id: 'abc', queued: true } });
  });
  await page.getByTestId('task-input').fill('test');
  await page.getByTestId('task-send-btn').click();
  expect(body).toEqual({ brief: 'test', agents: [] });
  await expect(page.getByTestId('task-input')).toHaveValue('');
});
