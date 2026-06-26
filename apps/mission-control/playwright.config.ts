import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/tests/e2e.spec.ts',

  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    baseURL: 'http://127.0.0.1:8787',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:8787/health',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
