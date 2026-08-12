/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

/**
 * Injects <link rel="dns-prefetch"> and <link rel="preconnect"> resource hints
 * into the HTML head when a CDN base URL is configured for production builds.
 */
function cdnResourceHintsPlugin(cdnBase: string): Plugin {
  return {
    name: 'cdn-resource-hints',
    enforce: 'post',
    transformIndexHtml(html) {
      if (!cdnBase) return html;
      const origin = new URL(cdnBase).origin;
      const hints = [
        `<link rel="dns-prefetch" href="${origin}">`,
        `<link rel="preconnect" href="${origin}" crossorigin>`,
      ].join('\n    ');
      return html.replace('</head>', `    ${hints}\n  </head>`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const cdnBase = env.VITE_CDN_BASE_URL || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      cdnResourceHintsPlugin(cdnBase),
      visualizer({
        filename: 'bundle-stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }) as Plugin,
    ],
    define: {
      __CDN_BASE_URL__: JSON.stringify(cdnBase),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: cdnBase || undefined,
    server: {
      hmr: false,
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
});
