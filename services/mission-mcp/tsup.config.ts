import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/task-pool-cron.ts'],
  format: ['esm'],
  target: 'node20',
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  loader: {
    '.sql': 'text',
  },
  noExternal: [],
  platform: 'node',
});
