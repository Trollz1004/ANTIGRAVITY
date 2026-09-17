import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      'three/addons/controls/OrbitControls.js': resolve(__dirname, 'tests/mocks/OrbitControls.js'),
      'three/addons/loaders/GLTFLoader.js': resolve(__dirname, 'tests/mocks/GLTFLoader.js'),
      '@pixiv/three-vrm': resolve(__dirname, 'tests/mocks/three-vrm.js'),
    },
  },
})
