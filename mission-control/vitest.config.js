import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // crosslisting-os is a separate app (own package.json, own vitest.config.ts,
    // own env requirements) that happens to live alongside JARVIS in this folder
    // since the repo consolidation (2026-09-17). It runs its own `npm test` in
    // its own directory; it must not be swept into the JARVIS test run.
    exclude: ['**/node_modules/**', '**/crosslisting-os/**'],
  },
  resolve: {
    alias: {
      'three/addons/controls/OrbitControls.js': resolve(__dirname, 'tests/mocks/OrbitControls.js'),
      'three/addons/loaders/GLTFLoader.js': resolve(__dirname, 'tests/mocks/GLTFLoader.js'),
      '@pixiv/three-vrm': resolve(__dirname, 'tests/mocks/three-vrm.js'),
    },
  },
})
