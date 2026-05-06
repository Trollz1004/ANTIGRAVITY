import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  baseURL: 'http://localhost:5173',
  use: {
    headless: true,
  },
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
