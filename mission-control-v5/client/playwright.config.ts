import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: process.env.MC_E2E_BASE_URL ?? 'http://127.0.0.1:5173',
  },
  // No webServer block: the runtime gate, not the test runner, controls service startup.
});
