import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      all: true,
      include: ['**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
        'apps/youandinotai-frontend/**',
      ],
    },
    environment: 'jsdom',
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});